import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

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
  { resource: 'dispute', action: 'read', description: 'View disputes' },
  { resource: 'dispute', action: 'create', description: 'Create disputes' },
  { resource: 'dispute', action: 'manage', description: 'Manage disputes' },
  { resource: 'dispute', action: 'assign', description: 'Assign disputes' },
  { resource: 'dispute', action: 'resolve', description: 'Resolve disputes' },
  { resource: 'dispute', action: 'escalate', description: 'Escalate disputes' },
  { resource: 'dispute', action: 'view_evidence', description: 'View dispute evidence' },
  { resource: 'dispute', action: 'manage_categories', description: 'Manage dispute categories' },
];

/** Role slug → permission keys (resource:action) */
const ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  buyer: [
    'listing:read',
    'conversation:read',
    'conversation:create',
    'notification:read',
    'report:read',
    'dispute:read',
    'dispute:create',
  ],
  seller: [
    'listing:create',
    'listing:read',
    'listing:update',
    'listing:delete',
    'conversation:read',
    'conversation:create',
    'notification:read',
    'dispute:read',
    'dispute:create',
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
    'dispute:read',
    'dispute:manage',
    'dispute:assign',
    'dispute:resolve',
    'dispute:escalate',
    'dispute:view_evidence',
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
    'dispute:read',
    'dispute:manage',
    'dispute:assign',
    'dispute:resolve',
    'dispute:escalate',
    'dispute:view_evidence',
    'dispute:manage_categories',
  ],
  super_admin: PERMISSIONS.map((p) => `${p.resource}:${p.action}`),
  support: [
    'user:read',
    'report:read',
    'report:moderate',
    'conversation:read',
    'notification:read',
    'verification:read',
    'dispute:read',
    'dispute:manage',
    'dispute:assign',
    'dispute:resolve',
    'dispute:view_evidence',
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

  // ── Test users ──────────────────────────────────────────────────
  const TEST_USERS = [
    { email: 'buyer@habesha.com',     displayName: 'Abeba Buyer',     role: 'buyer',       status: 'active' },
    { email: 'buyer2@habesha.com',    displayName: 'Hana Buyer',      role: 'buyer',       status: 'active' },
    { email: 'buyer3@habesha.com',    displayName: 'Dawit Buyer',     role: 'buyer',       status: 'suspended' },
    { email: 'seller@habesha.com',    displayName: 'Kidane Seller',   role: 'seller',      status: 'active' },
    { email: 'seller2@habesha.com',   displayName: 'Tigist Fashion',  role: 'seller',      status: 'active' },
    { email: 'seller3@habesha.com',   displayName: 'Yohannes Designs',role: 'seller',      status: 'active' },
    { email: 'seller4@habesha.com',   displayName: 'Almaz Couture',   role: 'seller',      status: 'suspended' },
    { email: 'admin@habesha.com',     displayName: 'Admin User',      role: 'admin',       status: 'active' },
    { email: 'moderator@habesha.com', displayName: 'Mod User',        role: 'moderator',   status: 'active' },
    { email: 'super@habesha.com',     displayName: 'Super Admin',     role: 'super_admin', status: 'active' },
    { email: 'support@habesha.com',   displayName: 'Support Agent',   role: 'support',     status: 'active' },
  ] as const;

  const PASSWORD = 'Test1234'; // meets requirements: 8+ chars, uppercase, digit
  const passwordHash = await argon2.hash(PASSWORD, {
    type: argon2.argon2id,
    memoryCost: 65_536,
    timeCost: 3,
    parallelism: 4,
  });

  const roleByName = new Map(
    (await prisma.role.findMany()).map((r) => [r.slug, r.id]),
  );

  // Get user IDs for admin operations
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@habesha.com' },
  });
  const moderatorUser = await prisma.user.findFirst({
    where: { email: 'moderator@habesha.com' },
  });

  console.log('Admin user:', adminUser?.id);
  console.log('Moderator user:', moderatorUser?.id);

  let usersCreated = 0;
  for (const u of TEST_USERS) {
    const roleId = roleByName.get(u.role);
    if (!roleId) {
      console.warn(`Skipping ${u.email}: role "${u.role}" not found`);
      continue;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: u.email },
    });

    if (existingUser) {
      // Update existing user
      await prisma.user.update({
        where: { email: u.email },
        data: {
          displayName: u.displayName,
          passwordHash,
          roleId,
          status: u.status,
          emailVerifiedAt: new Date(),
          ...(u.role === 'seller' ? {
            sellerType: 'boutique',
            bio: `Professional ${u.displayName} specializing in Ethiopian fashion and traditional wear.`,
            location: 'Addis Ababa, Ethiopia',
            specialties: ['Traditional Wear', 'Modern Fashion', 'Custom Design'],
            responseRate: 95,
            responseTimeHours: 2,
            totalSales: Math.floor(Math.random() * 100) + 10,
          } : {}),
        },
      });
    } else {
      // Create new user
      await prisma.user.create({
        data: {
          email: u.email,
          displayName: u.displayName,
          passwordHash,
          roleId,
          status: u.status,
          emailVerifiedAt: new Date(),
          ...(u.role === 'seller' ? {
            sellerType: 'boutique',
            bio: `Professional ${u.displayName} specializing in Ethiopian fashion and traditional wear.`,
            location: 'Addis Ababa, Ethiopia',
            specialties: ['Traditional Wear', 'Modern Fashion', 'Custom Design'],
            responseRate: 95,
            responseTimeHours: 2,
            totalSales: Math.floor(Math.random() * 100) + 10,
          } : {}),
        },
      });
    }
    usersCreated++;
  }

  console.log(`Seeded ${usersCreated} test users (password: "${PASSWORD}" for all).`);

  // ── Categories ────────────────────────────────────────────────────
  const CATEGORIES = [
    { name: "Women's Fashion", nameAm: 'የሴት ልብስ', slug: 'womens-fashion', sortOrder: 1 },
    { name: "Men's Fashion", nameAm: 'የወንድ ልብስ', slug: 'mens-fashion', sortOrder: 2 },
    { name: 'Baby & Kids Fashion', nameAm: 'የልጅ ልብስ', slug: 'baby-kids-fashion', sortOrder: 3 },
  ];

  const SUBCATEGORIES = [
    // Women's Fashion
    { name: 'Cultural Dresses (Habesha Kemis)', nameAm: 'ባህላዊ አልባሳት (ሐበሻ ከሚስ)', slug: 'cultural-dresses-habesha-kemis', parentSlug: 'womens-fashion', sortOrder: 1 },
    { name: 'Bride Cultural Dresses', nameAm: 'የሙሽት ባህላዊ አልባሳት', slug: 'bride-cultural-dresses', parentSlug: 'womens-fashion', sortOrder: 2 },
    { name: 'Bridesmaids Dresses', nameAm: 'የሙሽት አጋሮች አልባሳት', slug: 'bridesmaids-dresses', parentSlug: 'womens-fashion', sortOrder: 3 },
    { name: 'Family Matching Outfits', nameAm: 'የቤተሰብ የተመሳሳይ አልባሳት', slug: 'family-matching-outfits', parentSlug: 'womens-fashion', sortOrder: 4 },
    { name: 'Engagement Outfits', nameAm: 'የግልም አልባሳት', slug: 'engagement-outfits', parentSlug: 'womens-fashion', sortOrder: 5 },
    { name: 'Modern Dresses', nameAm: 'ዘመናዊ አልባሳት', slug: 'modern-dresses', parentSlug: 'womens-fashion', sortOrder: 6 },
    { name: "Women's Skirts", nameAm: 'የሴት ቀሚሶች', slug: 'womens-skirts', parentSlug: 'womens-fashion', sortOrder: 7 },
    { name: "Women's Accessories", nameAm: 'የሴት ቁጠባዎች', slug: 'womens-accessories', parentSlug: 'womens-fashion', sortOrder: 8 },
    // Men's Fashion
    { name: 'Cultural Shirts', nameAm: 'ባህላዊ ሸሚዛቶች', slug: 'cultural-shirts', parentSlug: 'mens-fashion', sortOrder: 1 },
    { name: 'Cultural Suits', nameAm: 'ባህላዊ ሱቶች', slug: 'cultural-suits', parentSlug: 'mens-fashion', sortOrder: 2 },
    { name: 'Traditional Kuta / Gabi', nameAm: 'ባህላዊ ኩታ / ጋቢ', slug: 'traditional-kuta-gabi', parentSlug: 'mens-fashion', sortOrder: 3 },
    { name: 'Custom Shirts', nameAm: 'የተለየ ሸሚዛቶች', slug: 'custom-shirts', parentSlug: 'mens-fashion', sortOrder: 4 },
    { name: 'Groom Cultural Wear', nameAm: 'የሙሽት ባህላዊ ልብስ', slug: 'groom-cultural-wear', parentSlug: 'mens-fashion', sortOrder: 5 },
    { name: 'Bridesmaids Clothes', nameAm: 'የሙሽት አጋሮች ልብስ', slug: 'bridesmaids-clothes', parentSlug: 'mens-fashion', sortOrder: 6 },
    { name: 'Family Matching Outfits', nameAm: 'የቤተሰብ የተመሳሳይ ልብስ', slug: 'family-matching-outfits-men', parentSlug: 'mens-fashion', sortOrder: 7 },
    { name: 'Engagement Outfits', nameAm: 'የግልም ልብስ', slug: 'engagement-outfits-men', parentSlug: 'mens-fashion', sortOrder: 8 },
    { name: "Men's Accessories", nameAm: 'የወንድ ቁጠባዎች', slug: 'mens-accessories', parentSlug: 'mens-fashion', sortOrder: 9 },
    // Baby & Kids Fashion
    { name: 'Girls Cultural Dresses', nameAm: 'የልጅ ሴቶች ባህላዊ አልባሳት', slug: 'girls-cultural-dresses', parentSlug: 'baby-kids-fashion', sortOrder: 1 },
    { name: 'Boys Cultural Wear', nameAm: 'የልጅ ወንዶች ባህላዊ ልብስ', slug: 'boys-cultural-wear', parentSlug: 'baby-kids-fashion', sortOrder: 2 },
    { name: 'Special Occasion Outfits', nameAm: 'ለልዩ በዓሎች አልባሳት', slug: 'special-occasion-outfits', parentSlug: 'baby-kids-fashion', sortOrder: 3 },
    { name: 'Accessories', nameAm: 'ቁጠባዎች', slug: 'kids-accessories', parentSlug: 'baby-kids-fashion', sortOrder: 4 },
  ];

  // Upsert parent categories
  const catBySlug = new Map<string, string>();
  for (const c of CATEGORIES) {
    const created = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, nameAm: c.nameAm },
      create: { name: c.name, nameAm: c.nameAm, slug: c.slug, sortOrder: c.sortOrder },
    });
    catBySlug.set(c.slug, created.id);
  }

  // Upsert subcategories
  for (const sc of SUBCATEGORIES) {
    const parentId = catBySlug.get(sc.parentSlug);
    const created = await prisma.category.upsert({
      where: { slug: sc.slug },
      update: { name: sc.name, nameAm: sc.nameAm },
      create: { name: sc.name, nameAm: sc.nameAm, slug: sc.slug, parentId, sortOrder: sc.sortOrder },
    });
    catBySlug.set(sc.slug, created.id);
  }

  console.log(`Seeded ${CATEGORIES.length} parent categories and ${SUBCATEGORIES.length} subcategories.`);

  // ── Dispute Categories ───────────────────────────────────────────
  const DISPUTE_CATEGORIES = [
    { name: 'Item not as described', nameAm: 'ዕቃው እንደ ተገለጸው አይደለም', slug: 'item-not-as-described', description: 'Item received differs significantly from listing description or photos.', sortOrder: 1 },
    { name: 'Fraud/scam', nameAm: 'ማጭበርበር / ስካም', slug: 'fraud-scam', description: 'Suspected fraudulent transaction or deceptive activity.', sortOrder: 2 },
    { name: 'Suspicious activity', nameAm: 'ተጠራጣሪ እንቅስቃሴ', slug: 'suspicious-activity', description: 'Unusual behavior, account compromise, or policy violation attempt.', sortOrder: 3 },
    { name: 'Payment disagreement', nameAm: 'የክፍያ አለመግባባት', slug: 'payment-disagreement', description: 'Discrepancies regarding price, payment method, or agreed amount.', sortOrder: 4 },
    { name: 'Seller issue', nameAm: 'የሻጭ ችግር', slug: 'seller-issue', description: 'Unresponsive seller, refusal to fulfill, or shipping delays.', sortOrder: 5 },
    { name: 'Buyer issue', nameAm: 'የገዢ ችግር', slug: 'buyer-issue', description: 'Unresponsive buyer, refusal to pay, or unreasonable demands.', sortOrder: 6 },
    { name: 'Rental return issue', nameAm: 'የኪራይ መመለስ ችግር', slug: 'rental-return-issue', description: 'Late return, failure to return, or return location dispute.', sortOrder: 7 },
    { name: 'Rental damage', nameAm: 'የኪራይ ጉዳት', slug: 'rental-damage', description: 'Item returned damaged, stained, or broken.', sortOrder: 8 },
    { name: 'Custom order disagreement', nameAm: 'የተለየ ትዕዛዝ አለመግባባት', slug: 'custom-order-disagreement', description: 'Custom tailoring measurements, design, or material mismatch.', sortOrder: 9 },
    { name: 'Item authenticity/counterfeit', nameAm: 'የዕቃው እውነተኛነት / አስመሳይ', slug: 'item-authenticity-counterfeit', description: 'Suspected counterfeit or unauthorized replica.', sortOrder: 10 },
    { name: 'Harassment/abuse', nameAm: 'ትላላክ / ስድብ', slug: 'harassment-abuse', description: 'Abusive language, harassment, or inappropriate conduct.', sortOrder: 11 },
    { name: 'No-show', nameAm: 'አልተገኘም', slug: 'no-show', description: 'Party failed to show up for scheduled pickup/handover.', sortOrder: 12 },
    { name: 'Agreement/transaction issue', nameAm: 'የስምምነት / ግብይት ችግር', slug: 'agreement-transaction-issue', description: 'General disagreement regarding terms or handover conditions.', sortOrder: 13 },
    { name: 'Other', nameAm: 'ሌላ', slug: 'other', description: 'Other dispute reason not listed above.', sortOrder: 14 },
  ];

  let disputeCategoriesCreated = 0;
  for (const dc of DISPUTE_CATEGORIES) {
    await prisma.disputeCategory.upsert({
      where: { slug: dc.slug },
      update: { name: dc.name, nameAm: dc.nameAm, description: dc.description, sortOrder: dc.sortOrder },
      create: dc,
    });
    disputeCategoriesCreated++;
  }
  console.log(`Seeded ${disputeCategoriesCreated} dispute categories.`);

  // ── Test Listings ─────────────────────────────────────────────────
  console.log('Starting to create test listings...');
  // Use Unsplash images as placeholders
  const IMG = {
    k1: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80',
    k2: 'https://images.unsplash.com/photo-1583391733956-6c78276477e1?w=800&q=80',
    k3: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80',
    k4: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800&q=80',
    k5: 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=800&q=80',
    k6: 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&q=80',
    k7: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    k8: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80',
    k9: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80',
  };

  const sellerEmails = ['seller@habesha.com', 'seller2@habesha.com', 'seller3@habesha.com', 'seller4@habesha.com'] as const;
  const sellers = await prisma.user.findMany({ where: { email: { in: [...sellerEmails] } } });
  const sellerByEmail = new Map(sellers.map((s) => [s.email, s]));

  console.log(`Found ${sellers.length} sellers for listings`);

  const LISTINGS: Array<{
    sellerEmail: string;
    categorySlug: string;
    title: string;
    slug: string;
    description: string;
    price: number;
    condition: 'new' | 'like_new' | 'good';
    city: string;
    isFeatured: boolean;
    availableForPurchase: boolean;
    availableForRent: boolean;
    customOrderAvailable: boolean;
    rentalPricePerDay?: number;
    rentalDeposit?: number;
    imageUrl: string;
    status?: 'active' | 'pending_review' | 'rejected' | 'sold' | 'archived';
  }> = [
    // Kidane — seller@habesha.com
    {
      sellerEmail: 'seller@habesha.com', categorySlug: 'cultural-dresses-habesha-kemis',
      title: 'Handwoven Habesha Kemis — Classic White', slug: 'handwoven-habesha-kemis-classic-white',
      description: 'A stunning handwoven Habesha Kemis made from premium Ethiopian cotton. Features intricate tibeb embroidery along the neckline and hem in vibrant gold and green threads. Perfect for holidays, weddings, and cultural celebrations. Each piece takes approximately 3 weeks to weave by skilled artisans.',
      price: 4500, condition: 'new', city: 'Addis Ababa', isFeatured: true,
      availableForPurchase: true, availableForRent: true, customOrderAvailable: true,
      rentalPricePerDay: 500, rentalDeposit: 2000, imageUrl: IMG.k1, status: 'active',
    },
    {
      sellerEmail: 'seller@habesha.com', categorySlug: 'traditional-kuta-gabi',
      title: 'Handwoven Cotton Gabi — Winter Weight', slug: 'handwoven-cotton-gabi-winter',
      description: 'A warm, heavy cotton Gabi perfect for cool evenings. Handwoven by artisans in Dorze using traditional techniques passed down through generations. This thick Gabi features subtle geometric patterns along the border. Measures approximately 2.5m × 1.8m.',
      price: 2800, condition: 'new', city: 'Addis Ababa', isFeatured: true,
      availableForPurchase: true, availableForRent: false, customOrderAvailable: false,
      imageUrl: IMG.k2, status: 'active',
    },
    {
      sellerEmail: 'seller@habesha.com', categorySlug: 'modern-dresses',
      title: 'Modern Ethiopian Evening Dress — Emerald Silk', slug: 'modern-ethiopian-evening-dress-emerald',
      description: 'A contemporary evening dress inspired by Ethiopian design motifs. Crafted from emerald green silk with delicate gold thread detailing at the bodice. Features a flattering A-line silhouette with a modern high-low hemline. Available in sizes S-XL.',
      price: 3200, condition: 'new', city: 'Addis Ababa', isFeatured: true,
      availableForPurchase: true, availableForRent: true, customOrderAvailable: true,
      rentalPricePerDay: 400, rentalDeposit: 1500, imageUrl: IMG.k3, status: 'active',
    },
    // Tigist — seller2@habesha.com
    {
      sellerEmail: 'seller2@habesha.com', categorySlug: 'womens-accessories',
      title: 'Beaded Tibeb Necklace — Multicolor', slug: 'beaded-tibeb-necklace-multicolor',
      description: 'A gorgeous hand-beaded necklace inspired by traditional Ethiopian tibeb patterns. Features colorful glass beads arranged in a geometric design with brass clasp. Each necklace is unique — slight variations in bead color may occur. Length: adjustable 40-50cm.',
      price: 650, condition: 'new', city: 'Bahir Dar', isFeatured: false,
      availableForPurchase: true, availableForRent: false, customOrderAvailable: true,
      imageUrl: IMG.k4, status: 'active',
    },
    {
      sellerEmail: 'seller2@habesha.com', categorySlug: 'bride-cultural-dresses',
      title: 'Premium Silk Bride Cultural Dress — Ivory & Gold', slug: 'premium-silk-bride-dress-ivory-gold',
      description: 'An elegant three-piece bride cultural dress crafted from pure Ethiopian silk. The set includes the main wrap, a matching shawl (netela), and a head piece. Adorned with gold-thread embroidery featuring traditional cross motifs. Ideal for weddings and religious ceremonies.',
      price: 6500, condition: 'new', city: 'Bahir Dar', isFeatured: true,
      availableForPurchase: true, availableForRent: true, customOrderAvailable: false,
      rentalPricePerDay: 800, rentalDeposit: 3000, imageUrl: IMG.k5, status: 'active',
    },
    {
      sellerEmail: 'seller2@habesha.com', categorySlug: 'traditional-kuta-gabi',
      title: 'Embroidered Netela Shawl — Delicate Lace', slug: 'embroidered-netela-shawl-lace',
      description: 'A lightweight, sheer netela shawl with delicate hand-embroidered borders. Made from fine cotton muslin, this versatile piece can be worn as a shawl, head covering, or decorative accent. The intricate cross-stitch border features traditional Ethiopian motifs in deep blue thread.',
      price: 1200, condition: 'like_new', city: 'Bahir Dar', isFeatured: false,
      availableForPurchase: true, availableForRent: false, customOrderAvailable: true,
      imageUrl: IMG.k6, status: 'active',
    },
    // Yohannes — seller3@habesha.com
    {
      sellerEmail: 'seller3@habesha.com', categorySlug: 'cultural-suits',
      title: 'Custom-Tailored Ethiopian Cultural Suit', slug: 'custom-tailored-ethiopian-cultural-suit',
      description: 'A bespoke three-piece suit hand-tailored to your measurements. Features a modern slim-fit cut with subtle Ethiopian-inspired embroidery on the lapel and cuffs. Fabric is premium Italian wool blend in charcoal grey. Includes jacket, vest, and trousers. Allow 4-6 weeks for custom tailoring.',
      price: 8500, condition: 'new', city: 'Hawassa', isFeatured: true,
      availableForPurchase: true, availableForRent: true, customOrderAvailable: true,
      rentalPricePerDay: 1200, rentalDeposit: 4000, imageUrl: IMG.k7, status: 'active',
    },
    {
      sellerEmail: 'seller3@habesha.com', categorySlug: 'custom-shirts',
      title: 'Casual Cotton Shirt — Tibeb Collar Design', slug: 'casual-cotton-shirt-tibeb-collar',
      description: 'A comfortable everyday cotton shirt featuring a unique tibeb-patterned collar inspired by traditional Ethiopian weaving. Made from breathable 100% organic cotton in a relaxed fit. Available in white, sky blue, and olive. Machine washable.',
      price: 950, condition: 'new', city: 'Hawassa', isFeatured: false,
      availableForPurchase: true, availableForRent: false, customOrderAvailable: true,
      imageUrl: IMG.k8, status: 'active',
    },
    {
      sellerEmail: 'seller3@habesha.com', categorySlug: 'cultural-dresses-habesha-kemis',
      title: 'Designer Habesha Kemis — Royal Purple', slug: 'designer-habesha-kemis-royal-purple',
      description: 'A show-stopping designer Habesha Kemis in rich royal purple fabric. Features hand-stitched silver thread embroidery with modern geometric patterns blending traditional and contemporary aesthetics. The dress falls below the knee with a slight flare. Comes with matching netela.',
      price: 5800, condition: 'new', city: 'Hawassa', isFeatured: true,
      availableForPurchase: true, availableForRent: true, customOrderAvailable: true,
      rentalPricePerDay: 700, rentalDeposit: 2500, imageUrl: IMG.k9, status: 'active',
    },
    // Additional listings for variety - Kidane
    {
      sellerEmail: 'seller@habesha.com', categorySlug: 'cultural-dresses-habesha-kemis',
      title: 'Vintage Habesha Kemis — Antique Collection', slug: 'vintage-habesha-kemis-antique',
      description: 'A rare vintage Habesha Kemis from the 1960s, featuring traditional weaving patterns no longer commonly practiced. This piece has been carefully preserved and is in excellent condition. A true collector\'s item for Ethiopian textile enthusiasts.',
      price: 12000, condition: 'good', city: 'Addis Ababa', isFeatured: true,
      availableForPurchase: true, availableForRent: false, customOrderAvailable: false,
      imageUrl: IMG.k1, status: 'active',
    },
    {
      sellerEmail: 'seller@habesha.com', categorySlug: 'modern-dresses',
      title: 'Modern Fusion Dress — Coffee Bean Brown', slug: 'modern-fusion-dress-coffee-brown',
      description: 'A contemporary dress that fuses Ethiopian coffee culture inspiration with modern silhouette. The rich coffee brown fabric features subtle coffee bean embroidery. Perfect for casual outings and cultural events.',
      price: 1800, condition: 'new', city: 'Addis Ababa', isFeatured: false,
      availableForPurchase: true, availableForRent: true, customOrderAvailable: true,
      rentalPricePerDay: 300, rentalDeposit: 1000, imageUrl: IMG.k3, status: 'sold',
    },
    // Additional listings - Tigist
    {
      sellerEmail: 'seller2@habesha.com', categorySlug: 'womens-accessories',
      title: 'Handcrafted Leather Bag — Ethiopian Motifs', slug: 'handcrafted-leather-bag-ethiopian-motifs',
      description: 'A beautifully crafted leather bag featuring hand-tooled Ethiopian patterns. Made from genuine Ethiopian leather with adjustable strap and multiple compartments. Each bag is unique and showcases traditional craftsmanship.',
      price: 2200, condition: 'new', city: 'Bahir Dar', isFeatured: false,
      availableForPurchase: true, availableForRent: false, customOrderAvailable: false,
      imageUrl: IMG.k4, status: 'active',
    },
    {
      sellerEmail: 'seller2@habesha.com', categorySlug: 'womens-accessories',
      title: 'Silver Jewelry Set — Axum Inspiration', slug: 'silver-jewelry-set-axum-inspiration',
      description: 'A stunning silver jewelry set inspired by ancient Axumite designs. Includes necklace, earrings, and bracelet. Handcrafted by local silversmiths using traditional techniques. Sterling silver with modern safety clasps.',
      price: 3500, condition: 'new', city: 'Bahir Dar', isFeatured: true,
      availableForPurchase: true, availableForRent: true, customOrderAvailable: false,
      rentalPricePerDay: 450, rentalDeposit: 1500, imageUrl: IMG.k6, status: 'active',
    },
    // Additional listings - Yohannes
    {
      sellerEmail: 'seller3@habesha.com', categorySlug: 'cultural-suits',
      title: 'Ethiopian Festival Suit — Multi-Color', slug: 'ethiopian-festival-suit-multi-color',
      description: 'A vibrant festival suit featuring traditional Ethiopian colors in modern tailoring. The jacket has subtle tribal patterns woven into the fabric. Perfect for Meskel, Timket, and other cultural celebrations.',
      price: 5500, condition: 'new', city: 'Hawassa', isFeatured: false,
      availableForPurchase: true, availableForRent: true, customOrderAvailable: true,
      rentalPricePerDay: 800, rentalDeposit: 2500, imageUrl: IMG.k7, status: 'active',
    },
    {
      sellerEmail: 'seller3@habesha.com', categorySlug: 'custom-shirts',
      title: 'Ethiopian Print T-Shirt Collection', slug: 'ethiopian-print-tshirt-collection',
      description: 'A set of 3 casual t-shirts featuring modern Ethiopian prints and patterns. Made from breathable cotton with comfortable fit. Designs include flag colors, Amharic script, and cultural symbols. Machine washable.',
      price: 1200, condition: 'new', city: 'Hawassa', isFeatured: false,
      availableForPurchase: true, availableForRent: false, customOrderAvailable: false,
      imageUrl: IMG.k8, status: 'active',
    },
    // Almaz - seller4@habesha.com (new seller)
    {
      sellerEmail: 'seller4@habesha.com', categorySlug: 'bride-cultural-dresses',
      title: 'Luxury Wedding Habesha Kemis — Gold Thread', slug: 'luxury-wedding-habesha-kemis-gold',
      description: 'An exquisite wedding Habesha Kemis with extensive gold thread embroidery. The dress features traditional wedding motifs and can be customized with bride\'s initials. Made from premium fabric with silk lining.',
      price: 15000, condition: 'new', city: 'Dire Dawa', isFeatured: true,
      availableForPurchase: true, availableForRent: true, customOrderAvailable: true,
      rentalPricePerDay: 2000, rentalDeposit: 5000, imageUrl: IMG.k9, status: 'pending_review',
    },
    {
      sellerEmail: 'seller4@habesha.com', categorySlug: 'bridesmaids-dresses',
      title: 'Bridal Party Collection — matching set', slug: 'bridal-party-collection-matching-set',
      description: 'A complete bridal party collection featuring 4 matching dresses in different sizes. Each dress has subtle variations while maintaining cohesive design. Perfect for Ethiopian weddings with multiple bridesmaids.',
      price: 25000, condition: 'new', city: 'Dire Dawa', isFeatured: true,
      availableForPurchase: true, availableForRent: false, customOrderAvailable: true,
      imageUrl: IMG.k3, status: 'active',
    },
  ];

  let listingsCreated = 0;
  for (const l of LISTINGS) {
    const seller = sellerByEmail.get(l.sellerEmail);
    if (!seller) {
      console.warn(`Skipping listing "${l.title}": seller ${l.sellerEmail} not found`);
      continue;
    }
    const categoryId = catBySlug.get(l.categorySlug);
    if (!categoryId) {
      console.warn(`Skipping listing "${l.title}": category ${l.categorySlug} not found`);
      continue;
    }

    const existing = await prisma.listing.findUnique({ where: { slug: l.slug } });
    if (existing) {
      console.log(`Listing "${l.title}" already exists, skipping`);
      continue; // idempotent
    }

    const listing = await prisma.listing.create({
      data: {
        sellerId: seller.id,
        categoryId,
        title: l.title,
        slug: l.slug,
        description: l.description,
        price: l.price,
        currency: 'ETB',
        condition: l.condition,
        status: l.status || 'active',
        city: l.city,
        country: 'ET',
        isFeatured: l.isFeatured,
        availableForPurchase: l.availableForPurchase,
        availableForRent: l.availableForRent,
        customOrderAvailable: l.customOrderAvailable,
        supportsReadyMade: l.availableForPurchase,
        supportsCustomDesign: l.customOrderAvailable,
        ...(l.rentalPricePerDay ? { rentalPricePerDay: l.rentalPricePerDay } : {}),
        ...(l.rentalDeposit ? { rentalDeposit: l.rentalDeposit } : {}),
        publishedAt: new Date(),
        contactOptions: { phone: seller.phone ?? undefined, chat: true },
      },
    });

    // Create a primary image
    await prisma.listingImage.create({
      data: {
        listingId: listing.id,
        url: l.imageUrl,
        cloudinaryPublicId: `seed/${l.slug}`,
        sortOrder: 0,
        isPrimary: true,
      },
    });

    listingsCreated++;
  }

  console.log(`Created ${listingsCreated} test listings.`);

  // Force refresh sellerByEmail after creating listings
  const sellersAfterListing = await prisma.user.findMany({ where: { email: { in: [...sellerEmails] } } });
  sellerByEmail.clear();
  sellersAfterListing.forEach((s) => sellerByEmail.set(s.email, s));

  console.log('Sellers after listing creation:', Array.from(sellerByEmail.keys()));

  // ── Additional Testing Listings with Different Statuses ─────────────
  const seller = sellerByEmail.get('seller@habesha.com');
  const habeshaCatId = catBySlug.get('habesha-kemis');
  
  if (seller && habeshaCatId) {
    // Pending review listing
    const pendingSlug = 'pending-review-habesha-kemis-test';
    const existingPending = await prisma.listing.findUnique({ where: { slug: pendingSlug } });
    if (!existingPending) {
      const pendingListing = await prisma.listing.create({
        data: {
          sellerId: seller.id,
          categoryId: habeshaCatId,
          title: 'Pending Review Habesha Kemis',
          slug: pendingSlug,
          description: 'This listing is pending admin review',
          price: 2500,
          currency: 'ETB',
          condition: 'new',
          status: 'pending_review',
          city: 'Addis Ababa',
          country: 'ET',
          availableForPurchase: true,
          availableForRent: false,
          customOrderAvailable: true,
          supportsReadyMade: true,
          supportsCustomDesign: true,
          contactOptions: { phone: seller.phone ?? undefined, chat: true },
          publishedAt: new Date(),
        },
      });
      
      await prisma.listingImage.create({
        data: {
          listingId: pendingListing.id,
          url: IMG.k1,
          cloudinaryPublicId: `seed/${pendingListing.slug}`,
          sortOrder: 0,
          isPrimary: true,
        },
      });
    }

    // Rejected listing with reason
    const rejectedSlug = 'rejected-habesha-kemis-test';
    const existingRejected = await prisma.listing.findUnique({ where: { slug: rejectedSlug } });
    if (!existingRejected) {
      const rejectedListing = await prisma.listing.create({
        data: {
          sellerId: seller.id,
          categoryId: habeshaCatId,
          title: 'Rejected Habesha Kemis',
          slug: rejectedSlug,
          description: 'This listing was rejected by admin',
          price: 1800,
          currency: 'ETB',
          condition: 'good',
          status: 'rejected',
          rejectedReason: 'Insufficient product description and low quality images',
          city: 'Addis Ababa',
          country: 'ET',
          availableForPurchase: true,
          availableForRent: false,
          customOrderAvailable: false,
          supportsReadyMade: true,
          supportsCustomDesign: false,
          contactOptions: { phone: seller.phone ?? undefined, chat: true },
          publishedAt: new Date(),
        },
      });

      await prisma.listingImage.create({
        data: {
          listingId: rejectedListing.id,
          url: IMG.k2,
          cloudinaryPublicId: `seed/${rejectedListing.slug}`,
          sortOrder: 0,
          isPrimary: true,
        },
      });
    }

    console.log('Created additional test listings with different statuses');
  }

  // ── Verification Requests ───────────────────────────────────────────
  const buyer = await prisma.user.findFirst({
    where: { email: 'buyer@habesha.com' },
  });
  console.log('Buyer user:', buyer?.id);
  if (buyer) {
    const existingVerifications = await prisma.verificationRequest.findMany({
      where: { userId: buyer.id },
    });

    if (existingVerifications.length === 0) {
      await prisma.verificationRequest.create({
        data: {
          userId: buyer.id,
          type: 'identity',
          status: 'pending',
          documentUrl: 'https://example.com/id-doc.pdf',
          metadata: { documentType: 'national_id', idNumber: '12345678' },
        },
      });

      await prisma.verificationRequest.create({
        data: {
          userId: buyer.id,
          type: 'business',
          status: 'approved',
          documentUrl: 'https://example.com/business-license.pdf',
          metadata: { businessName: 'Test Business', licenseNumber: 'BL12345' },
          reviewedById: adminUser?.id,
          reviewedAt: new Date(),
        },
      });

      await prisma.verificationRequest.create({
        data: {
          userId: buyer.id,
          type: 'identity',
          status: 'rejected',
          documentUrl: 'https://example.com/invalid-doc.pdf',
          metadata: { documentType: 'passport', idNumber: 'INVALID' },
          rejectionReason: 'Document appears to be expired',
          reviewedById: adminUser?.id,
          reviewedAt: new Date(),
        },
      });

      console.log('Created verification requests');
    } else {
      console.log('Verification requests already exist, skipping');
    }
  }

  // ── Custom Orders ───────────────────────────────────────────────────
  const listingForCustom = await prisma.listing.findFirst({
    where: { slug: 'handwoven-habesha-kemis-classic-white' },
  });

  if (!listingForCustom) {
    console.warn('No listing found for custom orders');
  }

  console.log('Listing for custom orders:', listingForCustom?.id);
  console.log('Buyer for custom orders:', buyer?.id);

  if (listingForCustom && buyer) {
    const existingCustomOrders = await prisma.customOrder.findMany({
      where: { buyerId: buyer.id },
    });

    if (existingCustomOrders.length === 0) {
      await prisma.customOrder.create({
        data: {
          listingId: listingForCustom.id,
          buyerId: buyer.id,
          sellerId: listingForCustom.sellerId,
          status: 'submitted',
          selectedSize: 'M',
          measurements: { chest: 40, waist: 32, hips: 42, length: 60 },
          selectedFabric: 'Cotton',
          selectedColor: 'White',
          buyerNotes: 'Please add extra embroidery on the sleeves',
          agreedPrice: 5000,
        },
      });

      await prisma.customOrder.create({
        data: {
          listingId: listingForCustom.id,
          buyerId: buyer.id,
          sellerId: listingForCustom.sellerId,
          status: 'in_production',
          selectedSize: 'L',
          measurements: { chest: 42, waist: 34, hips: 44, length: 62 },
          selectedFabric: 'Silk',
          selectedColor: 'Red',
          buyerNotes: 'Traditional pattern with modern twist',
          agreedPrice: 6500,
        },
      });

      console.log('Created custom orders');
    } else {
      console.log('Custom orders already exist, skipping');
    }
  }

  // ── Orders ─────────────────────────────────────────────────────────
  const listingForOrder = await prisma.listing.findFirst({
    where: { slug: 'handwoven-cotton-gabi-winter' },
  });

  if (!listingForOrder) {
    console.warn('No listing found for orders');
  }

  console.log('Listing for orders:', listingForOrder?.id);
  console.log('Buyer for orders:', buyer?.id);

  if (listingForOrder && buyer) {
    const existingOrders = await prisma.order.findMany({
      where: { buyerId: buyer.id },
    });

    if (existingOrders.length === 0) {
      await prisma.order.create({
        data: {
          buyerId: buyer.id,
          sellerId: listingForOrder.sellerId,
          productId: listingForOrder.id,
          status: 'INQUIRY_PENDING',
          orderNumber: 'ORD-001',
          type: 'SALE',
          agreedPrice: 2800,
          conversationId: null,
        },
      });

      await prisma.order.create({
        data: {
          buyerId: buyer.id,
          sellerId: listingForOrder.sellerId,
          productId: listingForOrder.id,
          status: 'COMPLETED',
          orderNumber: 'ORD-002',
          type: 'SALE',
          agreedPrice: 3200,
          conversationId: null,
        },
      });

      console.log('Created orders');
    } else {
      console.log('Orders already exist, skipping');
    }
  }

  // ── Reports ─────────────────────────────────────────────────────────
  const reportedListing = await prisma.listing.findFirst({
    where: { slug: 'designer-habesha-kemis-royal-purple' },
  });

  if (!reportedListing) {
    console.warn('No listing found for reports');
  }

  if (reportedListing && buyer) {
    const existingReports = await prisma.report.findMany({
      where: { reporterId: buyer.id },
    });

    if (existingReports.length === 0) {
      await prisma.report.create({
        data: {
          reporterId: buyer.id,
          targetType: 'listing',
          listingId: reportedListing.id,
          reason: 'inappropriate_content',
          description: 'Listing contains misleading information',
          status: 'pending',
        },
      });

      // Get a seller ID for the user report
      const sellerForReport = sellerByEmail.get('seller@habesha.com');
      if (sellerForReport) {
        await prisma.report.create({
          data: {
            reporterId: buyer.id,
            targetType: 'user',
            reportedUserId: sellerForReport.id,
            reason: 'fraud',
            description: 'Seller not responding to messages',
            status: 'under_review',
            resolvedById: moderatorUser?.id,
            resolvedAt: new Date(),
          },
        });
      }

      console.log('Created reports');
    } else {
      console.log('Reports already exist, skipping');
    }
  }

  // ── Notifications ───────────────────────────────────────────────────
  if (buyer) {
    const existingNotifications = await prisma.notification.findMany({
      where: { userId: buyer.id },
    });

    if (existingNotifications.length === 0) {
      const sellerForNotification = sellerByEmail.get('seller@habesha.com');
      
      await prisma.notification.create({
        data: {
          userId: buyer.id,
          type: 'listing_approved',
          title: 'Listing approved',
          content: 'Your listing has been approved and is now live',
          data: { listingId: listingForOrder?.id },
        },
      });

      if (sellerForNotification) {
        await prisma.notification.create({
          data: {
            userId: buyer.id,
            type: 'new_message',
            title: 'New message',
            content: 'You have a new message from Kidane Seller',
            data: { senderId: sellerForNotification.id },
            readAt: new Date(),
          },
        });
      }

      await prisma.notification.create({
        data: {
          userId: buyer.id,
          type: 'new_order',
          title: 'Order shipped',
          content: 'Your order ORD-001 has been shipped',
          data: { orderId: 'test-order-id', orderNumber: 'ORD-001' },
        },
      });

      console.log('Created notifications');
    } else {
      console.log('Notifications already exist, skipping');
    }
  }

  // ── Rental Orders ───────────────────────────────────────────────────
  const rentalListing = await prisma.listing.findFirst({
    where: { availableForRent: true },
  });

  if (!rentalListing) {
    console.warn('No rental listing found');
  }

  if (rentalListing && buyer) {
    const existingRentals = await prisma.rentalOrder.findMany({
      where: { renterId: buyer.id },
    });

    if (existingRentals.length === 0) {
      await prisma.rentalOrder.create({
        data: {
          renterId: buyer.id,
          sellerId: rentalListing.sellerId,
          listingId: rentalListing.id,
          status: 'REQUESTED',
          orderNumber: 'RENT-001',
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          dailyRate: 500,
          totalAmount: 3500,
          securityDeposit: 2000,
          depositRefunded: false,
          pickupHub: 'Bole Hub',
        },
      });

      await prisma.rentalOrder.create({
        data: {
          renterId: buyer.id,
          sellerId: rentalListing.sellerId,
          listingId: rentalListing.id,
          status: 'ACTIVE',
          orderNumber: 'RENT-002',
          startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          dailyRate: 400,
          totalAmount: 2800,
          securityDeposit: 1500,
          depositRefunded: false,
          pickupHub: 'Kazanchis Hub',
          handoverAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      });

      console.log('Created rental orders');
    } else {
      console.log('Rental orders already exist, skipping');
    }
  }

  // ── Vendor KYC Profiles ────────────────────────────────────────────
  const seller2 = sellerByEmail.get('seller2@habesha.com');
  const seller1 = sellerByEmail.get('seller@habesha.com');
  
  if (seller2) {
    await prisma.vendorKycProfile.upsert({
      where: { userId: seller2.id },
      update: {},
      create: {
        userId: seller2.id,
        businessName: 'Tigist Fashion House',
        businessNameAm: 'ጥግስት ፋሽን ቤት',
        tinNumber: '1234567890',
        licenseUrl: 'https://example.com/business-license.pdf',
        status: 'PENDING',
      },
    });
  }

  if (seller1) {
    await prisma.vendorKycProfile.upsert({
      where: { userId: seller1.id },
      update: {},
      create: {
        userId: seller1.id,
        businessName: 'Kidane Traditional Wear',
        businessNameAm: 'ኪዳኔ ባህላዊ አልባሳት',
        tinNumber: '0987654321',
        licenseUrl: 'https://example.com/kidane-license.pdf',
        status: 'APPROVED',
        reviewedById: adminUser?.id,
        reviewedAt: new Date(),
      },
    });
  }

  if (seller2 || seller1) {
    console.log('Created vendor KYC profiles');
  }

  // ── Conversations ───────────────────────────────────────────────────
  if (buyer && listingForOrder) {
    const existingConversations = await prisma.conversation.findMany({
      where: { buyerId: buyer.id },
      include: { messages: true },
    });

    if (existingConversations.length === 0) {
      const conversation = await prisma.conversation.create({
        data: {
          buyerId: buyer.id,
          sellerId: listingForOrder.sellerId,
          listingId: listingForOrder.id,
        },
      });

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: buyer.id,
          content: 'Hello, is this item still available?',
        },
      });

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: listingForOrder.sellerId,
          content: 'Yes, it is available! Would you like to purchase it?',
        },
      });

      console.log('Created conversations and messages');
    } else if (existingConversations.some(c => c.messages.length === 0)) {
      // Add messages to conversations that don't have any
      for (const conversation of existingConversations) {
        if (conversation.messages.length === 0) {
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              senderId: buyer.id,
              content: 'Hello, is this item still available?',
            },
          });

          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              senderId: listingForOrder.sellerId,
              content: 'Yes, it is available! Would you like to make an offer?',
            },
          });
        }
      }
      console.log('Added messages to existing conversations');
    } else {
      console.log('Conversations already exist with messages, skipping');
    }
  } else {
    console.warn('Skipping conversations: missing buyer or listingForOrder');
  }

  // ── Favorites ───────────────────────────────────────────────────────
  if (buyer) {
    const existingFavorites = await prisma.favorite.findMany({
      where: { userId: buyer.id },
    });

    if (existingFavorites.length === 0) {
      const favoriteListings = await prisma.listing.findMany({
        where: { status: 'active' },
        take: 3,
      });

      for (const listing of favoriteListings) {
        await prisma.favorite.create({
          data: {
            userId: buyer.id,
            listingId: listing.id,
          },
        });
      }

      console.log('Created favorites');
    } else {
      console.log('Favorites already exist, skipping');
    }
  }

  // ── Reviews ─────────────────────────────────────────────────────────
  if (buyer && listingForOrder) {
    try {
      // Find a different listing for the second review
      const otherListing = await prisma.listing.findFirst({
        where: { 
          id: { not: listingForOrder.id },
          sellerId: listingForOrder.sellerId 
        },
      });

      await prisma.review.create({
        data: {
          listingId: listingForOrder.id,
          reviewerId: buyer.id,
          sellerId: listingForOrder.sellerId,
          rating: 5,
          title: 'Excellent quality!',
          content: 'The item was exactly as described. Very satisfied with the purchase.',
        },
      });

      if (otherListing) {
        await prisma.review.create({
          data: {
            listingId: otherListing.id,
            reviewerId: buyer.id,
            sellerId: otherListing.sellerId,
            rating: 4,
            title: 'Good value',
            content: 'Nice product, reasonable price. Would recommend.',
          },
        });
      }

      console.log('Created reviews');
    } catch (error) {
      console.log('Reviews already exist, skipping');
    }
  }

  // ── Follows ───────────────────────────────────────────────────────
  const buyer2 = await prisma.user.findFirst({
    where: { email: 'buyer2@habesha.com' },
  });

  if (buyer && seller) {
    const existingFollows = await prisma.follow.findMany({
      where: { followerId: buyer.id },
    });

    if (existingFollows.length === 0) {
      await prisma.follow.create({
        data: {
          followerId: buyer.id,
          followingId: seller.id,
        },
      });

      if (buyer2) {
        await prisma.follow.create({
          data: {
            followerId: buyer2.id,
            followingId: seller.id,
          },
        });
      }

      console.log('Created follows');
    } else {
      console.log('Follows already exist, skipping');
    }
  }

  // ── Callback Requests ───────────────────────────────────────────────
  if (buyer && listingForOrder) {
    const existingCallbacks = await prisma.callbackRequest.findMany({
      where: { sellerId: listingForOrder.sellerId },
    });

    if (existingCallbacks.length === 0) {
      await prisma.callbackRequest.create({
        data: {
          listingId: listingForOrder.id,
          sellerId: listingForOrder.sellerId,
          buyerName: buyer.displayName,
          buyerPhone: buyer.phone ?? '0911111111',
          preferredTime: 'Afternoon',
          message: 'I would like to discuss custom measurements',
          status: 'pending',
        },
      });

      console.log('Created callback requests');
    } else {
      console.log('Callback requests already exist, skipping');
    }
  }

  // ── Listing Price History ───────────────────────────────────────────
  if (listingForOrder) {
    const existingPriceHistory = await prisma.listingPriceHistory.findMany({
      where: { listingId: listingForOrder.id },
    });

    if (existingPriceHistory.length === 0) {
      await prisma.listingPriceHistory.create({
        data: {
          listingId: listingForOrder.id,
          price: 3000,
          currency: 'ETB',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      });

      await prisma.listingPriceHistory.create({
        data: {
          listingId: listingForOrder.id,
          price: 2900,
          currency: 'ETB',
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        },
      });

      console.log('Created listing price history');
    } else {
      console.log('Price history already exists, skipping');
    }
  }

  // ── Disputes ───────────────────────────────────────────────────────
  if (buyer && seller && listingForOrder) {
    const existingDisputes = await prisma.dispute.findMany({
      where: { reporterId: buyer.id },
    });

    if (existingDisputes.length === 0) {
      const dispute = await prisma.dispute.create({
        data: {
          ticketNumber: 'DSP-001',
          type: 'quality_mismatch',
          priority: 'medium',
          status: 'open',
          reporterId: buyer.id,
          reportedUserId: seller.id,
          listingId: listingForOrder.id,
          title: 'Item quality not as described',
          description: 'The fabric quality is different from what was shown in the listing photos',
          evidenceUrls: ['https://example.com/evidence1.jpg'],
        },
      });

      await prisma.disputeComment.create({
        data: {
          disputeId: dispute.id,
          authorId: buyer.id,
          content: 'I have attached photos showing the difference in fabric quality',
          isInternal: false,
        },
      });

      await prisma.disputeComment.create({
        data: {
          disputeId: dispute.id,
          authorId: moderatorUser?.id ?? buyer.id,
          content: 'We are reviewing the evidence provided',
          isInternal: true,
        },
      });

      console.log('Created disputes and comments');
    } else {
      console.log('Disputes already exist, skipping');
    }
  }

  // ── Rental Extensions ───────────────────────────────────────────────
  const activeRental = await prisma.rentalOrder.findFirst({
    where: { status: 'ACTIVE' },
  });

  if (activeRental && buyer) {
    const existingExtensions = await prisma.rentalExtension.findMany({
      where: { rentalOrderId: activeRental.id },
    });

    if (existingExtensions.length === 0) {
      await prisma.rentalExtension.create({
        data: {
          rentalOrderId: activeRental.id,
          requestedBy: buyer.id,
          additionalDays: 3,
          newEndDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          additionalCost: 1500,
          status: 'REQUESTED',
        },
      });

      console.log('Created rental extensions');
    } else {
      console.log('Rental extensions already exist, skipping');
    }
  }

  // ── Rental Condition Logs ───────────────────────────────────────────
  if (activeRental && seller) {
    const existingConditionLogs = await prisma.rentalConditionLog.findMany({
      where: { bookingId: activeRental.id },
    });

    if (existingConditionLogs.length === 0) {
      await prisma.rentalConditionLog.create({
        data: {
          bookingId: activeRental.id,
          type: 'PRE_HANDOVER',
          photoUrls: ['https://example.com/pre-handover1.jpg', 'https://example.com/pre-handover2.jpg'],
          notes: 'Item in excellent condition, no visible damage',
          loggedByUserId: seller.id,
        },
      });

      console.log('Created rental condition logs');
    } else {
      console.log('Rental condition logs already exist, skipping');
    }
  }

  // ── Rental Blackout Dates ───────────────────────────────────────────
  if (rentalListing && seller) {
    const existingBlackoutDates = await prisma.rentalBlackoutDate.findMany({
      where: { listingId: rentalListing.id },
    });

    if (existingBlackoutDates.length === 0) {
      await prisma.rentalBlackoutDate.create({
        data: {
          listingId: rentalListing.id,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
          reason: 'Personal event - item not available',
          createdByUserId: seller.id,
        },
      });

      console.log('Created rental blackout dates');
    } else {
      console.log('Rental blackout dates already exist, skipping');
    }
  }

  // ── Homepage Content ───────────────────────────────────────────────
  if (adminUser && listingForOrder) {
    const existingHomepageContent = await prisma.homepageContent.findMany({
      where: { createdById: adminUser.id },
    });

    if (existingHomepageContent.length === 0) {
      await prisma.homepageContent.create({
        data: {
          type: 'featured_product',
          title: 'Traditional Ethiopian Wear',
          subtitle: 'Discover our finest collection',
          description: 'Handcrafted traditional clothing for special occasions',
          imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1200&q=80',
          linkUrl: '/categories/traditional-wear',
          linkLabel: 'Explore Collection',
          buttonText: 'Shop Now',
          backgroundColor: '#f8f9fa',
          textColor: '#1a1a1a',
          status: 'published',
          sortOrder: 1,
          featuredCategoryId: catBySlug.get('traditional-wear'),
          createdById: adminUser.id,
          publishAt: new Date(),
        },
      });

      await prisma.homepageContent.create({
        data: {
          type: 'featured_rental',
          title: 'Holiday Special',
          subtitle: '30% Off Custom Orders',
          description: 'Get custom-made traditional wear at discounted prices',
          imageUrl: 'https://images.unsplash.com/photo-1583391733956-6c78276477e1?w=1200&q=80',
          linkUrl: '/listings?custom=true',
          linkLabel: 'Shop Custom',
          buttonText: 'Order Now',
          backgroundColor: '#fff8e1',
          textColor: '#1a1a1a',
          status: 'published',
          sortOrder: 2,
          createdById: adminUser.id,
          publishAt: new Date(),
        },
      });

      console.log('Created homepage content');
    } else {
      console.log('Homepage content already exists, skipping');
    }
  }

  // ── Hero Banners ───────────────────────────────────────────────────
  if (adminUser) {
    const existingHeroBanners = await prisma.heroBanner.findMany({
      where: { createdById: adminUser.id },
    });

    if (existingHeroBanners.length === 0) {
      await prisma.heroBanner.create({
        data: {
          title: 'Ethiopian Fashion Marketplace',
          titleAm: 'የኢትዮጵያ ልብስ ገበያ',
          subtitle: 'Discover authentic traditional and modern fashion',
          subtitleAm: 'እውነተኛ ባህላዊ እና ዘመናዊ ልብሶችን ያግኙ',
          imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1600&q=80',
          cloudinaryPublicId: 'hero-banner/main',
          linkUrl: '/listings',
          holidayTheme: 'ENKUTATASH',
          themeStartDate: new Date('2024-09-11'),
          themeEndDate: new Date('2024-09-13'),
          searchWeight: 1.5,
          status: 'published',
          sortOrder: 1,
          publishAt: new Date(),
          createdById: adminUser.id,
        },
      });

      await prisma.heroBanner.create({
        data: {
          title: 'Meskel Festival Collection',
          titleAm: 'መስቀል በዓለ ስብስብ',
          subtitle: 'Special outfits for the celebration',
          subtitleAm: 'ለበዓሉ የተለየ ልብስ',
          imageUrl: 'https://images.unsplash.com/photo-1583391733956-6c78276477e1?w=1600&q=80',
          cloudinaryPublicId: 'hero-banner/meskel',
          linkUrl: '/categories/traditional-wear',
          holidayTheme: 'MESKEL',
          themeStartDate: new Date('2024-09-26'),
          themeEndDate: new Date('2024-09-28'),
          searchWeight: 2.0,
          status: 'published',
          sortOrder: 2,
          publishAt: new Date(),
          createdById: adminUser.id,
        },
      });

      console.log('Created hero banners');
    } else {
      console.log('Hero banners already exist, skipping');
    }
  }

  // ── Region Hubs ────────────────────────────────────────────────────
  const existingRegionHubs = await prisma.regionHub.findMany();
  if (existingRegionHubs.length === 0) {
    await prisma.regionHub.create({
      data: {
        name: 'Bole Hub',
        nameAm: 'ቦሌ ማዕከል',
        description: 'Central pickup location in Bole area',
        descriptionAm: 'በቦሌ አካባቢ ዋና የመምጣት ቦታ',
        type: 'pickup',
        city: 'Addis Ababa',
        cityAm: 'አዲስ አበባ',
        coordinates: '9.0108,38.7617',
        sortOrder: 1,
        isActive: true,
        isPopular: true,
      },
    });

    await prisma.regionHub.create({
      data: {
        name: 'Kazanchis Hub',
        nameAm: 'ካዛንቺስ ማዕከል',
        description: 'Convenient pickup in Kazanchis',
        descriptionAm: 'በካዛንቺስ ምቹ የመምጣት ቦታ',
        type: 'pickup',
        city: 'Addis Ababa',
        cityAm: 'አዲስ አበባ',
        coordinates: '9.0150,38.7580',
        sortOrder: 2,
        isActive: true,
        isPopular: false,
      },
    });

    await prisma.regionHub.create({
      data: {
        name: 'Bahir Dar Hub',
        nameAm: 'ባሕር ዳር ማዕከል',
        description: 'Lake city pickup location',
        descriptionAm: 'የሀይቅ ከተማ የመምጣት ቦታ',
        type: 'pickup',
        city: 'Bahir Dar',
        cityAm: 'ባሕር ዳር',
        coordinates: '11.5975,37.3910',
        sortOrder: 3,
        isActive: true,
        isPopular: true,
      },
    });

    console.log('Created region hubs');
  } else {
    console.log('Region hubs already exist, skipping');
  }

  // ── Moderation Items ───────────────────────────────────────────────
  if (listingForOrder && moderatorUser) {
    const existingModerationItems = await prisma.moderationItem.findMany({
      where: { itemId: listingForOrder.id },
    });

    if (existingModerationItems.length === 0) {
      const listingImage = await prisma.listingImage.findFirst({
        where: { listingId: listingForOrder.id },
      });

      await prisma.moderationItem.create({
        data: {
          itemType: 'product_image',
          itemId: listingForOrder.id,
          content: listingForOrder.description,
          imageUrl: listingImage?.url ?? null,
          cloudinaryPublicId: listingImage?.cloudinaryPublicId ?? null,
          status: 'approved',
          moderatedById: moderatorUser.id,
          moderatedAt: new Date(),
        },
      });

      console.log('Created moderation items');
    } else {
      console.log('Moderation items already exist, skipping');
    }
  }

  // ── Admin Logs ────────────────────────────────────────────────────
  if (adminUser) {
    const existingAdminLogs = await prisma.adminLog.findMany({
      where: { actorId: adminUser.id },
    });

    if (existingAdminLogs.length === 0) {
      await prisma.adminLog.create({
        data: {
          actorId: adminUser.id,
          action: 'approve_listing',
          resource: 'listing',
          resourceId: listingForOrder?.id,
          metadata: { previousStatus: 'pending_review', newStatus: 'active' },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0',
        },
      });

      await prisma.adminLog.create({
        data: {
          actorId: adminUser.id,
          action: 'suspend_user',
          resource: 'user',
          resourceId: sellerByEmail.get('seller4@habesha.com')?.id,
          metadata: { reason: 'Violation of community guidelines' },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0',
        },
      });

      await prisma.adminLog.create({
        data: {
          actorId: adminUser.id,
          action: 'resolve_dispute',
          resource: 'dispute',
          metadata: { ticketNumber: 'DSP-001', resolution: 'refund_issued' },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0',
        },
      });

      console.log('Created admin logs');
    } else {
      console.log('Admin logs already exist, skipping');
    }
  }

  // ── Sync Meilisearch ──────────────────────────────────────────────
  const MEILI_HOST = process.env.MEILISEARCH_HOST ?? 'http://localhost:7700';
  const MEILI_KEY = process.env.MEILISEARCH_API_KEY ?? 'masterKey';
  try {
    const activeListings = await prisma.listing.findMany({
      where: { 
        status: 'active', 
        deletedAt: null,
        // Only index approved/active listings - not pending_review, rejected, etc.
      },
      include: {
        category: true,
        images: { where: { isPrimary: true, deletedAt: null }, take: 1 },
        seller: { select: { id: true, displayName: true } },
      },
    });

    const docs = activeListings.map((l) => {
      const parentCatSlug = CATEGORIES.find((c) =>
        SUBCATEGORIES.some((sc) => sc.parentSlug === c.slug && sc.slug === l.category?.slug)
      );
      return {
        id: l.id,
        title: l.title,
        description: l.description.slice(0, 300),
        price: Number(l.price),
        currency: l.currency,
        condition: l.condition,
        city: l.city,
        country: l.country,
        listingType: l.availableForRent ? 'rent' : l.customOrderAvailable ? 'custom' : 'buy',
        status: l.status,
        isFeatured: l.isFeatured,
        sellerId: l.sellerId,
        sellerName: l.seller.displayName,
        categoryId: l.categoryId,
        categoryName: l.category.name,
        categorySlug: l.category.slug,
        parentCategorySlug: parentCatSlug?.slug ?? null,
        primaryImageUrl: l.images[0]?.url ?? null,
        publishedAt: l.publishedAt?.getTime() ?? Date.now(),
        createdAt: l.createdAt.getTime(),
      };
    });

    const res = await fetch(`${MEILI_HOST}/indexes/listings/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${MEILI_KEY}` },
      body: JSON.stringify(docs),
    });

    if (res.ok) {
      console.log(`Indexed ${docs.length} approved listings in Meilisearch.`);
    } else {
      console.warn(`Meilisearch indexing returned ${res.status}: ${await res.text()}`);
    }
  } catch (e) {
    console.warn(`Meilisearch indexing skipped: ${(e as Error).message}`);
  }
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
