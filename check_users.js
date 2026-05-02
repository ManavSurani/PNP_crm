const { PrismaClient } = require('@prisma/client');
const path = require('path');
const dbPath = path.join(process.cwd(), '_data', 'crm.db');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbPath}`
    }
  }
});

async function main() {
  const result = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`;
  console.log('Tables:', result);
  
  const leadCount = await prisma.lead.count();
  console.log('Lead count:', leadCount);
  
  const userCount = await prisma.user.count();
  console.log('User count:', userCount);

  const supplierCount = await prisma.supplier.count();
  console.log('Supplier count:', supplierCount);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
