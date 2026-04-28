import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Starting data migration...');

  // Map old service types to new ones
  const mapping: any = {
    'SOFA_WORK': 'CUSTOM_FURNITURE_DESIGN',
    'WARDROBE': 'WARDROBE_PLANNING',
    'OFFICE_FURNITURE': 'OFFICE_INTERIOR',
    'REPAIR_SERVICE': 'LABOUR_ONLY',
    'CUSTOM_FURNITURE': 'CUSTOM_FURNITURE_DESIGN'
  };

  for (const [oldValue, newValue] of Object.entries(mapping)) {
    const result = await (prisma.lead as any).updateMany({
      where: { serviceType: oldValue },
      data: { serviceType: newValue }
    });
    console.log(`Migrated ${result.count} leads from ${oldValue} to ${newValue}`);
  }

  console.log('Migration complete.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
