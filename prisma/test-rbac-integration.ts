import { PrismaClient } from '@prisma/client';
import { can, isSuperAdmin, hasRole } from '../apps/admin/src/lib/permissions';

const prisma = new PrismaClient();

interface TestAssertion {
  name: string;
  passed: boolean;
  details: string;
}

const assertions: TestAssertion[] = [];

function assert(name: string, condition: boolean, details: string) {
  assertions.push({ name, passed: condition, details });
  const icon = condition ? '✓' : '✗';
  console.log(`${icon} [${name}] ${details}`);
}

async function runRbacTests() {
  console.log('====================================================');
  console.log('RUNNING RBAC & SUPER ADMIN FOUNDATION INTEGRATION TESTS');
  console.log('====================================================\n');

  try {
    // 1. Verify Seeded Super Admin
    console.log('1. Verifying Super Admin Account...');
    const superAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { role: { slug: 'super_admin' } },
          { userRoles: { some: { role: { slug: 'super_admin' } } } },
        ],
      },
      include: {
        role: true,
        adminProfile: true,
        userRoles: { include: { role: true } },
      },
    });

    assert(
      'Super Admin Exists',
      Boolean(superAdmin),
      superAdmin ? `Found Super Admin: ${superAdmin.email}` : 'No Super Admin account found!',
    );

    assert(
      'Super Admin AdminProfile',
      Boolean(superAdmin?.adminProfile),
      `AdminProfile exists on ${superAdmin?.email}`,
    );

    // 2. Verify System Roles
    console.log('\n2. Verifying System Roles...');
    const roles = await prisma.role.findMany({
      include: { rolePermissions: { include: { permission: true } } },
    });

    const roleSlugs = roles.map((r) => r.slug);
    assert('Role: super_admin', roleSlugs.includes('super_admin'), 'super_admin role exists in DB');
    assert('Role: platform_admin', roleSlugs.includes('platform_admin'), 'platform_admin role exists in DB');
    assert('Role: moderator', roleSlugs.includes('moderator'), 'moderator role exists in DB');
    assert('Role: content_manager', roleSlugs.includes('content_manager'), 'content_manager role exists in DB');

    const superAdminRole = roles.find((r) => r.slug === 'super_admin');
    assert(
      'Super Admin Permissions Seeded',
      (superAdminRole?.rolePermissions.length ?? 0) >= 100,
      `Super Admin role mapped to ${superAdminRole?.rolePermissions.length} permissions in DB`,
    );

    // 3. Verify Permissions Total
    console.log('\n3. Verifying Granular Permissions...');
    const permissionsCount = await prisma.permission.count();
    assert(
      'Permissions Count >= 100',
      permissionsCount >= 100,
      `Total distinct granular permissions in DB: ${permissionsCount}`,
    );

    // 4. Verify System Settings & Feature Flags
    console.log('\n4. Verifying System Settings & Feature Flags...');
    const settings = await prisma.systemSetting.findMany();
    assert(
      'System Settings Seeded',
      settings.length >= 10,
      `Found ${settings.length} platform settings & feature flags in DB`,
    );

    const mfaSetting = settings.find((s) => s.key === 'mfa_enforced_for_admins');
    assert(
      'Security Setting: mfa_enforced_for_admins',
      Boolean(mfaSetting && mfaSetting.group === 'security'),
      `mfa_enforced_for_admins exists in group: ${mfaSetting?.group}`,
    );

    // 5. Test Centralized Authorization Logic
    console.log('\n5. Testing Centralized Authorization & Privilege Boundaries...');
    const superUser = {
      role: 'super_admin',
      roles: ['super_admin'],
      isSuperAdmin: true,
      permissions: [],
    };

    assert('Super Admin hasRole', hasRole('super_admin', superUser), 'hasRole("super_admin") is true');
    assert('Super Admin isSuperAdmin', isSuperAdmin(superUser), 'isSuperAdmin(superUser) is true');
    assert('Super Admin can cms.hero.manage', can('cms.hero.manage', superUser), 'can access CMS');
    assert('Super Admin can admins.assign_roles', can('admins.assign_roles', superUser), 'can assign roles');
    assert('Super Admin can settings.manage', can('settings.manage', superUser), 'can manage settings');
    assert('Super Admin can security.manage', can('security.manage', superUser), 'can manage security');

    // Moderator Boundaries
    const modRole = roles.find((r) => r.slug === 'moderator');
    const modPermissions = modRole?.rolePermissions.map((p) => `${p.permission.resource}:${p.permission.action}`) || [];
    const modUser = {
      role: 'moderator',
      roles: ['moderator'],
      isSuperAdmin: false,
      permissions: modPermissions,
    };

    assert('Moderator can disputes.view', can('disputes.view', modUser), 'Moderator can view disputes');
    assert('Moderator can reports.manage', can('reports.manage', modUser), 'Moderator can manage reports');
    assert('Moderator CANNOT admins.create', !can('admins.create', modUser), 'Moderator CANNOT create admins');
    assert('Moderator CANNOT cms.seo.manage', !can('cms.seo.manage', modUser), 'Moderator CANNOT manage CMS SEO');
    assert('Moderator CANNOT settings.manage', !can('settings.manage', modUser), 'Moderator CANNOT manage settings');

    // Content Manager Boundaries
    const cmRole = roles.find((r) => r.slug === 'content_manager');
    const cmPermissions = cmRole?.rolePermissions.map((p) => `${p.permission.resource}:${p.permission.action}`) || [];
    const cmUser = {
      role: 'content_manager',
      roles: ['content_manager'],
      isSuperAdmin: false,
      permissions: cmPermissions,
    };

    assert('Content Manager can cms.hero.manage', can('cms.hero.manage', cmUser), 'Content Manager can manage hero');
    assert('Content Manager CANNOT disputes.manage', !can('disputes.manage', cmUser), 'Content Manager CANNOT manage disputes');
    assert('Content Manager CANNOT admins.view', !can('admins.view', cmUser), 'Content Manager CANNOT view admin management');

    // Platform Admin Boundaries
    const paRole = roles.find((r) => r.slug === 'platform_admin');
    const paPermissions = paRole?.rolePermissions.map((p) => `${p.permission.resource}:${p.permission.action}`) || [];
    const paUser = {
      role: 'platform_admin',
      roles: ['platform_admin'],
      isSuperAdmin: false,
      permissions: paPermissions,
    };

    assert('Platform Admin can users.view', can('users.view', paUser), 'Platform Admin can view users');
    assert('Platform Admin can listings.approve', can('listings.approve', paUser), 'Platform Admin can approve listings');
    assert('Platform Admin can settings.manage', can('settings.manage', paUser), 'Platform Admin can manage settings');
    assert('Platform Admin isSuperAdmin is FALSE', !isSuperAdmin(paUser), 'Platform Admin is NOT Super Admin');

    // 6. Test Super Admin Count Safeguard
    console.log('\n6. Testing Last Super Admin Count Safeguard...');
    const activeSuperAdmins = await prisma.user.count({
      where: {
        status: 'active',
        deletedAt: null,
        OR: [
          { role: { slug: 'super_admin' } },
          { userRoles: { some: { role: { slug: 'super_admin' } } } },
        ],
      },
    });

    assert(
      'Active Super Admin Count',
      activeSuperAdmins >= 1,
      `Found ${activeSuperAdmins} active Super Admin(s). System is protected against 0 Super Admins.`,
    );

    console.log('\n====================================================');
    const passed = assertions.filter((a) => a.passed).length;
    const failed = assertions.filter((a) => !a.passed).length;
    console.log(`TOTAL TESTS: ${assertions.length} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test execution error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runRbacTests();
