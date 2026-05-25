import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "PATIENT_CREATED"
  | "ORDER_CREATED"
  | "ORDER_STATUS_CHANGED"
  | "LAB_TEST_CREATED"
  | "LAB_TEST_PRICE_CHANGED";

export type AppendAuditInput = {
  actorId: string;
  action: AuditAction;
  entityType: "Patient" | "Order" | "LabTest";
  entityId: string;
  metadata?: Prisma.InputJsonValue;
};

/**
 * Append an audit log entry. Callers MUST run this inside the same
 * transaction as the action being audited (`tx.auditLog.create(...)` via
 * `appendAuditLog(tx, ...)`) so that an audit row only exists when the
 * underlying change committed.
 */
export function appendAuditLog(
  tx: Prisma.TransactionClient | typeof prisma,
  input: AppendAuditInput,
) {
  return tx.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata,
    },
  });
}

export function listAuditEntriesForEntity(entityType: string, entityId: string) {
  return prisma.auditLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: "asc" },
    include: { actor: true },
  });
}
