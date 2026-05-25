#!/usr/bin/env bash
# Apply Prisma migrations when host port 5433 is unavailable (Snap Docker / port conflicts).
# Uses the marketplace-postgres container network namespace.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if ! docker ps --format '{{.Names}}' | grep -q '^marketplace-postgres$'; then
  echo "Start Postgres first: docker compose -f infra/docker/docker-compose.base.yml up -d postgres"
  exit 1
fi

docker run --rm \
  --network container:marketplace-postgres \
  -v "$ROOT:/app" -w /app \
  -e DATABASE_URL="postgresql://marketplace:marketplace@127.0.0.1:5432/marketplace?schema=public" \
  node:20 \
  npx prisma migrate deploy --schema=prisma/schema.prisma

echo "==> Migrations applied."
