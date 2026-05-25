# Prisma

Shared PostgreSQL schema for the marketplace platform.

## Setup

```bash
# Start PostgreSQL (from repo root)
docker compose -f infra/docker/docker-compose.base.yml up -d postgres

# Configure connection
cp prisma/.env.example prisma/.env

# Apply migrations & generate client
npm run db:migrate
npm run db:generate

# Seed roles & permissions
npm run db:seed
```

## Commands (root)

| Script | Description |
|--------|-------------|
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Create/apply dev migrations |
| `npm run db:migrate:deploy` | Apply migrations (production) |
| `npm run db:seed` | Seed roles & permissions |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:validate` | Validate schema |

## Conventions

- **IDs:** UUID v4 via `@default(uuid())` + `@db.Uuid`
- **Timestamps:** `createdAt` / `updatedAt` on all mutable entities
- **Soft delete:** `deletedAt` on User, Category, Listing, ListingImage, Conversation, Message, VerificationRequest
- **Table names:** snake_case via `@@map`
- **Column names:** snake_case via `@map`

## Entities

User, Role, Permission, Category, Listing, ListingImage, Favorite, Conversation, Message, Report, Notification, AdminLog, VerificationRequest

`guest` is not persisted — it represents unauthenticated access only.
