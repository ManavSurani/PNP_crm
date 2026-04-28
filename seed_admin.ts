import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("pnpadmin123", 10);
  
  const user = await prisma.user.upsert({
    where: { email: "admin@pnp.com" },
    update: {},
    create: {
      id: "df181284-f05a-43ad-bd96-eb14ea8cdbe7",
      email: "admin@pnp.com",
      name: "Super Admin",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  
  console.log("Admin user created/verified:", user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
