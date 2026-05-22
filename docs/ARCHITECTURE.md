# Phase 1 — Monorepo Architecture

## Dependency Flow (strict)

```
apps/web, apps/admin
    └── @marketplace/ui, types, utils, config

services/api, services/realtime
    └── @marketplace/types, utils, config

packages/ui
    └── (peer) react — no dependency on types/utils

packages/utils
    └── (standalone pure functions)

packages/types
    └── (standalone type definitions)

packages/config
    └── zod only
```

**Rule:** `types` and `utils` must never import from `config`, `ui`, apps, or services.  
**Rule:** Apps must not import from `services/*` directly — only via HTTP/WebSocket APIs.

## Import Strategy

| Consumer | Import path |
|----------|-------------|
| Shared types | `@marketplace/types` or `@marketplace/types/auth` |
| Env validation | `@marketplace/config` or `@marketplace/config/env` |
| Utilities | `@marketplace/utils` or `@marketplace/utils/slug` |
| UI primitives | `@marketplace/ui` |

## Module Boundaries (future phases)

| Package | Responsibility |
|---------|----------------|
| `services/api` | REST, Prisma, BullMQ, domain modules |
| `services/realtime` | Socket.IO, presence, chat |
| `apps/web` | SEO, SSR, buyer/seller UX |
| `apps/admin` | Moderation, audit, RBAC UI |
| `packages/types` | Cross-boundary contracts only |
| `packages/config` | Constants + env schemas |

## Scalability Notes

- **Extractable services:** `api` and `realtime` are separate workspace packages ready for independent deploy.
- **Shared kernel:** `types`, `config`, `utils` version with the monorepo; publishable later if needed.
- **Prisma at root:** Single schema source of truth for all DB access (modular monolith).
- **Turbo pipeline:** `^build` ensures packages compile before dependents.
