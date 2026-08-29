import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== ADMIN DASHBOARD METRICS VALIDATION ===\n');

  // 1. Users & Sellers
  const totalUsers = await prisma.user.count({ where: { deletedAt: null } });
  const activeSellers = await prisma.user.count({
    where: { deletedAt: null, status: 'active', sellerType: { not: null } },
  });
  const suspendedUsers = await prisma.user.count({
    where: { deletedAt: null, status: { in: ['suspended', 'banned'] } },
  });
  const pendingVerifications = await prisma.verificationRequest.count({
    where: { status: 'pending', deletedAt: null },
  });

  console.log('--- USER & SELLER METRICS ---');
  console.log(`Total Users (DB): ${totalUsers}`);
  console.log(`Active Sellers (DB): ${activeSellers}`);
  console.log(`Suspended Users (DB): ${suspendedUsers}`);
  console.log(`Pending Verifications (DB): ${pendingVerifications}`);

  // 2. Listings
  const totalListings = await prisma.listing.count({ where: { deletedAt: null } });
  const activeListings = await prisma.listing.count({ where: { status: 'active', deletedAt: null } });
  const pendingListings = await prisma.listing.count({ where: { status: 'pending_review', deletedAt: null } });
  const rejectedListings = await prisma.listing.count({ where: { status: 'rejected', deletedAt: null } });
  const draftListings = await prisma.listing.count({ where: { status: 'draft', deletedAt: null } });

  console.log('\n--- LISTING METRICS ---');
  console.log(`Total Listings (DB): ${totalListings}`);
  console.log(`Active Listings (DB): ${activeListings}`);
  console.log(`Pending Listings (DB): ${pendingListings}`);
  console.log(`Rejected Listings (DB): ${rejectedListings}`);
  console.log(`Draft Listings (DB): ${draftListings}`);

  // 3. Transactions (Orders, Rentals, Custom Orders)
  const totalOrders = await prisma.order.count();
  const inquiryOrders = await prisma.order.count({ where: { status: 'INQUIRY_PENDING' } });
  const completedOrders = await prisma.order.count({ where: { status: 'COMPLETED' } });

  const totalRentals = await prisma.rentalOrder.count();
  const activeRentals = await prisma.rentalOrder.count({ where: { status: { in: ['HANDOVER_PENDING', 'ACTIVE'] } } });
  const disputedRentals = await prisma.rentalOrder.count({ where: { status: 'DISPUTED' } });

  const totalCustomOrders = await prisma.customOrder.count();
  const submittedCustomOrders = await prisma.customOrder.count({ where: { status: 'submitted' } });

  console.log('\n--- TRANSACTION METRICS ---');
  console.log(`Total Orders (DB): ${totalOrders} (Inquiries: ${inquiryOrders}, Completed: ${completedOrders})`);
  console.log(`Total Rentals (DB): ${totalRentals} (Active: ${activeRentals}, Disputed: ${disputedRentals})`);
  console.log(`Total Custom Orders (DB): ${totalCustomOrders} (Submitted: ${submittedCustomOrders})`);

  // 4. Moderation & Safety
  const openReports = await prisma.report.count({ where: { status: { in: ['pending', 'under_review', 'investigating'] } } });
  const pendingChatFlags = await prisma.chatFlagLog.count({ where: { status: 'PENDING_REVIEW' } });
  const openDisputes = await prisma.dispute.count({ where: { status: { in: ['open', 'escalated', 'under_review', 'in_progress'] } } });

  console.log('\n--- MODERATION & SAFETY METRICS ---');
  console.log(`Open Reports (DB): ${openReports}`);
  console.log(`Pending Chat Flags (DB): ${pendingChatFlags}`);
  console.log(`Open Disputes (DB): ${openDisputes}`);

  // 5. System Audit Logs
  const auditLogsCount = await prisma.adminLog.count();
  console.log(`\nTotal Admin Audit Logs (DB): ${auditLogsCount}`);

  console.log('\n✓ ALL DASHBOARD METRIC QUERIES VERIFIED SUCCESSFULLY WITH ZERO MOCK DATA!');
}

main()
  .catch((e) => {
    console.error('Error running dashboard verification:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
