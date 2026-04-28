import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Order Status Migration ---');

  const orders = await prisma.order.findMany();
  console.log(`Found ${orders.length} orders.`);

  for (const order of orders) {
    let newStatus: any = order.status;

    if (order.status === 'CONFIRMED') newStatus = 'DESIGN';
    if (order.status === 'MATERIAL_PROCUREMENT') newStatus = 'PROCURING';
    if (order.status === 'PRODUCTION') newStatus = 'CARPENTRY';
    if (order.status === 'QUALITY_CHECK') newStatus = 'PAINTING';
    if (order.status === 'HANDOVER') newStatus = 'INSTALLATION';

    if (newStatus !== order.status) {
      console.log(`Updating Order ${order.orderNo}: ${order.status} -> ${newStatus}`);
      await prisma.order.update({
        where: { id: order.id },
        data: { status: newStatus }
      });
    }
  }

  console.log('Migration complete.');
}

main();
