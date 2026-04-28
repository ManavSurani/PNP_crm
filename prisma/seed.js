const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("pnpadmin123", 10);
  
  const admin = await prisma.user.upsert({
    where: { email: "admin@pnp.com" },
    update: {},
    create: {
      email: "admin@pnp.com",
      name: "Super Admin",
      password: hashedPassword,
      role: "ADMIN"
    }
  });

  console.log({ admin });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
