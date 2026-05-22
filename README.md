# Marketplace Platform

Production-grade classifieds marketplace monorepo (OLX / Dubizzle / Facebook Marketplace style).

## Stack

- **Frontend:** Next.js App Router, TailwindCSS, Shadcn UI, Zustand, TanStack Query
- **Backend:** NestJS, Prisma, PostgreSQL, Redis, BullMQ, Socket.IO
- **Search:** Meilisearch
- **Storage:** Cloudinary
- **Infra:** Docker, Turborepo

## Structure

```
apps/web          — Public marketplace (Next.js)
apps/admin        — Admin dashboard (Next.js)
services/api      — REST API (NestJS)
services/realtime — WebSocket service (Socket.IO)
packages/*        — Shared libraries
prisma/           — Database schema & migrations
infra/            — Docker, nginx, scripts
```

## Getting Started

```bash
npm install
npm run typecheck
npm run build
```

See `docs/ENVIRONMENT.md` for environment variable strategy.

## Development Phases

This repository is built incrementally across 13 phases. See project documentation for phase boundaries.
