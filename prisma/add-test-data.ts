import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function addUser() {
  console.log('\n--- Add New User ---');
  const email = await question('Email: ');
  const displayName = await question('Display Name: ');
  const role = await question('Role (buyer/seller/admin/moderator/support/super_admin): ');
  const status = await question('Status (active/suspended/banned/pending_verification): ');
  const password = await question('Password (default: Test1234): ') || 'Test1234';

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65_536,
    timeCost: 3,
    parallelism: 4,
  });

  const roleRecord = await prisma.role.findUnique({ where: { slug: role } });
  if (!roleRecord) {
    console.error(`Role "${role}" not found`);
    return;
  }

  const user = await prisma.user.create({
    data: {
      email,
      displayName,
      passwordHash,
      roleId: roleRecord.id,
      status: status as any,
      emailVerifiedAt: new Date(),
      ...(role === 'seller' ? {
        sellerType: 'boutique',
        bio: `Professional ${displayName} specializing in Ethiopian fashion.`,
        location: 'Addis Ababa, Ethiopia',
        specialties: ['Traditional Wear', 'Modern Fashion'],
        responseRate: 95,
        responseTimeHours: 2,
        totalSales: 10,
      } : {}),
    },
  });

  console.log(`✓ User created: ${user.email} (ID: ${user.id})`);
}

async function addListing() {
  console.log('\n--- Add New Listing ---');
  const sellerEmail = await question('Seller Email: ');
  const categorySlug = await question('Category Slug: ');
  const title = await question('Title: ');
  const description = await question('Description: ');
  const price = parseFloat(await question('Price (ETB): '));
  const condition = await question('Condition (new/like_new/good/fair/poor): ');
  const city = await question('City: ');

  const seller = await prisma.user.findUnique({ where: { email: sellerEmail } });
  if (!seller) {
    console.error(`Seller "${sellerEmail}" not found`);
    return;
  }

  const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
  if (!category) {
    console.error(`Category "${categorySlug}" not found`);
    return;
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const listing = await prisma.listing.create({
    data: {
      sellerId: seller.id,
      categoryId: category.id,
      title,
      slug,
      description,
      price,
      currency: 'ETB',
      condition: condition as any,
      status: 'active',
      city,
      country: 'ET',
      isFeatured: false,
      availableForPurchase: true,
      availableForRent: false,
      customOrderAvailable: false,
      supportsReadyMade: true,
      supportsCustomDesign: false,
      publishedAt: new Date(),
      contactOptions: { chat: true },
    },
  });

  console.log(`✓ Listing created: ${listing.title} (ID: ${listing.id})`);
}

async function addImagesToListing() {
  console.log('\n--- Add Images to Listing ---');
  const listingSlug = await question('Listing Slug: ');
  const imageCount = parseInt(await question('Number of images to add: '));

  const listing = await prisma.listing.findUnique({ where: { slug: listingSlug } });
  if (!listing) {
    console.error(`Listing "${listingSlug}" not found`);
    return;
  }

  const existingImages = await prisma.listingImage.findMany({
    where: { listingId: listing.id },
    orderBy: { sortOrder: 'desc' },
  });

  const startSortOrder = existingImages.length > 0 ? existingImages[0].sortOrder + 1 : 0;

  for (let i = 0; i < imageCount; i++) {
    const imageUrl = await question(`Image ${i + 1} URL: `);
    const isPrimary = existingImages.length === 0 && i === 0 ? true : await question(`Is this the primary image? (y/n): `) === 'y';

    await prisma.listingImage.create({
      data: {
        listingId: listing.id,
        url: imageUrl,
        cloudinaryPublicId: `test-${Date.now()}-${i}`,
        sortOrder: startSortOrder + i,
        isPrimary,
      },
    });

    console.log(`✓ Image ${i + 1} added`);
  }

  console.log(`✓ ${imageCount} images added to listing "${listing.title}"`);
}

async function addOrder() {
  console.log('\n--- Add New Order ---');
  const buyerEmail = await question('Buyer Email: ');
  const listingSlug = await question('Listing Slug: ');
  const agreedPrice = parseFloat(await question('Agreed Price (ETB): '));

  const buyer = await prisma.user.findUnique({ where: { email: buyerEmail } });
  if (!buyer) {
    console.error(`Buyer "${buyerEmail}" not found`);
    return;
  }

  const listing = await prisma.listing.findUnique({ where: { slug: listingSlug } });
  if (!listing) {
    console.error(`Listing "${listingSlug}" not found`);
    return;
  }

  const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

  const order = await prisma.order.create({
    data: {
      buyerId: buyer.id,
      sellerId: listing.sellerId,
      productId: listing.id,
      status: 'INQUIRY_PENDING',
      orderNumber,
      type: 'SALE',
      agreedPrice,
    },
  });

  console.log(`✓ Order created: ${order.orderNumber} (ID: ${order.id})`);
}

async function addReview() {
  console.log('\n--- Add New Review ---');
  const reviewerEmail = await question('Reviewer Email: ');
  const listingSlug = await question('Listing Slug: ');
  const rating = parseInt(await question('Rating (1-5): '));
  const title = await question('Review Title: ');
  const body = await question('Review Body: ');

  const reviewer = await prisma.user.findUnique({ where: { email: reviewerEmail } });
  if (!reviewer) {
    console.error(`Reviewer "${reviewerEmail}" not found`);
    return;
  }

  const listing = await prisma.listing.findUnique({ where: { slug: listingSlug } });
  if (!listing) {
    console.error(`Listing "${listingSlug}" not found`);
    return;
  }

  const review = await prisma.review.create({
    data: {
      listingId: listing.id,
      reviewerId: reviewer.id,
      sellerId: listing.sellerId,
      rating,
      title,
      body,
      verifiedPurchase: true,
    },
  });

  console.log(`✓ Review created (ID: ${review.id})`);
}

async function addConversation() {
  console.log('\n--- Add New Conversation ---');
  const buyerEmail = await question('Buyer Email: ');
  const listingSlug = await question('Listing Slug: ');
  const message = await question('First Message: ');

  const buyer = await prisma.user.findUnique({ where: { email: buyerEmail } });
  if (!buyer) {
    console.error(`Buyer "${buyerEmail}" not found`);
    return;
  }

  const listing = await prisma.listing.findUnique({ where: { slug: listingSlug } });
  if (!listing) {
    console.error(`Listing "${listingSlug}" not found`);
    return;
  }

  const conversation = await prisma.conversation.create({
    data: {
      buyerId: buyer.id,
      sellerId: listing.sellerId,
      listingId: listing.id,
    },
  });

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: buyer.id,
      body: message,
    },
  });

  console.log(`✓ Conversation created (ID: ${conversation.id})`);
}

async function showStats() {
  console.log('\n--- Database Statistics ---');
  
  const [users, listings, orders, reviews, conversations, disputes] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count(),
    prisma.order.count(),
    prisma.review.count(),
    prisma.conversation.count(),
    prisma.dispute.count(),
  ]);

  console.log(`Users: ${users}`);
  console.log(`Listings: ${listings}`);
  console.log(`Orders: ${orders}`);
  console.log(`Reviews: ${reviews}`);
  console.log(`Conversations: ${conversations}`);
  console.log(`Disputes: ${disputes}`);
}

async function main() {
  console.log('=== Test Data Addition Utility ===\n');
  
  while (true) {
    console.log('\nSelect an option:');
    console.log('1. Add User');
    console.log('2. Add Listing');
    console.log('3. Add Images to Listing');
    console.log('4. Add Order');
    console.log('5. Add Review');
    console.log('6. Add Conversation');
    console.log('7. Show Statistics');
    console.log('8. Exit');
    
    const choice = await question('\nEnter choice (1-8): ');
    
    switch (choice) {
      case '1':
        await addUser();
        break;
      case '2':
        await addListing();
        break;
      case '3':
        await addImagesToListing();
        break;
      case '4':
        await addOrder();
        break;
      case '5':
        await addReview();
        break;
      case '6':
        await addConversation();
        break;
      case '7':
        await showStats();
        break;
      case '8':
        console.log('Goodbye!');
        rl.close();
        await prisma.$disconnect();
        process.exit(0);
      default:
        console.log('Invalid choice');
    }
  }
}

main().catch(async (e) => {
  console.error(e);
  rl.close();
  await prisma.$disconnect();
  process.exit(1);
});
