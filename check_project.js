const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const project = await prisma.project.findFirst({
    where: { name: { contains: "Samrat" } },
    include: { customer: true, milestones: true }
  });
  console.log(JSON.stringify(project, null, 2));
}
main().finally(() => prisma.$disconnect());
