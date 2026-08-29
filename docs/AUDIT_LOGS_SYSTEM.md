# Audit Logs System Architecture & Developer Guide

This document describes the production-ready **Audit Logs System** implemented for the marketplace.

---

## 1. Overview & Security Principles

Audit Logs serve as an **immutable, append-only security record** tracking administrative decisions, security events, user moderation, and business status transitions across the platform.

### Security Directives
1. **Server-Side Only**: Audit records are created strictly by trusted backend logic and domain event listeners. Frontend requests cannot directly write or spoof actor, timestamp, IP, or change data.
2. **Append-Only**: There are **no API endpoints or UI controls** for updating or deleting historical audit records.
3. **Data Sanitization**: Sensitive keys (`password`, `token`, `secret`, `authorization`, `creditCard`, `cvv`, etc.) are automatically redacted server-side before persisting payloads.
4. **RBAC Control**: Viewing logs requires `admin`, `super_admin`, or `moderator` roles with `{ resource: 'admin_log', action: 'read' }` permissions. CSV export requires `{ resource: 'admin_log', action: 'export' }`.

---

## 2. Architecture & Data Flow

```text
       Business Action / API Call
                   │
                   ▼
     ┌───────────────────────────┐
     │ Domain Event / Controller │
     └─────────────┬─────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
┌──────────────────┐  ┌─────────────┐
│ AuditEventListen │  │ Direct Call │
└────────┬─────────┘  └──────┬──────┘
         │                   │
         └─────────┬─────────┘
                   ▼
       ┌───────────────────────┐
       │   AdminLogsService    │
       │ (Sanitize & Calc Diff)│
       └───────────┬───────────┘
                   ▼
       ┌───────────────────────┐
       │ PostgreSQL (admin_logs│
       └───────────────────────┘
```

---

## 3. Database Schema

Model in `prisma/schema.prisma` mapped to PostgreSQL table `admin_logs`:

```prisma
model AdminLog {
  id          String   @id @default(uuid()) @db.Uuid
  actorId     String   @map("actor_id") @db.Uuid
  actorType   String   @default("USER") @map("actor_type") @db.VarChar(30)
  action      String   @db.VarChar(100)
  resource    String   @db.VarChar(50)
  resourceId  String?  @map("resource_id") @db.Uuid
  description String?  @map("description")
  metadata    Json?
  changes     Json?
  ipAddress   String?  @map("ip_address") @db.VarChar(45)
  userAgent   String?  @map("user_agent") @db.VarChar(500)
  status      String   @default("SUCCESS") @map("status") @db.VarChar(20)
  createdAt   DateTime @default(now()) @map("created_at")
  actor       User     @relation(fields: [actorId], references: [id])

  @@index([actorId, createdAt(sort: Desc)])
  @@index([resource, resourceId])
  @@index([action, createdAt(sort: Desc)])
  @@index([status, createdAt(sort: Desc)])
  @@index([createdAt(sort: Desc)])
  @@map("admin_logs")
}
```

---

## 4. Centralized Action Taxonomy (`AuditAction`)

Action constants are defined in `services/api/src/modules/admin-logs/audit-action.enum.ts`:

- **Auth / Security**: `ADMIN_LOGIN_SUCCESS`, `ADMIN_LOGIN_FAILED`, `ADMIN_LOGOUT`, `PERMISSION_DENIED`, `SECURITY_SETTING_CHANGED`
- **Users**: `USER_CREATED`, `USER_UPDATED`, `USER_SUSPENDED`, `USER_REACTIVATED`, `USER_DELETED`, `USER_ROLE_CHANGED`, `USER_VERIFICATION_CHANGED`
- **Listings**: `LISTING_CREATED`, `LISTING_SUBMITTED`, `LISTING_APPROVED`, `LISTING_REJECTED`, `LISTING_UPDATED`, `LISTING_STATUS_CHANGED`, `LISTING_PUBLISHED`, `LISTING_UNPUBLISHED`, `LISTING_DELETED`
- **Moderation**: `REPORT_CREATED`, `REPORT_REVIEWED`, `REPORT_RESOLVED`, `CONTENT_REMOVED`, `CONTENT_RESTORED`, `MODERATION_ACTION_TAKEN`, `USER_RESTRICTED`, `USER_WARNING_ISSUED`
- **Orders & Rentals**: `ORDER_CREATED`, `ORDER_STATUS_CHANGED`, `RENTAL_STATUS_CHANGED`, `CUSTOM_ORDER_STATUS_CHANGED`
- **Chat Moderation**: `CONVERSATION_RESTRICTED`, `MESSAGE_REMOVED`, `USER_BLOCKED`, `CHAT_MODERATION_ACTION`

---

## 5. Developer Usage Guide

### Method A: Emitting Domain Events (Recommended for decoupled logic)

Emit a domain event using `EventEmitter2`:

```ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class MyFeatureService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async approveItem(itemId: string, adminId: string) {
    // Perform domain logic...

    // Emit event -> AuditEventListener catches and stores log
    this.eventEmitter.emit('listing.approved', {
      listingId: itemId,
      adminId: adminId,
      previousStatus: 'PENDING_REVIEW',
    });
  }
}
```

### Method B: Calling `AdminLogsService` directly

```ts
import { Injectable } from '@nestjs/common';
import { AdminLogsService } from '../admin-logs/admin-logs.service';
import { AuditAction, AuditResourceType } from '../admin-logs/audit-action.enum';

@Injectable()
export class MyFeatureService {
  constructor(private readonly adminLogsService: AdminLogsService) {}

  async updateSettings(adminId: string, beforeState: any, afterState: any) {
    await this.adminLogsService.createLog({
      actorId: adminId,
      actorType: 'ADMIN',
      action: AuditAction.SYSTEM_SETTING_CHANGED,
      resource: AuditResourceType.SYSTEM_SETTING,
      description: 'Updated marketplace platform fees',
      beforeState,
      afterState,
    });
  }
}
```

---

## 6. Retention & Archiving Strategy

1. **Active Table**: Records remain in `admin_logs` indexed by `createdAt` for fast sub-millisecond paginated queries.
2. **Archiving Policy**: For high-volume production, records older than **365 days** can be safely exported to cold storage (S3 / Parquet) via scheduled BullMQ cron jobs without dropping table constraints or indexes.

---

## 7. Admin UI & Export

- Path: `/admin/audit-logs`
- Component: `<AuditLogsTable />` with `<AuditLogDetailDrawer />`
- Export: `GET /api/v1/admin/audit-logs/export` generates CSV files filtered by date, action, resource, or actor.
