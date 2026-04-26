import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("pnpadmin123", 10);
  
  const adminOffsetUser = await prisma.user.upsert({
    where: { email: "admin@pnp.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@pnp.com",
      password: hashedPassword,
      role: "ADMIN"
    }
  });

  console.log("Admin user created!", adminOffsetUser);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
