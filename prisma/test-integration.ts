import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  module: string;
  test: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function logResult(module: string, test: string, passed: boolean, message: string) {
  results.push({ module, test, passed, message });
  const status = passed ? '✓' : '✗';
  console.log(`${status} [${module}] ${test}: ${message}`);
}

async function testUserModule() {
  console.log('\n=== Testing User Module ===');
  
  // Test user creation and roles
  const users = await prisma.user.findMany({
    include: { role: true },
  });
  
  logResult('Users', 'Count', users.length > 0, `Found ${users.length} users`);
  logResult('Users', 'Roles', users.every(u => u.role), 'All users have roles');
  
  // Test seller-specific fields
  const sellers = await prisma.user.findMany({
    where: { sellerType: { not: null } },
  });
  
  logResult('Users', 'Seller profiles', sellers.length > 0, `Found ${sellers.length} sellers`);
  logResult('Users', 'Seller fields', sellers.every(s => s.bio && s.location), 'All sellers have required fields');
}

async function testListingModule() {
  console.log('\n=== Testing Listing Module ===');
  
  // Test listings with categories
  const listings = await prisma.listing.findMany({
    include: { category: true, seller: true, images: true },
  });
  
  logResult('Listings', 'Count', listings.length > 0, `Found ${listings.length} listings`);
  logResult('Listings', 'Categories', listings.every(l => l.category), 'All listings have categories');
  logResult('Listings', 'Sellers', listings.every(l => l.seller), 'All listings have sellers');
  
  // Test listing images
  const listingsWithImages = listings.filter(l => l.images.length > 0);
  logResult('Listings', 'Images', listingsWithImages.length > 0, `${listingsWithImages.length} listings have images`);
  
  // Test different listing types
  const purchaseListings = listings.filter(l => l.availableForPurchase);
  const rentalListings = listings.filter(l => l.availableForRent);
  const customListings = listings.filter(l => l.customOrderAvailable);
  
  logResult('Listings', 'Purchase type', purchaseListings.length > 0, `${purchaseListings.length} available for purchase`);
  logResult('Listings', 'Rental type', rentalListings.length > 0, `${rentalListings.length} available for rent`);
  logResult('Listings', 'Custom type', customListings.length > 0, `${customListings.length} available for custom order`);
}

async function testOrderModule() {
  console.log('\n=== Testing Order Module ===');
  
  const orders = await prisma.order.findMany({
    include: { buyer: true, seller: true, product: true },
  });
  
  logResult('Orders', 'Count', orders.length > 0, `Found ${orders.length} orders`);
  logResult('Orders', 'Buyers', orders.every(o => o.buyer), 'All orders have buyers');
  logResult('Orders', 'Sellers', orders.every(o => o.seller), 'All orders have sellers');
  logResult('Orders', 'Products', orders.every(o => o.product), 'All orders have products');
  
  // Test order statuses
  const statuses = new Set(orders.map(o => o.status));
  logResult('Orders', 'Statuses', statuses.size > 0, `Found ${statuses.size} different statuses`);
}

async function testReviewModule() {
  console.log('\n=== Testing Review Module ===');
  
  const reviews = await prisma.review.findMany({
    include: { listing: true, reviewer: true, seller: true },
  });
  
  logResult('Reviews', 'Count', reviews.length > 0, `Found ${reviews.length} reviews`);
  logResult('Reviews', 'Listings', reviews.every(r => r.listing), 'All reviews have listings');
  logResult('Reviews', 'Reviewers', reviews.every(r => r.reviewer), 'All reviews have reviewers');
  logResult('Reviews', 'Sellers', reviews.every(r => r.seller), 'All reviews have sellers');
  
  // Test ratings
  const validRatings = reviews.every(r => r.rating >= 1 && r.rating <= 5);
  logResult('Reviews', 'Valid ratings', validRatings, 'All ratings are between 1-5');
}

async function testConversationModule() {
  console.log('\n=== Testing Conversation Module ===');
  
  const conversations = await prisma.conversation.findMany({
    include: { buyer: true, seller: true, listing: true, messages: true },
  });
  
  logResult('Conversations', 'Count', conversations.length > 0, `Found ${conversations.length} conversations`);
  logResult('Conversations', 'Buyers', conversations.every(c => c.buyer), 'All conversations have buyers');
  logResult('Conversations', 'Sellers', conversations.every(c => c.seller), 'All conversations have sellers');
  logResult('Conversations', 'Listings', conversations.every(c => c.listing), 'All conversations have listings');
  
  // Test messages
  const conversationsWithMessages = conversations.filter(c => c.messages.length > 0);
  logResult('Conversations', 'Messages', conversationsWithMessages.length > 0, `${conversationsWithMessages.length} conversations have messages`);
}

async function testRentalModule() {
  console.log('\n=== Testing Rental Module ===');
  
  const rentalOrders = await prisma.rentalOrder.findMany({
    include: { listing: true, renter: true, seller: true },
  });
  
  logResult('Rentals', 'Count', rentalOrders.length > 0, `Found ${rentalOrders.length} rental orders`);
  logResult('Rentals', 'Listings', rentalOrders.every(r => r.listing), 'All rental orders have listings');
  logResult('Rentals', 'Renters', rentalOrders.every(r => r.renter), 'All rental orders have renters');
  logResult('Rentals', 'Sellers', rentalOrders.every(r => r.seller), 'All rental orders have sellers');
  
  // Test rental extensions
  const extensions = await prisma.rentalExtension.findMany({
    include: { rentalOrder: true },
  });
  logResult('Rentals', 'Extensions', extensions.length > 0, `Found ${extensions.length} rental extensions`);
  
  // Test condition logs
  const conditionLogs = await prisma.rentalConditionLog.findMany();
  logResult('Rentals', 'Condition logs', conditionLogs.length > 0, `Found ${conditionLogs.length} condition logs`);
  
  // Test blackout dates
  const blackoutDates = await prisma.rentalBlackoutDate.findMany();
  logResult('Rentals', 'Blackout dates', blackoutDates.length > 0, `Found ${blackoutDates.length} blackout dates`);
}

async function testDisputeModule() {
  console.log('\n=== Testing Dispute Module ===');
  
  const disputes = await prisma.dispute.findMany({
    include: { reporter: true, comments: true },
  });
  
  logResult('Disputes', 'Count', disputes.length > 0, `Found ${disputes.length} disputes`);
  logResult('Disputes', 'Reporters', disputes.every(d => d.reporter), 'All disputes have reporters');
  
  // Test dispute comments
  const disputesWithComments = disputes.filter(d => d.comments.length > 0);
  logResult('Disputes', 'Comments', disputesWithComments.length > 0, `${disputesWithComments.length} disputes have comments`);
}

async function testModerationModule() {
  console.log('\n=== Testing Moderation Module ===');
  
  const moderationItems = await prisma.moderationItem.findMany({
    include: { moderatedBy: true },
  });
  
  logResult('Moderation', 'Items', moderationItems.length > 0, `Found ${moderationItems.length} moderation items`);
  
  const reports = await prisma.report.findMany({
    include: { reporter: true },
  });
  logResult('Moderation', 'Reports', reports.length > 0, `Found ${reports.length} reports`);
}

async function testContentModule() {
  console.log('\n=== Testing Content Module ===');
  
  const heroBanners = await prisma.heroBanner.findMany();
  logResult('Content', 'Hero banners', heroBanners.length > 0, `Found ${heroBanners.length} hero banners`);
  
  const homepageContent = await prisma.homepageContent.findMany();
  logResult('Content', 'Homepage content', homepageContent.length > 0, `Found ${homepageContent.length} homepage content items`);
  
  const regionHubs = await prisma.regionHub.findMany();
  logResult('Content', 'Region hubs', regionHubs.length > 0, `Found ${regionHubs.length} region hubs`);
}

async function testVerificationModule() {
  console.log('\n=== Testing Verification Module ===');
  
  const verificationRequests = await prisma.verificationRequest.findMany({
    include: { user: true },
  });
  
  logResult('Verification', 'Requests', verificationRequests.length > 0, `Found ${verificationRequests.length} verification requests`);
  logResult('Verification', 'Users', verificationRequests.every(v => v.user), 'All requests have users');
  
  const vendorKycProfiles = await prisma.vendorKycProfile.findMany({
    include: { user: true },
  });
  logResult('Verification', 'KYC profiles', vendorKycProfiles.length > 0, `Found ${vendorKycProfiles.length} KYC profiles`);
}

async function testNotificationModule() {
  console.log('\n=== Testing Notification Module ===');
  
  const notifications = await prisma.notification.findMany({
    include: { user: true },
  });
  
  logResult('Notifications', 'Count', notifications.length > 0, `Found ${notifications.length} notifications`);
  logResult('Notifications', 'Users', notifications.every(n => n.user), 'All notifications have users');
}

async function testAdminModule() {
  console.log('\n=== Testing Admin Module ===');
  
  const adminLogs = await prisma.adminLog.findMany({
    include: { actor: true },
  });
  
  logResult('Admin', 'Logs', adminLogs.length > 0, `Found ${adminLogs.length} admin logs`);
  logResult('Admin', 'Actors', adminLogs.every(l => l.actor), 'All logs have actors');
}

async function testRelationshipIntegrity() {
  console.log('\n=== Testing Relationship Integrity ===');
  
  // Test that all listing sellers exist
  const listings = await prisma.listing.findMany();
  const sellerIds = [...new Set(listings.map(l => l.sellerId))]; // Remove duplicates
  const existingSellers = await prisma.user.findMany({
    where: { id: { in: sellerIds } },
  });
  const missingSellers = sellerIds.length - existingSellers.length;
  logResult('Integrity', 'Listing sellers', missingSellers === 0, `All listing sellers exist (${missingSellers} missing)`);
  
  // Test that all order buyers exist
  const orders = await prisma.order.findMany();
  const buyerIds = [...new Set(orders.map(o => o.buyerId))]; // Remove duplicates
  const existingBuyers = await prisma.user.findMany({
    where: { id: { in: buyerIds } },
  });
  const missingBuyers = buyerIds.length - existingBuyers.length;
  logResult('Integrity', 'Order buyers', missingBuyers === 0, `All order buyers exist (${missingBuyers} missing)`);
  
  // Test that all review listings exist
  const reviews = await prisma.review.findMany();
  const listingIds = [...new Set(reviews.map(r => r.listingId))]; // Remove duplicates
  const existingListings = await prisma.listing.findMany({
    where: { id: { in: listingIds } },
  });
  const missingListings = listingIds.length - existingListings.length;
  logResult('Integrity', 'Review listings', missingListings === 0, `All review listings exist (${missingListings} missing)`);
}

async function printSummary() {
  console.log('\n=== Test Summary ===');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`Total tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - [${r.module}] ${r.test}: ${r.message}`);
    });
  }
}

async function main() {
  console.log('=== System Integration Test ===');
  console.log('Testing data relationships and module integration\n');
  
  try {
    await testUserModule();
    await testListingModule();
    await testOrderModule();
    await testReviewModule();
    await testConversationModule();
    await testRentalModule();
    await testDisputeModule();
    await testModerationModule();
    await testContentModule();
    await testVerificationModule();
    await testNotificationModule();
    await testAdminModule();
    await testRelationshipIntegrity();
    
    await printSummary();
  } catch (error) {
    console.error('Test failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
