import { prisma } from "@/lib/prisma";
import {
  calculateEstimatedReadyDate,
  calculateOrderTotalCents,
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
      throw new OrderValidationError(
        `Lab test ${t.code} has no current price`,
      );
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
    throw new OrderValidationError(
      "All lab tests in an order must share the same currency",
    );
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

  return prisma.order.create({
    data: {
      patientId: input.patientId,
      currency,
      totalCents,
      estimatedReadyDate,
      createdAt,
      items: { create: items },
    },
    include: orderInclude,
  });
}
