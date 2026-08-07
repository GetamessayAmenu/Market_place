import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    select: {
      id: true,
      orderNumber: true,
      type: true,
      status: true,
      buyerId: true,
      sellerId: true,
      totalAmount: true,
      createdAt: true,
    },
    take: 10,
  });
  
  console.log('Orders in database:');
  console.log(JSON.stringify(orders, null, 2));
  
  const sellers = await prisma.user.findMany({
    where: { role: { slug: 'seller' } },
    select: {
      id: true,
      email: true,
      displayName: true,
    },
  });
  
  console.log('\nSellers in database:');
  console.log(JSON.stringify(sellers, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
