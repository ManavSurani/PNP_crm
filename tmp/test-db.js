const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Testing database connection...");
    const leadCount = await prisma.lead.count();
    console.log("Lead count:", leadCount);

    console.log("Testing findMany with include...");
    const leads = await prisma.lead.findMany({
      take: 5,
      include: {
        assignedStaff: {
          select: { id: true, name: true }
        }
      }
    });
    console.log("Found leads:", leads.length);
    console.log("Database query successful.");
  } catch (error) {
    console.error("Database query failed:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
