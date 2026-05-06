const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const projects = await prisma.project.findMany({
    include: { customer: { select: { id: true, customerName: true } }, milestones: true }
  });
  console.log(JSON.stringify(projects, null, 2));
}
main().finally(() => prisma.$disconnect());
