export type OrderItemInput = {
  priceCentsAtOrder: number;
  turnaroundDaysAtOrder: number;
};

export function calculateOrderTotalCents(
  items: Pick<OrderItemInput, "priceCentsAtOrder">[],
): number {
  if (items.length === 0) {
    throw new Error("Cannot calculate total for an order with no items");
  }
  return items.reduce((sum, item) => sum + item.priceCentsAtOrder, 0);
}

export function calculateEstimatedReadyDate(
  createdAt: Date,
  items: Pick<OrderItemInput, "turnaroundDaysAtOrder">[],
): Date {
  if (items.length === 0) {
    throw new Error("Cannot calculate ready date for an order with no items");
  }
  const maxTurnaround = items.reduce((max, item) => Math.max(max, item.turnaroundDaysAtOrder), 0);
  const result = new Date(createdAt);
  result.setUTCDate(result.getUTCDate() + maxTurnaround);
  return result;
}

// ---- Status workflow --------------------------------------------------

export type OrderStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export class InvalidTransitionError extends Error {
  constructor(from: OrderStatus, to: OrderStatus) {
    super(`Cannot transition order from ${from} to ${to}`);
    this.name = "InvalidTransitionError";
    Error.captureStackTrace?.(this, InvalidTransitionError);
  }
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
}
