import { prisma } from "@/lib/prisma";
import {
  calculateEstimatedReadyDate,
  calculateOrderTotalCents,
} from "./domain";

export type CreateOrderInput = {
  patientId: string;
  labTestIds: string[];
};

export class OrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderValidationError";
  }
}

export function getOrders() {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      patient: true,
      items: { include: { labTest: true } },
    },
  });
}

export function getOrder(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      patient: true,
      items: { include: { labTest: true } },
    },
  });
}

export async function createOrder(input: CreateOrderInput) {
  if (input.labTestIds.length === 0) {
    throw new OrderValidationError("An order must include at least one lab test");
  }

  const patient = await prisma.patient.findUnique({
    where: { id: input.patientId },
  });
  if (!patient) {
    throw new OrderValidationError(`Patient ${input.patientId} not found`);
  }

  const labTests = await prisma.labTest.findMany({
    where: { id: { in: input.labTestIds } },
  });
  if (labTests.length !== input.labTestIds.length) {
    throw new OrderValidationError("One or more lab tests not found");
  }

  const currencies = new Set(labTests.map((t) => t.currency));
  if (currencies.size > 1) {
    throw new OrderValidationError(
      "All lab tests in an order must share the same currency",
    );
  }
  const currency = labTests[0].currency;

  const items = labTests.map((t) => ({
    labTestId: t.id,
    priceCentsAtOrder: t.priceCents,
    turnaroundDaysAtOrder: t.turnaroundDays,
  }));

  const createdAt = new Date();
  const totalCents = calculateOrderTotalCents(items);
  const estimatedReadyDate = calculateEstimatedReadyDate(createdAt, items);

  return prisma.order.create({
    data: {
      patientId: input.patientId,
      currency,
      totalCents,
      estimatedReadyDate,
      createdAt,
      items: { create: items },
    },
    include: {
      patient: true,
      items: { include: { labTest: true } },
    },
  });
}
