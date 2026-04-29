const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.systemSetting.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      sessionMaxAge: 2592000, // 30 days
      whatsappDispatchNumber: "8799544606" // Default recovery number from your screenshot
    }
  });
  console.log("System settings initialized with default recovery number.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
