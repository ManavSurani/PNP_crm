import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const serviceTypes = await prisma.lead.groupBy({
    by: ['serviceType'],
    _count: { serviceType: true }
  });
  console.log('Current Lead Service Types:', JSON.stringify(serviceTypes, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
