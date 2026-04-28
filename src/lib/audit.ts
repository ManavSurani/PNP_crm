import prisma from "./prisma";

export async function createAuditLog({
  userId,
  action,
  entity,
  entityId,
  oldValue,
  newValue
}: {
  userId?: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  entity: "LEAD" | "QUOTATION" | "ORDER" | "PAYMENT" | "EXPENSE";
  entityId: string;
  oldValue?: any;
  newValue?: any;
}) {
  try {
    // Definitive Fix: Use any-casting to bypass stale Prisma Client types for newly added models
    return await (prisma as any).auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null
      }
    });
  } catch (error) {
    console.error("[AUDIT_LOG_ERROR]", error);
  }
}
