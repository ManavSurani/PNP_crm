import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Business Data Cleanup...");

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
    'account'
  ];

  for (const model of models) {
    try {
      if (prisma[model]) {
        const count = await prisma[model].deleteMany();
        console.log(`Cleared ${model}: ${count.count} records removed.`);
      }
    } catch (e) {
      console.error(`Error clearing ${model}:`, e.message);
    }
  }

  console.log("\nCleanup Complete!");
  console.log("User accounts and System Settings have been preserved.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
