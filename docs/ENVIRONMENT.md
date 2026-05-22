# Environment Strategy

## Principles

1. **Validate at bootstrap** — Each service calls Zod parsers from `@marketplace/config` once at startup.
2. **Never scatter `process.env`** — Business modules receive typed config via DI (NestJS) or validated env objects (Next.js).
3. **Secrets stay server-side** — Only `NEXT_PUBLIC_*` variables are exposed to browsers.
4. **Layered schemas** — `baseEnvSchema` → service-specific extensions (`apiEnvSchema`, `webEnvSchema`).

## File Layout

| File | Purpose |
|------|---------|
| `.env.example` | Root template (documentation only) |
| `apps/web/.env.example` | Next.js public + server vars |
| `apps/admin/.env.example` | Admin app vars |
| `services/api/.env.example` | API secrets & integrations |
| `services/realtime/.env.example` | WebSocket service vars |

## Local Development

Copy examples to `.env` / `.env.local` per app (never commit `.env`).

```bash
cp .env.example .env
cp services/api/.env.example services/api/.env
```

Docker Compose (Phase 12) injects infrastructure URLs (`DATABASE_URL`, `REDIS_URL`, etc.).

## Production

- Use secret managers (AWS Secrets Manager, Vault, etc.)
- Rotate `JWT_*_SECRET` independently
- Set `NODE_ENV=production`
- Restrict `CORS_ORIGINS` to known frontends
