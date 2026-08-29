import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runNotificationsTest() {
  console.log('--- Starting Notifications & Broadcasts Module Integration Test ---');

  // 1. Fetch test admin & user
  const adminUser = await prisma.user.findFirst({
    where: { role: { slug: { in: ['admin', 'super_admin'] } } },
  });

  const testUser = await prisma.user.findFirst({
    where: { role: { slug: 'seller' } },
  }) ?? await prisma.user.findFirst();

  if (!adminUser || !testUser) {
    console.error('Test users not found. Make sure DB is seeded.');
    process.exit(1);
  }

  console.log(`✓ Using Admin: ${adminUser.email} (${adminUser.id})`);
  console.log(`✓ Using Test User: ${testUser.email} (${testUser.id})`);

  // 2. Notification Preferences test
  console.log('\n[1/4] Testing Notification Preferences...');
  const pref = await prisma.notificationPreference.upsert({
    where: { userId: testUser.id },
    create: {
      userId: testUser.id,
      chat: true,
      listing: true,
      order: true,
      rental: true,
      customOrder: true,
      promotional: true,
    },
    update: {
      chat: true,
      promotional: false, // Turn off promotional for test
    },
  });

  console.log('✓ Updated preferences:', {
    chat: pref.chat,
    promotional: pref.promotional,
  });

  // 3. User Notification creation test
  console.log('\n[2/4] Testing User Notification Creation...');
  const notification = await prisma.notification.create({
    data: {
      userId: testUser.id,
      type: 'order_created',
      title: 'New order received - Test Order',
      body: 'You received a new order for test product.',
      data: { orderId: 'test-order-123', orderNumber: 'ORD-TEST-001' },
    },
  });

  console.log('✓ Created notification ID:', notification.id);

  const unreadCount = await prisma.notification.count({
    where: { userId: testUser.id, readAt: null },
  });
  console.log('✓ Unread count for user:', unreadCount);

  // Mark as read
  const updatedNotif = await prisma.notification.update({
    where: { id: notification.id },
    data: { readAt: new Date() },
  });

  console.log('✓ Marked as read at:', updatedNotif.readAt?.toISOString());

  // 4. Admin Broadcast creation test
  console.log('\n[3/4] Testing Admin Broadcast Creation & Recipient Delivery...');
  const broadcast = await prisma.broadcast.create({
    data: {
      createdById: adminUser.id,
      title: 'Platform Maintenance Notice - Integration Test',
      message: 'System will undergo scheduled maintenance at midnight.',
      audience: 'ALL_USERS',
      status: 'PROCESSING',
    },
  });

  console.log('✓ Created Broadcast ID:', broadcast.id);

  // Add delivery tracking
  const recipient = await prisma.broadcastRecipient.create({
    data: {
      broadcastId: broadcast.id,
      userId: testUser.id,
      notificationId: notification.id,
      status: 'DELIVERED',
    },
  });

  console.log('✓ Created Broadcast Recipient record ID:', recipient.id);

  // Complete broadcast
  const completedBroadcast = await prisma.broadcast.update({
    where: { id: broadcast.id },
    data: {
      status: 'SENT',
      sentAt: new Date(),
      totalRecipients: 1,
      deliveredCount: 1,
    },
  });

  console.log('✓ Updated Broadcast status:', completedBroadcast.status);

  // 5. Cleanup test data
  console.log('\n[4/4] Cleaning up test records...');
  await prisma.broadcastRecipient.deleteMany({ where: { broadcastId: broadcast.id } });
  await prisma.broadcast.delete({ where: { id: broadcast.id } });
  await prisma.notification.delete({ where: { id: notification.id } });

  console.log('✓ Cleanup complete!');
  console.log('\n=== ALL NOTIFICATIONS & BROADCASTS TESTS PASSED ===');
}

runNotificationsTest()
  .catch((e) => {
    console.error('Test execution failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
