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

  // ── Test users ──────────────────────────────────────────────────
  const TEST_USERS = [
    { email: 'buyer@habesha.com',     displayName: 'Abeba Buyer',     role: 'buyer',       phone: '0911111111' },
    { email: 'seller@habesha.com',    displayName: 'Kidane Seller',   role: 'seller',      phone: '0922222222' },
    { email: 'seller2@habesha.com',   displayName: 'Tigist Fashion',  role: 'seller',      phone: '0933333333' },
    { email: 'admin@habesha.com',     displayName: 'Admin User',      role: 'admin',       phone: '0944444444' },
    { email: 'moderator@habesha.com', displayName: 'Mod User',        role: 'moderator',   phone: '0955555555' },
    { email: 'super@habesha.com',     displayName: 'Super Admin',     role: 'super_admin', phone: '0966666666' },
    { email: 'buyer2@habesha.com',    displayName: 'Hana Buyer',      role: 'buyer',       phone: undefined   },
    { email: 'seller3@habesha.com',   displayName: 'Yohannes Designs',role: 'seller',      phone: undefined   },
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

  let usersCreated = 0;
  for (const u of TEST_USERS) {
    const roleId = roleByName.get(u.role);
    if (!roleId) {
      console.warn(`Skipping ${u.email}: role "${u.role}" not found`);
      continue;
    }

    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        displayName: u.displayName,
        passwordHash,
        roleId,
        ...(u.phone ? { phone: u.phone } : {}),
        status: 'active',
        emailVerifiedAt: new Date(),
      },
    });
    usersCreated++;
  }

  console.log(`Seeded ${usersCreated} test users (password: "${PASSWORD}" for all).`);

  // ── Categories ────────────────────────────────────────────────────
  const CATEGORIES = [
    { name: 'Traditional Wear', slug: 'traditional-wear', sortOrder: 1 },
    { name: 'Modern Fashion', slug: 'modern-fashion', sortOrder: 2 },
    { name: "Men's Fashion", slug: 'mens-fashion', sortOrder: 3 },
  ];

  const SUBCATEGORIES = [
    { name: 'Habesha Kemis', slug: 'habesha-kemis', parentSlug: 'traditional-wear', sortOrder: 1 },
    { name: 'Gabi & Netela', slug: 'gabi-netela', parentSlug: 'traditional-wear', sortOrder: 2 },
    { name: 'Zuria', slug: 'zuria', parentSlug: 'traditional-wear', sortOrder: 3 },
    { name: 'Dresses', slug: 'dresses', parentSlug: 'modern-fashion', sortOrder: 1 },
    { name: 'Tops & Blouses', slug: 'tops-blouses', parentSlug: 'modern-fashion', sortOrder: 2 },
    { name: 'Accessories', slug: 'accessories', parentSlug: 'modern-fashion', sortOrder: 3 },
    { name: 'Suits & Formal', slug: 'suits-formal', parentSlug: 'mens-fashion', sortOrder: 1 },
    { name: 'Casual Wear', slug: 'casual-wear', parentSlug: 'mens-fashion', sortOrder: 2 },
  ];

  // Upsert parent categories
  const catBySlug = new Map<string, string>();
  for (const c of CATEGORIES) {
    const created = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: { name: c.name, slug: c.slug, sortOrder: c.sortOrder },
    });
    catBySlug.set(c.slug, created.id);
  }

  // Upsert subcategories
  for (const sc of SUBCATEGORIES) {
    const parentId = catBySlug.get(sc.parentSlug);
    const created = await prisma.category.upsert({
      where: { slug: sc.slug },
      update: {},
      create: { name: sc.name, slug: sc.slug, parentId, sortOrder: sc.sortOrder },
    });
    catBySlug.set(sc.slug, created.id);
  }

  console.log(`Seeded ${CATEGORIES.length} parent categories and ${SUBCATEGORIES.length} subcategories.`);

  // ── Test Listings ─────────────────────────────────────────────────
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

  const sellerEmails = ['seller@habesha.com', 'seller2@habesha.com', 'seller3@habesha.com'] as const;
  const sellers = await prisma.user.findMany({ where: { email: { in: [...sellerEmails] } } });
  const sellerByEmail = new Map(sellers.map((s) => [s.email, s]));

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
  }> = [
    // Kidane — seller@habesha.com
    {
      sellerEmail: 'seller@habesha.com', categorySlug: 'habesha-kemis',
      title: 'Handwoven Habesha Kemis — Classic White', slug: 'handwoven-habesha-kemis-classic-white',
      description: 'A stunning handwoven Habesha Kemis made from premium Ethiopian cotton. Features intricate tibeb embroidery along the neckline and hem in vibrant gold and green threads. Perfect for holidays, weddings, and cultural celebrations. Each piece takes approximately 3 weeks to weave by skilled artisans.',
      price: 4500, condition: 'new', city: 'Addis Ababa', isFeatured: true,
      availableForPurchase: true, availableForRent: true, customOrderAvailable: true,
      rentalPricePerDay: 500, rentalDeposit: 2000, imageUrl: IMG.k1,
    },
    {
      sellerEmail: 'seller@habesha.com', categorySlug: 'gabi-netela',
      title: 'Handwoven Cotton Gabi — Winter Weight', slug: 'handwoven-cotton-gabi-winter',
      description: 'A warm, heavy cotton Gabi perfect for cool evenings. Handwoven by artisans in Dorze using traditional techniques passed down through generations. This thick Gabi features subtle geometric patterns along the border. Measures approximately 2.5m × 1.8m.',
      price: 2800, condition: 'new', city: 'Addis Ababa', isFeatured: true,
      availableForPurchase: true, availableForRent: false, customOrderAvailable: false,
      imageUrl: IMG.k2,
    },
    {
      sellerEmail: 'seller@habesha.com', categorySlug: 'dresses',
      title: 'Modern Ethiopian Evening Dress — Emerald Silk', slug: 'modern-ethiopian-evening-dress-emerald',
      description: 'A contemporary evening dress inspired by Ethiopian design motifs. Crafted from emerald green silk with delicate gold thread detailing at the bodice. Features a flattering A-line silhouette with a modern high-low hemline. Available in sizes S-XL.',
      price: 3200, condition: 'new', city: 'Addis Ababa', isFeatured: true,
      availableForPurchase: true, availableForRent: true, customOrderAvailable: true,
      rentalPricePerDay: 400, rentalDeposit: 1500, imageUrl: IMG.k3,
    },
    // Tigist — seller2@habesha.com
    {
      sellerEmail: 'seller2@habesha.com', categorySlug: 'accessories',
      title: 'Beaded Tibeb Necklace — Multicolor', slug: 'beaded-tibeb-necklace-multicolor',
      description: 'A gorgeous hand-beaded necklace inspired by traditional Ethiopian tibeb patterns. Features colorful glass beads arranged in a geometric design with brass clasp. Each necklace is unique — slight variations in bead color may occur. Length: adjustable 40-50cm.',
      price: 650, condition: 'new', city: 'Bahir Dar', isFeatured: false,
      availableForPurchase: true, availableForRent: false, customOrderAvailable: true,
      imageUrl: IMG.k4,
    },
    {
      sellerEmail: 'seller2@habesha.com', categorySlug: 'zuria',
      title: 'Premium Silk Zuria Set — Ivory & Gold', slug: 'premium-silk-zuria-set-ivory-gold',
      description: 'An elegant three-piece Zuria set crafted from pure Ethiopian silk. The set includes the main wrap, a matching shawl (netela), and a head piece. Adorned with gold-thread embroidery featuring traditional cross motifs. Ideal for weddings and religious ceremonies.',
      price: 6500, condition: 'new', city: 'Bahir Dar', isFeatured: true,
      availableForPurchase: true, availableForRent: true, customOrderAvailable: false,
      rentalPricePerDay: 800, rentalDeposit: 3000, imageUrl: IMG.k5,
    },
    {
      sellerEmail: 'seller2@habesha.com', categorySlug: 'gabi-netela',
      title: 'Embroidered Netela Shawl — Delicate Lace', slug: 'embroidered-netela-shawl-lace',
      description: 'A lightweight, sheer netela shawl with delicate hand-embroidered borders. Made from fine cotton muslin, this versatile piece can be worn as a shawl, head covering, or decorative accent. The intricate cross-stitch border features traditional Ethiopian motifs in deep blue thread.',
      price: 1200, condition: 'like_new', city: 'Bahir Dar', isFeatured: false,
      availableForPurchase: true, availableForRent: false, customOrderAvailable: true,
      imageUrl: IMG.k6,
    },
    // Yohannes — seller3@habesha.com
    {
      sellerEmail: 'seller3@habesha.com', categorySlug: 'suits-formal',
      title: 'Custom-Tailored Ethiopian Formal Suit', slug: 'custom-tailored-ethiopian-formal-suit',
      description: 'A bespoke three-piece suit hand-tailored to your measurements. Features a modern slim-fit cut with subtle Ethiopian-inspired embroidery on the lapel and cuffs. Fabric is premium Italian wool blend in charcoal grey. Includes jacket, vest, and trousers. Allow 4-6 weeks for custom tailoring.',
      price: 8500, condition: 'new', city: 'Hawassa', isFeatured: true,
      availableForPurchase: true, availableForRent: true, customOrderAvailable: true,
      rentalPricePerDay: 1200, rentalDeposit: 4000, imageUrl: IMG.k7,
    },
    {
      sellerEmail: 'seller3@habesha.com', categorySlug: 'casual-wear',
      title: 'Casual Cotton Shirt — Tibeb Collar Design', slug: 'casual-cotton-shirt-tibeb-collar',
      description: 'A comfortable everyday cotton shirt featuring a unique tibeb-patterned collar inspired by traditional Ethiopian weaving. Made from breathable 100% organic cotton in a relaxed fit. Available in white, sky blue, and olive. Machine washable.',
      price: 950, condition: 'new', city: 'Hawassa', isFeatured: false,
      availableForPurchase: true, availableForRent: false, customOrderAvailable: true,
      imageUrl: IMG.k8,
    },
    {
      sellerEmail: 'seller3@habesha.com', categorySlug: 'habesha-kemis',
      title: 'Designer Habesha Kemis — Royal Purple', slug: 'designer-habesha-kemis-royal-purple',
      description: 'A show-stopping designer Habesha Kemis in rich royal purple fabric. Features hand-stitched silver thread embroidery with modern geometric patterns blending traditional and contemporary aesthetics. The dress falls below the knee with a slight flare. Comes with matching netela.',
      price: 5800, condition: 'new', city: 'Hawassa', isFeatured: true,
      availableForPurchase: true, availableForRent: true, customOrderAvailable: true,
      rentalPricePerDay: 700, rentalDeposit: 2500, imageUrl: IMG.k9,
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
    if (existing) continue; // idempotent

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
        status: 'active',
        city: l.city,
        country: 'ET',
        isFeatured: l.isFeatured,
        availableForPurchase: l.availableForPurchase,
        availableForRent: l.availableForRent,
        customOrderAvailable: l.customOrderAvailable,
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

  // ── Sync Meilisearch ──────────────────────────────────────────────
  const MEILI_HOST = process.env.MEILISEARCH_HOST ?? 'http://localhost:7700';
  const MEILI_KEY = process.env.MEILISEARCH_API_KEY ?? 'masterKey';
  try {
    const activeListings = await prisma.listing.findMany({
      where: { status: 'active', deletedAt: null },
      include: {
        category: true,
        images: { where: { isPrimary: true, deletedAt: null }, take: 1 },
        seller: { select: { id: true, displayName: true } },
      },
    });

    const docs = activeListings.map((l) => {
      const parentCatSlug = CATEGORIES.find((c) =>
        SUBCATEGORIES.some((sc) => sc.parentSlug === c.slug && sc.slug === (l as any).category?.slug)
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
      console.log(`Indexed ${docs.length} listings in Meilisearch.`);
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
