import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("pnpadmin123", 10);
  
  const adminOffsetUser = await prisma.user.upsert({
    where: { email: "admin@pnp.com" },
    update: { password: hashedPassword },
    create: {
      name: "Super Admin",
      email: "admin@pnp.com",
      password: hashedPassword,
      role: "ADMIN"
    }
  });

  console.log("Admin user created!", adminOffsetUser);

  // Seed global system settings for session management
  const globalSettings = await prisma.systemSetting.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      sessionMaxAge: 30 * 24 * 60 * 60, // 30 days
    }
  });

  console.log("Global system settings seeded!", globalSettings);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
