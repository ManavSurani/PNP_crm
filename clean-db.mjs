import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database...");

  // Order matters due to foreign key constraints
  // We use lowercase names as they appear in the prisma client
  const models = [
    'leadFinancialLog',
    'executionLog',
    'milestone',
    'project',
    'projectPayment',
    'projectQuotation',
    'projectVendorContact',
    'projectVendor',
    'projectField',
    'leadNote',
    'leadTransaction',
    'notification',
    'auditLog',
    'supplierPayment',
    'supplier',
    'workerAssignment',
    'worker',
    'orderUpdate',
    'order',
    'quotationMilestone',
    'quotationItem',
    'quotation',
    'meeting',
    'followUp',
    'requirement',
    'lead',
    'passwordResetToken',
    'session',
    'account',
    'user',
    'systemSetting'
  ];

  for (const model of models) {
    try {
      if (prisma[model]) {
        await prisma[model].deleteMany();
        console.log(`Cleared ${model}`);
      }
    } catch (e) {
      console.error(`Error clearing ${model}:`, e.message);
    }
  }

  console.log("Database cleaned. Re-seeding admin user...");

  const hashedPassword = await bcrypt.hash("pnpadmin123", 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@pnp.com" },
    update: { password: hashedPassword },
    create: {
      id: "df181284-f05a-43ad-bd96-eb14ea8cdbe7",
      name: "Super Admin",
      email: "admin@pnp.com",
      password: hashedPassword,
      role: "ADMIN"
    }
  });

  console.log("Admin user created!", adminUser.email);

  const globalSettings = await prisma.systemSetting.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      sessionMaxAge: 30 * 24 * 60 * 60,
    }
  });

  console.log("Global system settings seeded!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
