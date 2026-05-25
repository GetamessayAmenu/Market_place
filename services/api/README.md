# @marketplace/api

NestJS modular monolith — **Controller → Service → Repository → Database**.

## Phase 3 (current)

- NestJS bootstrap (`main.ts`) with URI versioning (`/api/v1/...`)
- Global validation pipe, exception filters, response envelope interceptor
- Infrastructure: config (Zod via `@marketplace/config`), Prisma, Redis, Pino logging, BullMQ, EventEmitter
- RBAC: `@Public()`, `@Roles()`, `@Permissions()`, `JwtAuthGuard`, `RolesGuard`, `PermissionsGuard`
- `BaseRepository` abstraction for domain repositories (Phase 4+)
- Health check: `GET /api/v1/health` (public)

## Run

```bash
# From repo root — ensure Postgres (5433) and Redis are up
docker compose -f infra/docker/docker-compose.base.yml up -d

cp services/api/.env.example services/api/.env
npm install
npm run build --workspace=@marketplace/api
npm run dev --workspace=@marketplace/api
```

## Later phases

- **Phase 4:** Auth (JWT strategy, registration, refresh tokens)
- **Phase 5:** Listings CRUD
- **Phase 6:** Meilisearch indexing
