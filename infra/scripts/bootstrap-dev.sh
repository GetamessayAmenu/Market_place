#!/usr/bin/env bash
# Development bootstrap — install deps, build shared packages, start infra
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

echo "==> Installing dependencies..."
npm install

echo "==> Building shared packages..."
npm run build --workspace=@marketplace/config
npm run build --workspace=@marketplace/types
npm run build --workspace=@marketplace/utils
npm run build --workspace=@marketplace/ui

echo "==> Starting infrastructure (postgres on :5433, redis, meilisearch)..."
docker compose -f infra/docker/docker-compose.base.yml up -d

if [ ! -f prisma/.env ]; then
  cp prisma/.env.example prisma/.env
fi

echo "==> Dev bootstrap complete."
echo "    API: Phase 3 | Web: Phase 9 | Realtime: Phase 7"
