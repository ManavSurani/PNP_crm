const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const project = await prisma.project.findFirst({
    include: { milestones: true }
  });
  if (!project) { console.log("No project found"); return; }
  const spread = { ...project, stats: { foo: 'bar' } };
  console.log("Keys of spread:", Object.keys(spread));
  console.log("Has milestones?", !!spread.milestones);
  console.log("Milestones count:", spread.milestones?.length);
}
main().finally(() => prisma.$disconnect());
