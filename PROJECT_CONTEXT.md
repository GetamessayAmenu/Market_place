# Project Context

Living record of implementation progress. Updated after each phase.

**Last updated:** Phase 5 (2026-05-25)

---

## Current System Status

| Layer | Status |
|-------|--------|
| Monorepo / shared packages | Ready |
| Database (PostgreSQL + Prisma) | Schema migrated, seeded |
| API (`services/api`) | NestJS + auth + listings/catalog/uploads |
| Realtime (`services/realtime`) | Stub only |
| Web / Admin apps | Stub only |
| Search, chat | Not started (Phases 6–7) |

**Next:** Phase 6 — (awaiting confirmation)

---

## Phase 1 — Monorepo Foundation

### Implemented
- Turborepo monorepo with npm workspaces (`apps/*`, `services/*`, `packages/*`)
- Strict TypeScript (`@marketplace/typescript-config`), ESLint flat config, Prettier
- Shared packages: `config`, `types`, `utils`, `ui`
- App/service placeholders: `apps/web`, `apps/admin`, `services/api`, `services/realtime`
- Env strategy (Zod schemas, `.env.example` per app/service)
- Infra skeleton: Docker Compose base, nginx config, `bootstrap-dev.sh`

### Modules added
- `@marketplace/config`, `@marketplace/types`, `@marketplace/utils`, `@marketplace/ui`
- `@marketplace/typescript-config`, `@marketplace/eslint-config` (tooling)

### Database changes
- None (Prisma folder placeholder only)

### API endpoints
- None

### Architecture decisions
- **Modular monolith** target; `api` and `realtime` as separate deployable workspaces
- **Acyclic package deps:** `types`/`utils` are leaves; apps never import `services/*`
- **Env validation** centralized in `@marketplace/config` (Zod at bootstrap)
- **Import paths:** `@marketplace/{package}` workspace protocol

---

## Phase 2 — Database + Prisma Foundation

### Implemented
- `prisma/schema.prisma` — full domain schema
- Initial migration `20250522120000_init`
- `prisma/seed.ts` — roles + permissions
- Root scripts: `db:generate`, `db:migrate`, `db:migrate:deploy`, `db:seed`, `db:validate`, `db:studio`
- PostgreSQL in Docker Compose (host port **5433**)
- `infra/scripts/db-migrate.sh` for CLI when host port unavailable

### Modules added
- None (Prisma at repo root; client via `@prisma/client` on root package)

### Database changes
- **14 tables:** `users`, `roles`, `permissions`, `role_permissions`, `categories`, `listings`, `listing_images`, `favorites`, `conversations`, `messages`, `reports`, `notifications`, `admin_logs`, `verification_requests`
- **UUID PKs** (`@db.Uuid`), `created_at` / `updated_at` on mutable entities
- **Soft delete** (`deleted_at`): User, Category, Listing, ListingImage, Conversation, Message, VerificationRequest
- **Seed data:** 6 roles (`buyer`, `seller`, `moderator`, `admin`, `super_admin`, `support`), 20 permissions
- `guest` role not persisted (unauthenticated only)

### API endpoints
- None

### Architecture decisions
- **Single Prisma schema** at `/prisma` shared by `services/api` (modular monolith)
- **Snake_case** DB columns/tables via `@map` / `@@map`
- **RBAC model:** Role ↔ Permission (M:N), User → Role
- **Conversation uniqueness:** `(listing_id, buyer_id, seller_id)`
- **Postgres host port 5433** to avoid conflict with local `:5432`

---

## Phase 3 — NestJS Backend Core

### Implemented
- NestJS bootstrap (`src/main.ts`): URI versioning `/api/v1`, helmet, compression, CORS, dotenv
- Global `ValidationPipe`, `AllExceptionsFilter`, `PrismaExceptionFilter`, `TransformResponseInterceptor`
- **Infrastructure module:** config (`ApiConfigService` + Zod), Prisma, Redis (ioredis), Pino logging, BullMQ (4 queues), EventEmitter
- **RBAC:** `@Public()`, `@Roles()`, `@Permissions()`, `JwtAuthGuard` (global), `RolesGuard`, `PermissionsGuard`, `@CurrentUser()`
- **Abstractions:** `BaseRepository`, `DomainEvent` base, `PaginationQueryDto`, `toPaginatedResponse()`
- **Health module:** `GET /api/v1/health` (public) — DB + Redis checks

### Modules added (services/api)
- `infrastructure/` — config, database, redis, logging, queue, events
- `common/` — decorators, guards, filters, interceptors, dto, interfaces
- `modules/health/`

### Database changes
- None

### API endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1` | Public | Service metadata |
| GET | `/api/v1/health` | Public | Liveness (Postgres + Redis) |

### Architecture decisions
- **Controller → Service → Repository → DB** enforced; health logic in `HealthService` only
- **Standard API envelope:** `{ success, data }` / `{ success: false, error, timestamp, path? }` via `@marketplace/types`
- **JWT guard** requires `request.user` (populated in Phase 4); public routes via `@Public()`
- **BullMQ queue names** reserved: `notifications`, `search-index`, `email`, `moderation`
- **`@marketplace/config`** built as CommonJS for Nest runtime compatibility
- Root **`rxjs` override** to avoid duplicate Observable types in monorepo

---

## Phase 4 — Authentication System

### Implemented
- **Auth module:** register, login, refresh (rotation), logout, me
- **Password security:** Argon2id hashing
- **JWT access tokens** (Bearer + HttpOnly `access_token` cookie) with `jti` blacklist
- **Opaque refresh tokens** in HttpOnly `refresh_token` cookie + Redis session store
- **Session tracking:** device info (IP, user-agent), rotation detection (`suspicious` flag on reuse)
- **RBAC:** role + permission loading per request via `JwtAccessStrategy`; `@Roles()` / `@Permissions()` guards
- **Verification structure:** email/phone tokens (Redis + `verification_requests` table)
- **Rate limiting hooks:** `@RateLimit()` + `RateLimitGuard` on auth routes
- **Cookie strategy:** secure + SameSite=lax in staging/production; `cookie-parser` middleware

### Modules added (services/api)
- `modules/auth/` — controller, service, repository, strategies, DTOs, utils, verification
- `modules/users/` — repository, service
- `modules/roles/` — repository, service
- `modules/permissions/` — repository, service
- `modules/sessions/` — Redis repository + service

### Database changes
- None (uses existing `users`, `roles`, `permissions`, `verification_requests`)

### API endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | Public | Register (default role: buyer) |
| POST | `/api/v1/auth/login` | Public | Login |
| POST | `/api/v1/auth/refresh` | Refresh cookie | Rotate refresh token, new access token |
| POST | `/api/v1/auth/logout` | JWT | Invalidate session + blacklist access token |
| GET | `/api/v1/auth/me` | JWT | Current user profile |

### Security architecture
- **Refresh token rotation** with old token invalidation on each refresh
- **Redis keys:** `mp:session:*`, `mp:refresh:*`, `mp:blacklist:access:*`, `mp:user:sessions:*`, `mp:verification:*`
- **Auth errors:** centralized exceptions (`INVALID_CREDENTIALS`, `SESSION_INVALID`, `ACCOUNT_SUSPENDED`, etc.)
- **Register default status:** `pending_verification` + email verification token (dev returns token in response)

---

## Phase 5 — Marketplace Listings System

### Implemented
- **Listings module:** CRUD, soft/hard delete, seller ownership guard, status transitions (publish, sold, renew, hide), pagination + filters, SEO slugs, view counter, spam/moderation event hooks
- **Categories module:** hierarchical tree, slug lookup, admin CRUD (`category:manage`)
- **Favorites module:** add/remove favorite, paginated user favorites, favorite counts on listings
- **Uploads module:** Cloudinary signed upload, file validation, image delete, transformation URLs
- **Redis cache hooks:** popular/homepage/category invalidation keys (structure only)
- **Analytics hooks:** `ListingAnalyticsListener` + domain events (views, favorites, contact clicks)
- **Optional JWT** on public listing reads (`@OptionalAuth()`) for personalized favorite state

### Schema changes (minimal)
- `listings.is_featured` (boolean, default false)
- `listings.contact_options` (JSONB — phone, WhatsApp, Telegram, in-app messaging)
- Migration: `20250525120000_listing_contact_featured`

### Listing statuses (Prisma ↔ API aliases)
| Prisma enum | Business alias |
|-------------|----------------|
| `active` | ACTIVE |
| `sold` | SOLD |
| `archived` | HIDDEN |
| `pending_review` | PENDING |
| `rejected` | REJECTED |
| `expired` | EXPIRED |
| `draft` | (seller draft) |

### Modules added (services/api)
- `modules/listings/` — controller, service, repository, DTOs, guards, policies, serializer, events, cache, analytics listener
- `modules/categories/`
- `modules/favorites/`
- `modules/uploads/`

### API endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/listings` | `listing:create` | Create listing (`pending_review`) |
| GET | `/api/v1/listings` | Public (+ optional JWT) | Paginated active listings + filters |
| GET | `/api/v1/listings/:id` | Public (+ optional JWT) | Single listing (+ view count) |
| PATCH | `/api/v1/listings/:id` | Owner / moderator | Update listing |
| DELETE | `/api/v1/listings/:id` | Owner / moderator | Soft delete (`?hard=true` for hard delete) |
| POST | `/api/v1/listings/:id/favorite` | JWT | Save favorite |
| DELETE | `/api/v1/listings/:id/favorite` | JWT | Remove favorite |
| POST | `/api/v1/listings/:id/sold` | Owner | Mark sold |
| POST | `/api/v1/listings/:id/renew` | Owner | Renew (active + new expiry) |
| POST | `/api/v1/listings/:id/hide` | Owner | Archive (hidden) |
| POST | `/api/v1/listings/:id/publish` | Owner / moderator | Set active |
| GET | `/api/v1/users/:id/listings` | Public (+ optional JWT) | Seller listings |
| GET | `/api/v1/favorites` | JWT | User's favorited listings |
| GET | `/api/v1/categories` | Public | Category tree |
| GET | `/api/v1/categories/:slug` | Public | Category + children |
| POST/PATCH/DELETE | `/api/v1/categories/...` | `category:manage` | Admin category CRUD |
| POST | `/api/v1/uploads/sign` | `listing:create` | Cloudinary signed upload params |
| POST | `/api/v1/uploads/validate` | `listing:create` | Validate mime/size before upload |

### Filters (GET `/listings`)
- `categoryId`, `categorySlug`, `city`, `condition`, `status`, `featured`, `sellerVerified`, `minPrice`, `maxPrice`, `search`, `sortBy` (`newest` \| `oldest` \| `price_asc` \| `price_desc`), `page`, `limit`

### Architecture decisions
- **Status mapping** uses existing Prisma `ListingStatus` enum; `archived` = hidden visibility
- **Favorites count** computed via Prisma `_count.favorites` (no denormalized column yet)
- **Seller verification filter** uses `emailVerifiedAt` / `phoneVerifiedAt` on seller
- **Default listing TTL:** 30 days (`LISTING_DEFAULT_TTL_DAYS`); renew resets `expiresAt`
- **Images** stored in `listing_images` with `cloudinary_public_id`; uploads must use folder `marketplace/listings`
- **Contact options** JSON: `{ showPhone?, whatsapp?, telegram?, inAppMessaging? }`
- **Event names** under `listing.*` for future BullMQ/analytics workers
- **Global `JwtAuthGuard`** now uses Passport `jwt-access` strategy
