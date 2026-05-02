import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Attempting to fetch suppliers...");
    const suppliers = await prisma.supplier.findMany();
    console.log("Success! Found:", suppliers.length);
    console.log(suppliers);
  } catch (err) {
    console.error("CRITICAL ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
