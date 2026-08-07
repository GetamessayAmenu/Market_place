import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const listings = await prisma.listing.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      availableForPurchase: true,
    },
    take: 10,
  });
  
  console.log('Listings in database:');
  console.log(JSON.stringify(listings, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
