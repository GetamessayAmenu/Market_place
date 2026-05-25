import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Must stay in sync with @marketplace/types USER_ROLES (excluding guest). */
const ROLES = [
  { name: 'Buyer', slug: 'buyer', description: 'Browse, favorite, chat, and report listings' },
  { name: 'Seller', slug: 'seller', description: 'Create and manage listings' },
  { name: 'Moderator', slug: 'moderator', description: 'Moderate content and handle reports' },
  { name: 'Admin', slug: 'admin', description: 'Platform administration' },
  { name: 'Super Admin', slug: 'super_admin', description: 'Full platform control' },
  { name: 'Support', slug: 'support', description: 'Customer support operations' },
] as const;

const PERMISSIONS: ReadonlyArray<{ resource: string; action: string; description: string }> = [
  { resource: 'listing', action: 'create', description: 'Create listings' },
  { resource: 'listing', action: 'read', description: 'View listings' },
  { resource: 'listing', action: 'update', description: 'Update own listings' },
  { resource: 'listing', action: 'delete', description: 'Delete own listings' },
  { resource: 'listing', action: 'moderate', description: 'Moderate any listing' },
  { resource: 'listing', action: 'approve', description: 'Approve listings for publication' },
  { resource: 'user', action: 'read', description: 'View user profiles' },
  { resource: 'user', action: 'update', description: 'Update user profiles' },
  { resource: 'user', action: 'suspend', description: 'Suspend users' },
  { resource: 'user', action: 'manage', description: 'Manage users' },
  { resource: 'report', action: 'read', description: 'View reports' },
  { resource: 'report', action: 'moderate', description: 'Handle reports' },
  { resource: 'conversation', action: 'read', description: 'View conversations' },
  { resource: 'conversation', action: 'create', description: 'Start conversations' },
  { resource: 'notification', action: 'read', description: 'View notifications' },
  { resource: 'admin_log', action: 'read', description: 'View audit logs' },
  { resource: 'verification', action: 'read', description: 'View verification requests' },
  { resource: 'verification', action: 'approve', description: 'Approve verifications' },
  { resource: 'category', action: 'manage', description: 'Manage categories' },
  { resource: 'settings', action: 'manage', description: 'Manage global settings' },
];

/** Role slug → permission keys (resource:action) */
const ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  buyer: [
    'listing:read',
    'conversation:read',
    'conversation:create',
    'notification:read',
    'report:read',
  ],
  seller: [
    'listing:create',
    'listing:read',
    'listing:update',
    'listing:delete',
    'conversation:read',
    'conversation:create',
    'notification:read',
  ],
  moderator: [
    'listing:read',
    'listing:moderate',
    'listing:approve',
    'user:read',
    'user:suspend',
    'report:read',
    'report:moderate',
    'conversation:read',
    'verification:read',
  ],
  admin: [
    'listing:read',
    'listing:moderate',
    'listing:approve',
    'user:read',
    'user:update',
    'user:suspend',
    'user:manage',
    'report:read',
    'report:moderate',
    'conversation:read',
    'notification:read',
    'admin_log:read',
    'verification:read',
    'verification:approve',
    'category:manage',
  ],
  super_admin: PERMISSIONS.map((p) => `${p.resource}:${p.action}`),
  support: [
    'user:read',
    'report:read',
    'report:moderate',
    'conversation:read',
    'notification:read',
    'verification:read',
  ],
};

async function main(): Promise<void> {
  const permissionRecords = await Promise.all(
    PERMISSIONS.map((p) =>
      prisma.permission.upsert({
        where: { resource_action: { resource: p.resource, action: p.action } },
        update: { description: p.description },
        create: p,
      }),
    ),
  );

  const permissionByKey = new Map(
    permissionRecords.map((p) => [`${p.resource}:${p.action}`, p.id]),
  );

  for (const role of ROLES) {
    const created = await prisma.role.upsert({
      where: { slug: role.slug },
      update: { name: role.name, description: role.description },
      create: role,
    });

    const keys = ROLE_PERMISSIONS[role.slug] ?? [];
    for (const key of keys) {
      const permissionId = permissionByKey.get(key);
      if (!permissionId) {
        throw new Error(`Missing permission definition for key: ${key}`);
      }
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: created.id, permissionId },
        },
        update: {},
        create: { roleId: created.id, permissionId },
      });
    }
  }

  console.log(`Seeded ${ROLES.length} roles and ${PERMISSIONS.length} permissions.`);
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
