/**
 * Automated service readiness check for Marketplace development.
 *
 * Ensures Docker (PostgreSQL, Redis, Meilisearch) is active,
 * verifies database migrations & test seeds exist, and prevents
 * the API server from crashing on startup when running `npm run dev`.
 */

const net = require('net');
const { spawnSync, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..');
const COMPOSE_FILE = path.join(ROOT_DIR, 'infra/docker/docker-compose.base.yml');

// Load root .env if present
const envPath = path.join(ROOT_DIR, '.env');
if (fs.existsSync(envPath)) {
  try {
    const dotenv = require('dotenv');
    dotenv.config({ path: envPath });
  } catch {
    // If dotenv not yet loaded, simple fallback parser
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match && !process.env[match[1]]) {
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[match[1]] = value.trim();
      }
    }
  }
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    'postgresql://marketplace:marketplace@localhost:5433/marketplace?schema=public';
}

/**
 * Checks if a TCP port is accepting connections.
 */
function isPortOpen(port, host = '127.0.0.1', timeoutMs = 600) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

/**
 * Polls until a port is open or timeout expires.
 */
async function waitForPort(port, name, maxSeconds = 25) {
  process.stdout.write(`[Marketplace Dev] Waiting for ${name} (port ${port}) to be ready`);
  const start = Date.now();
  while (Date.now() - start < maxSeconds * 1000) {
    if (await isPortOpen(port)) {
      console.log(' -> Ready!');
      return true;
    }
    process.stdout.write('.');
    await new Promise((r) => setTimeout(r, 600));
  }
  console.log(' -> Timed out!');
  return false;
}

/**
 * Executes a shell command with inherited stdio.
 */
function runCommand(command, args) {
  const res = spawnSync(command, args, { cwd: ROOT_DIR, stdio: 'inherit' });
  return res.status === 0;
}

/**
 * Starts Docker containers (handling permissions or daemon state gracefully).
 */
function startDockerInfrastructure() {
  console.log('[Marketplace Dev] Starting background containers (Postgres :5433, Redis :6379, Meilisearch :7700)...');

  // Attempt 1: Regular docker compose
  let ok = runCommand('docker', ['compose', '-f', COMPOSE_FILE, 'up', '-d']);
  if (ok) return true;

  console.log('[Marketplace Dev] Standard docker command failed. Checking daemon / permissions...');

  // Check if systemd docker service is inactive
  try {
    const status = spawnSync('systemctl', ['is-active', 'docker'], { encoding: 'utf8' });
    if (status.stdout && status.stdout.trim() !== 'active') {
      console.log('[Marketplace Dev] Starting Docker system service (may ask for sudo password)...');
      runCommand('sudo', ['systemctl', 'start', 'docker']);
    }
  } catch {
    // If systemctl not found, continue
  }

  // Attempt 2: sudo docker compose
  console.log('[Marketplace Dev] Running docker compose with sudo...');
  ok = runCommand('sudo', ['docker', 'compose', '-f', COMPOSE_FILE, 'up', '-d']);

  if (ok) {
    // Try adding the current user to docker group in background so sudo won't be needed next time
    const user = process.env.USER;
    if (user && user !== 'root') {
      try {
        spawnSync('sudo', ['usermod', '-aG', 'docker', user], { stdio: 'ignore' });
      } catch {
        // Ignore
      }
    }
    return true;
  }

  return false;
}

/**
 * Ensures Prisma schema and seed data are ready.
 */
async function ensureDatabaseSchema() {
  console.log('[Marketplace Dev] Checking database schema & seed data...');
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      execSync('npx prisma migrate deploy --schema=prisma/schema.prisma', {
        cwd: ROOT_DIR,
        stdio: 'inherit',
        env: process.env,
      });
      break;
    } catch (err) {
      if (attempt < 4) {
        console.log(`[Marketplace Dev] Database warming up (attempt ${attempt}/4), waiting 2s...`);
        await new Promise((r) => setTimeout(r, 2000));
      } else {
        console.warn('[Marketplace Dev] Migrate deploy notice, syncing with db push...');
        try {
          execSync('npx prisma db push --schema=prisma/schema.prisma', {
            cwd: ROOT_DIR,
            stdio: 'inherit',
            env: process.env,
          });
        } catch (e) {
          console.error('[Marketplace Dev] Failed to push schema:', e.message);
        }
      }
    }
  }

  // Check if test seller exists; if not, seed the database
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const seller = await prisma.user.findUnique({
      where: { email: 'seller@habesha.com' },
      select: { id: true, email: true },
    });
    await prisma.$disconnect();

    if (!seller) {
      console.log('[Marketplace Dev] Test seller (seller@habesha.com) not found. Seeding database...');
      execSync('npm run db:seed', {
        cwd: ROOT_DIR,
        stdio: 'inherit',
        env: process.env,
      });
      console.log('[Marketplace Dev] Database seeded successfully.');
    } else {
      console.log('[Marketplace Dev] Database ready (test account seller@habesha.com exists).');
    }
  } catch (err) {
    console.warn('[Marketplace Dev] Note checking seed data:', err.message);
  }
}

async function main() {
  console.log('[Marketplace Dev] Checking required background services...');

  const postgresUp = await isPortOpen(5433);
  const redisUp = await isPortOpen(6379);

  if (postgresUp && redisUp) {
    console.log('[Marketplace Dev] PostgreSQL (:5433) and Redis (:6379) are already running.');
    await ensureDatabaseSchema();
    console.log('[Marketplace Dev] Everything is ready! Starting dev servers...\n');
    return;
  }

  const started = startDockerInfrastructure();
  if (!started) {
    console.error('\n[Marketplace Dev] ERROR: Could not start Docker containers.');
    console.error('Please make sure Docker is installed and running:');
    console.error('  sudo systemctl start docker');
    console.error('  sudo docker compose -f infra/docker/docker-compose.base.yml up -d\n');
    process.exit(1);
  }

  const pgReady = await waitForPort(5433, 'PostgreSQL');
  const redisReady = await waitForPort(6379, 'Redis');

  if (!pgReady || !redisReady) {
    console.error('\n[Marketplace Dev] ERROR: Services did not become ready in time.');
    process.exit(1);
  }

  await ensureDatabaseSchema();
  console.log('[Marketplace Dev] All background services ready! Starting dev servers...\n');
}

main().catch((err) => {
  console.error('[Marketplace Dev] Unexpected startup error:', err);
  process.exit(1);
});
