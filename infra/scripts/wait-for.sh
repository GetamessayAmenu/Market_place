#!/usr/bin/env sh
# Wait for a TCP host:port to accept connections (used in Docker entrypoints)
set -e

host="$1"
port="$2"
shift 2
timeout="${1:-60}"
shift || true

echo "Waiting for ${host}:${port} (timeout ${timeout}s)..."

i=0
while ! nc -z "$host" "$port" 2>/dev/null; do
  i=$((i + 1))
  if [ "$i" -ge "$timeout" ]; then
    echo "Timeout waiting for ${host}:${port}"
    exit 1
  fi
  sleep 1
done

echo "${host}:${port} is up."
exec "$@"
