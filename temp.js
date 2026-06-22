const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    await prisma.followUp.delete({ where: { id: '8b57f5ee-a306-4b08-acd9-fb663b2b150d' }});
    console.log("Deleted!");
}
main().finally(() => prisma.$disconnect());
