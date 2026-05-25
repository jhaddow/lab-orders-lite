import type { User } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { appendAuditLog } from "@/features/audit/repo";
import { requireRole } from "@/lib/auth";
import {
  assertTransition,
  calculateEstimatedReadyDate,
  calculateOrderTotalCents,
  type OrderStatus,
} from "./domain";

export type CreateOrderInput = {
  patientId: string;
  labTestIds: string[];
};

export type CreateOrderOptions = {
  /** Injectable clock — defaults to `new Date()`. Tests pass a fixed value
   *  for deterministic estimatedReadyDate assertions. */
  now?: Date;
};

export class OrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderValidationError";
    Error.captureStackTrace?.(this, OrderValidationError);
  }
}

const orderInclude = {
  patient: true,
  createdBy: true,
  items: { include: { labTest: true, price: true } },
} as const;

export function getOrders() {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: orderInclude,
  });
}

export function getOrder(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: orderInclude,
  });
}

export async function createOrder(
  input: CreateOrderInput,
  actor: User,
  options: CreateOrderOptions = {},
) {
  if (input.labTestIds.length === 0) {
    throw new OrderValidationError("An order must include at least one lab test");
  }

  const patient = await prisma.patient.findUnique({
    where: { id: input.patientId },
  });
  if (!patient) {
    throw new OrderValidationError(`Patient ${input.patientId} not found`);
  }

  // Fetch each requested lab test with its latest price attached.
  const labTests = await prisma.labTest.findMany({
    where: { id: { in: input.labTestIds } },
    include: {
      prices: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (labTests.length !== input.labTestIds.length) {
    throw new OrderValidationError("One or more lab tests not found");
  }

  // Resolve the current price for each. Missing prices are an invariant
  // violation — every lab test should always have at least one price.
  const resolved = labTests.map((t) => {
    const latest = t.prices[0];
    if (!latest) {
      throw new OrderValidationError(`Lab test ${t.code} has no current price`);
    }
    return { labTest: t, price: latest };
  });

  // Destructure so `head` is typed non-undefined under noUncheckedIndexedAccess;
  // the labTestIds length check above already guarantees a head exists.
  const [head, ...rest] = resolved;
  if (!head) {
    throw new OrderValidationError("Order must include at least one lab test");
  }
  if (rest.some((r) => r.price.currency !== head.price.currency)) {
    throw new OrderValidationError("All lab tests in an order must share the same currency");
  }
  const currency = head.price.currency;

  const items = resolved.map((r) => ({
    labTestId: r.labTest.id,
    priceId: r.price.id,
    turnaroundDaysAtOrder: r.labTest.turnaroundDays,
  }));

  // Domain helpers take a flat shape; build it inline.
  const totalsInput = resolved.map((r) => ({
    priceCentsAtOrder: r.price.priceCents,
    turnaroundDaysAtOrder: r.labTest.turnaroundDays,
  }));

  const createdAt = options.now ?? new Date();
  const totalCents = calculateOrderTotalCents(totalsInput);
  const estimatedReadyDate = calculateEstimatedReadyDate(createdAt, totalsInput);

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        patientId: input.patientId,
        createdByUserId: actor.id,
        currency,
        totalCents,
        estimatedReadyDate,
        createdAt,
        items: { create: items },
      },
      include: orderInclude,
    });
    await appendAuditLog(tx, {
      actorId: actor.id,
      action: "ORDER_CREATED",
      entityType: "Order",
      entityId: order.id,
      metadata: { patientId: patient.id, totalCents, currency, itemCount: items.length },
    });
    return order;
  });
}

// ---- Status transitions ----------------------------------------------
//
// Each transition: load the current order, assert the transition is allowed,
// update the row, and audit — all in one transaction so a failed audit
// rolls back the status change.

async function transitionOrder(
  orderId: string,
  to: OrderStatus,
  actor: User,
  extra: {
    timestampField?: "startedAt" | "completedAt" | "cancelledAt";
    cancellationReason?: string;
  } = {},
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new OrderValidationError(`Order ${orderId} not found`);

    assertTransition(order.status as OrderStatus, to);

    const now = new Date();
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        status: to,
        ...(extra.timestampField ? { [extra.timestampField]: now } : {}),
        ...(extra.cancellationReason ? { cancellationReason: extra.cancellationReason } : {}),
      },
      include: orderInclude,
    });

    await appendAuditLog(tx, {
      actorId: actor.id,
      action: "ORDER_STATUS_CHANGED",
      entityType: "Order",
      entityId: orderId,
      metadata: {
        from: order.status,
        to,
        ...(extra.cancellationReason ? { reason: extra.cancellationReason } : {}),
      },
    });

    return updated;
  });
}

export async function startOrder(orderId: string, actor: User) {
  return transitionOrder(orderId, "IN_PROGRESS", actor, { timestampField: "startedAt" });
}

export async function completeOrder(orderId: string, actor: User) {
  requireRole(actor, "ADMIN");
  return transitionOrder(orderId, "COMPLETED", actor, { timestampField: "completedAt" });
}

export async function cancelOrder(orderId: string, actor: User, reason: string) {
  if (!reason.trim()) {
    throw new OrderValidationError("Cancellation reason is required");
  }
  return transitionOrder(orderId, "CANCELLED", actor, {
    timestampField: "cancelledAt",
    cancellationReason: reason.trim(),
  });
}
