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
