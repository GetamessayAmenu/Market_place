import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check orders for each seller
  const sellers = await prisma.user.findMany({
    where: { role: { slug: 'seller' } },
    select: {
      id: true,
      email: true,
      displayName: true,
    },
  });
  
  for (const seller of sellers) {
    const orders = await prisma.order.findMany({
      where: { sellerId: seller.id },
      select: {
        id: true,
        orderNumber: true,
        type: true,
        status: true,
        buyerId: true,
        totalAmount: true,
        createdAt: true,
      },
    });
    
    console.log(`\n=== Orders for ${seller.email} (${seller.displayName}) ===`);
    console.log(`Seller ID: ${seller.id}`);
    console.log(`Order count: ${orders.length}`);
    if (orders.length > 0) {
      console.log(JSON.stringify(orders, null, 2));
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
