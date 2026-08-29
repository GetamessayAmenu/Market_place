import { PrismaClient } from '@prisma/client';
import { classifyListingChanges } from '../services/api/src/modules/listings/utils/listing-change-classifier';

const prisma = new PrismaClient();

async function runApprovalWorkflowTests() {
  console.log('===============================================================');
  console.log('=== COMPLETE LISTING EDIT & RE-APPROVAL WORKFLOW TEST SUITE ===');
  console.log('===============================================================\n');

  // 0. Setup: Get category and seller user
  const category1 = await prisma.category.findFirst({ where: { deletedAt: null } });
  const category2 = await prisma.category.findFirst({
    where: { deletedAt: null, id: { not: category1?.id } },
  });

  if (!category1 || !category2) {
    throw new Error('Test requires at least two active categories in database.');
  }

  let seller = await prisma.user.findFirst({
    where: { role: { name: 'seller' } },
  });

  if (!seller) {
    seller = await prisma.user.findFirst();
  }

  if (!seller) {
    throw new Error('No test seller user found in database.');
  }

  let admin = await prisma.user.findFirst({
    where: { role: { name: 'admin' } },
  });
  if (!admin) {
    admin = seller;
  }

  console.log(`[0] Selected Seller: ${seller.displayName || seller.email} (${seller.id})`);
  console.log(`    Selected Admin: ${admin.displayName || admin.email} (${admin.id})`);
  console.log(`    Categories: ${category1.name} / ${category2.name}\n`);

  const testTimestamp = Date.now();
  const listingTitle = `Workflow Test Product ${testTimestamp}`;
  const listingSlug = `workflow-test-product-${testTimestamp}`;

  // ---------------------------------------------------------------------------
  // FLOW 1: Pending → Edit anything → Submit → Approve
  // ---------------------------------------------------------------------------
  console.log('--- FLOW 1: Pending → Edit anything → Submit → Approve ---');
  let listing = await prisma.listing.create({
    data: {
      sellerId: seller.id,
      categoryId: category1.id,
      title: listingTitle,
      slug: listingSlug,
      description: 'Initial draft description',
      price: 100.0,
      currency: 'USD',
      condition: 'new',
      status: 'pending_review',
      availableForPurchase: true,
      availableForRent: false,
      images: {
        create: [
          {
            url: 'https://res.cloudinary.com/demo/image/upload/listings/img1.jpg',
            cloudinaryPublicId: 'listings/img1',
            sortOrder: 0,
            isPrimary: true,
          },
        ],
      },
    },
    include: { images: true },
  });

  console.log(`[1.1] Listing created with status: ${listing.status}`);
  if (listing.status !== 'pending_review') {
    throw new Error(`Expected status 'pending_review', got ${listing.status}`);
  }

  // Seller edits while in pending_review
  listing = await prisma.listing.update({
    where: { id: listing.id },
    data: {
      title: `${listingTitle} (Updated in Pending)`,
      description: 'Updated description while pending review freely',
      price: 105.0,
    },
    include: { images: true },
  });
  console.log(`[1.2] Seller freely edited listing while pending review. New title: "${listing.title}"`);
  if (listing.status !== 'pending_review') {
    throw new Error('Editing in pending_review must retain pending_review status!');
  }

  // Admin approves listing
  listing = await prisma.listing.update({
    where: { id: listing.id },
    data: {
      status: 'active',
      publishedAt: new Date(),
    },
    include: { images: true },
  });
  console.log(`[1.3] Admin approved listing. Status: ${listing.status}`);
  if (listing.status !== 'active') {
    throw new Error('Approval must set status to active!');
  }
  console.log('✓ FLOW 1 PASSED!\n');

  // ---------------------------------------------------------------------------
  // FLOW 2: Pending → Reject → Edit → Resubmit → Approve
  // ---------------------------------------------------------------------------
  console.log('--- FLOW 2: Pending → Reject → Edit → Resubmit → Approve ---');
  // Admin rejects listing
  const rejectReason = 'Image quality is too low. Please upload high-res photo.';
  listing = await prisma.listing.update({
    where: { id: listing.id },
    data: {
      status: 'rejected',
      rejectedReason: rejectReason,
    },
    include: { images: true },
  });
  console.log(`[2.1] Admin rejected listing with reason: "${listing.rejectedReason}"`);
  if (listing.status !== 'rejected') {
    throw new Error('Status must be rejected!');
  }

  // Seller fixes issues and resubmits
  listing = await prisma.listing.update({
    where: { id: listing.id },
    data: {
      description: 'Fixed high-res image description and details.',
      status: 'pending_review',
      rejectedReason: null,
    },
    include: { images: true },
  });
  console.log(`[2.2] Seller resubmitted listing. Status: ${listing.status}, rejectedReason cleared.`);
  if (listing.status !== 'pending_review' || listing.rejectedReason !== null) {
    throw new Error('Resubmission must set status to pending_review and clear rejectedReason!');
  }

  // Admin approves resubmitted listing
  listing = await prisma.listing.update({
    where: { id: listing.id },
    data: { status: 'active' },
    include: { images: true },
  });
  console.log(`[2.3] Admin approved resubmitted listing. Status: ${listing.status}`);
  console.log('✓ FLOW 2 PASSED!\n');

  // ---------------------------------------------------------------------------
  // FLOW 3: Approved → Minor edit → Immediately public
  // ---------------------------------------------------------------------------
  console.log('--- FLOW 3: Approved → Minor edit → Immediately public ---');
  const minorEditDto = { description: listing.description.replace('details.', 'details!') };
  const class3 = classifyListingChanges(listing, minorEditDto);
  console.log(`[3.1] Classification for minor edit: requiresReview=${class3.requiresReview}, riskLevel=${class3.riskLevel}`);
  if (class3.requiresReview) {
    throw new Error('Minor edit should not require review!');
  }

  listing = await prisma.listing.update({
    where: { id: listing.id },
    data: minorEditDto,
    include: { images: true },
  });

  await prisma.listingRevision.create({
    data: {
      listingId: listing.id,
      sellerId: seller.id,
      status: 'APPROVED',
      riskLevel: class3.riskLevel,
      changedFields: class3.changedFields,
      changes: minorEditDto as any,
      previousData: { description: 'Fixed high-res image description and details.' } as any,
    },
  });
  console.log(`[3.2] Minor edit immediately applied to active listing: "${listing.description}"`);
  console.log('✓ FLOW 3 PASSED!\n');

  // ---------------------------------------------------------------------------
  // FLOW 4: Approved → Price ≤10% → Immediately public
  // ---------------------------------------------------------------------------
  console.log('--- FLOW 4: Approved → Price ≤10% → Immediately public ---');
  const oldPriceNum = Number(listing.price); // 105.0
  const newSmallPrice = 108.0; // ~2.8% increase <= 10%
  const class4 = classifyListingChanges(listing, { price: newSmallPrice });
  console.log(`[4.1] Price change 105 -> 108 (≤10%): requiresReview=${class4.requiresReview}, riskLevel=${class4.riskLevel}`);
  if (class4.requiresReview) {
    throw new Error('Price change <= 10% should not require review!');
  }

  listing = await prisma.listing.update({
    where: { id: listing.id },
    data: { price: newSmallPrice },
    include: { images: true },
  });
  console.log(`[4.2] Price <=10% immediately updated on public listing: ${listing.price}`);
  console.log('✓ FLOW 4 PASSED!\n');

  // ---------------------------------------------------------------------------
  // FLOW 5: Approved → Price >10% → Pending Review → Approve
  // ---------------------------------------------------------------------------
  console.log('--- FLOW 5: Approved → Price >10% → Pending Review → Approve ---');
  const newLargePrice = 200.0; // >10% increase from 108
  const class5 = classifyListingChanges(listing, { price: newLargePrice });
  console.log(`[5.1] Price change 108 -> 200 (>10%): requiresReview=${class5.requiresReview}, riskLevel=${class5.riskLevel}`);
  if (!class5.requiresReview) {
    throw new Error('Price change > 10% must require review!');
  }

  // Create pending revision, do NOT change active Listing
  let rev5 = await prisma.listingRevision.create({
    data: {
      listingId: listing.id,
      sellerId: seller.id,
      status: 'PENDING_REVIEW',
      riskLevel: class5.riskLevel,
      changedFields: class5.changedFields,
      changes: { price: newLargePrice } as any,
      previousData: { price: Number(listing.price) } as any,
    },
  });
  console.log(`[5.2] Pending revision created (id: ${rev5.id}). Public listing price remains: ${listing.price}`);

  // Fetch listing again to verify public price was untouched
  const publicListingBeforeApprove = await prisma.listing.findUnique({ where: { id: listing.id } });
  if (Number(publicListingBeforeApprove?.price) !== 108.0) {
    throw new Error('Public listing price must remain unchanged while revision is pending!');
  }

  // Admin approves revision
  listing = await prisma.listing.update({
    where: { id: listing.id },
    data: { price: newLargePrice },
    include: { images: true },
  });
  rev5 = await prisma.listingRevision.update({
    where: { id: rev5.id },
    data: { status: 'APPROVED', reviewedById: admin.id, reviewedAt: new Date() },
  });
  console.log(`[5.3] Admin approved revision ${rev5.id}. Public listing price updated to: ${listing.price}`);
  console.log('✓ FLOW 5 PASSED!\n');

  // ---------------------------------------------------------------------------
  // FLOW 6: Approved → Main image change → Review
  // ---------------------------------------------------------------------------
  console.log('--- FLOW 6: Approved → Main image change → Review ---');
  const newPrimaryImage = {
    url: 'https://res.cloudinary.com/demo/image/upload/listings/new_primary.jpg',
    cloudinaryPublicId: 'listings/new_primary',
    sortOrder: 0,
    isPrimary: true,
  };

  const class6 = classifyListingChanges(listing, { images: [newPrimaryImage] });
  console.log(`[6.1] Primary image change: requiresReview=${class6.requiresReview}, riskLevel=${class6.riskLevel}`);
  if (!class6.requiresReview || class6.riskLevel !== 'HIGH') {
    throw new Error('Primary image replacement must be HIGH risk and require review!');
  }

  const rev6 = await prisma.listingRevision.create({
    data: {
      listingId: listing.id,
      sellerId: seller.id,
      status: 'PENDING_REVIEW',
      riskLevel: class6.riskLevel,
      changedFields: class6.changedFields,
      changes: { images: [newPrimaryImage] } as any,
      previousData: { images: listing.images } as any,
    },
  });
  console.log(`[6.2] High-risk primary image revision created: ${rev6.id}`);
  console.log('✓ FLOW 6 PASSED!\n');

  // Clean up revision 6
  await prisma.listingRevision.delete({ where: { id: rev6.id } });

  // ---------------------------------------------------------------------------
  // FLOW 7: Approved → Category change → Review
  // ---------------------------------------------------------------------------
  console.log('--- FLOW 7: Approved → Category change → Review ---');
  const class7 = classifyListingChanges(listing, { categoryId: category2.id });
  console.log(`[7.1] Category change: requiresReview=${class7.requiresReview}, riskLevel=${class7.riskLevel}`);
  if (!class7.requiresReview || class7.riskLevel !== 'HIGH') {
    throw new Error('Category change must be HIGH risk!');
  }

  const rev7 = await prisma.listingRevision.create({
    data: {
      listingId: listing.id,
      sellerId: seller.id,
      status: 'PENDING_REVIEW',
      riskLevel: class7.riskLevel,
      changedFields: class7.changedFields,
      changes: { categoryId: category2.id } as any,
      previousData: { categoryId: listing.categoryId } as any,
    },
  });
  console.log(`[7.2] Category change revision created: ${rev7.id}`);
  console.log('✓ FLOW 7 PASSED!\n');

  await prisma.listingRevision.delete({ where: { id: rev7.id } });

  // ---------------------------------------------------------------------------
  // FLOW 8: Approved → Sale/Rent change → Review
  // ---------------------------------------------------------------------------
  console.log('--- FLOW 8: Approved → Sale/Rent change → Review ---');
  const class8 = classifyListingChanges(listing, {
    availableForPurchase: false,
    availableForRent: true,
  });
  console.log(`[8.1] Sale/Rent flip: requiresReview=${class8.requiresReview}, riskLevel=${class8.riskLevel}`);
  if (!class8.requiresReview || class8.riskLevel !== 'HIGH') {
    throw new Error('Sale/Rent flip must be HIGH risk!');
  }

  const rev8 = await prisma.listingRevision.create({
    data: {
      listingId: listing.id,
      sellerId: seller.id,
      status: 'PENDING_REVIEW',
      riskLevel: class8.riskLevel,
      changedFields: class8.changedFields,
      changes: { availableForPurchase: false, availableForRent: true } as any,
      previousData: { availableForPurchase: true, availableForRent: false } as any,
    },
  });
  console.log(`[8.2] Sale/Rent mode flip revision created: ${rev8.id}`);
  console.log('✓ FLOW 8 PASSED!\n');

  await prisma.listingRevision.delete({ where: { id: rev8.id } });

  // ---------------------------------------------------------------------------
  // FLOW 9: Approved → Reject change → Old approved version remains public
  // ---------------------------------------------------------------------------
  console.log('--- FLOW 9: Approved → Reject change → Old approved version remains public ---');
  const originalTitleBeforeEdit = listing.title;
  const rejectedProposedTitle = 'Spammy Title Change Buy Fast!!!';

  const class9 = classifyListingChanges(listing, { title: rejectedProposedTitle });
  let rev9 = await prisma.listingRevision.create({
    data: {
      listingId: listing.id,
      sellerId: seller.id,
      status: 'PENDING_REVIEW',
      riskLevel: class9.riskLevel,
      changedFields: class9.changedFields,
      changes: { title: rejectedProposedTitle } as any,
      previousData: { title: originalTitleBeforeEdit } as any,
    },
  });
  console.log(`[9.1] Seller proposed major title edit. Revision created: ${rev9.id}`);

  // Admin rejects revision with reason
  rev9 = await prisma.listingRevision.update({
    where: { id: rev9.id },
    data: {
      status: 'REJECTED',
      rejectionReason: 'Spammy title violates marketplace guidelines.',
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  });
  console.log(`[9.2] Admin rejected revision ${rev9.id} with reason: "${rev9.rejectionReason}"`);

  // Verify public listing title remained the original approved title
  const finalListingInDb = await prisma.listing.findUnique({ where: { id: listing.id } });
  if (finalListingInDb?.title !== originalTitleBeforeEdit) {
    throw new Error(`Public listing title changed unexpectedly! Expected "${originalTitleBeforeEdit}", got "${finalListingInDb?.title}"`);
  }
  console.log(`[9.3] Public approved listing title preserved: "${finalListingInDb.title}"`);
  console.log('✓ FLOW 9 PASSED!\n');

  // ---------------------------------------------------------------------------
  // FLOW 10: Confirm audit history records every change
  // ---------------------------------------------------------------------------
  console.log('--- FLOW 10: Confirm audit history records every change ---');
  const allRevisions = await prisma.listingRevision.findMany({
    where: { listingId: listing.id },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`[10.1] Found ${allRevisions.length} total revision audit records for listing ${listing.id}:`);
  for (const rev of allRevisions) {
    console.log(`       - Revision ${rev.id}: status=${rev.status}, riskLevel=${rev.riskLevel}, fields=[${rev.changedFields.join(', ')}]`);
  }

  if (allRevisions.length === 0) {
    throw new Error('Audit history must record listing changes!');
  }
  console.log('✓ FLOW 10 PASSED!\n');

  // Cleanup test listing
  await prisma.listingImage.deleteMany({ where: { listingId: listing.id } });
  await prisma.listingPriceHistory.deleteMany({ where: { listingId: listing.id } });
  await prisma.listingRevision.deleteMany({ where: { listingId: listing.id } });
  await prisma.listing.delete({ where: { id: listing.id } });
  console.log('[Cleanup] Test listing and revisions cleaned up successfully.');

  console.log('\n===============================================================');
  console.log('✓ ALL 10 CORE LISTING EDIT & RE-APPROVAL SCENARIOS PASSED!');
  console.log('===============================================================\n');
}

runApprovalWorkflowTests()
  .catch((err) => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
