import { describe, expect, it } from "vitest";
import {
  assertTransition,
  calculateEstimatedReadyDate,
  calculateOrderTotalCents,
  canTransition,
  InvalidTransitionError,
  type OrderStatus,
} from "./domain";

describe("calculateOrderTotalCents", () => {
  it("sums a single item", () => {
    expect(calculateOrderTotalCents([{ priceCentsAtOrder: 4500 }])).toBe(4500);
  });

  it("sums multiple items", () => {
    expect(
      calculateOrderTotalCents([
        { priceCentsAtOrder: 4500 },
        { priceCentsAtOrder: 5200 },
        { priceCentsAtOrder: 3200 },
      ]),
    ).toBe(12900);
  });

  it("stays exact across large integer sums", () => {
    const items = Array.from({ length: 100 }, () => ({
      priceCentsAtOrder: 999_999,
    }));
    expect(calculateOrderTotalCents(items)).toBe(99_999_900);
  });

  it("throws on empty input", () => {
    expect(() => calculateOrderTotalCents([])).toThrow(/no items/);
  });
});

describe("calculateEstimatedReadyDate", () => {
  const base = new Date("2026-05-24T12:00:00.000Z");

  it("adds the max turnaround across items", () => {
    const ready = calculateEstimatedReadyDate(base, [
      { turnaroundDaysAtOrder: 1 },
      { turnaroundDaysAtOrder: 3 },
      { turnaroundDaysAtOrder: 2 },
    ]);
    expect(ready.toISOString()).toBe("2026-05-27T12:00:00.000Z");
  });

  it("handles a single item", () => {
    const ready = calculateEstimatedReadyDate(base, [{ turnaroundDaysAtOrder: 5 }]);
    expect(ready.toISOString()).toBe("2026-05-29T12:00:00.000Z");
  });

  it("does not mutate the input date", () => {
    const original = new Date(base);
    calculateEstimatedReadyDate(base, [{ turnaroundDaysAtOrder: 7 }]);
    expect(base.toISOString()).toBe(original.toISOString());
  });

  it("throws on empty input", () => {
    expect(() => calculateEstimatedReadyDate(base, [])).toThrow(/no items/);
  });
});

describe("canTransition", () => {
  // Full truth table — making the matrix explicit catches accidental changes
  // to the workflow rules during refactors.
  const cases: Array<[OrderStatus, OrderStatus, boolean]> = [
    ["PENDING", "IN_PROGRESS", true],
    ["PENDING", "CANCELLED", true],
    ["PENDING", "COMPLETED", false],
    ["PENDING", "PENDING", false],
    ["IN_PROGRESS", "COMPLETED", true],
    ["IN_PROGRESS", "CANCELLED", true],
    ["IN_PROGRESS", "PENDING", false],
    ["IN_PROGRESS", "IN_PROGRESS", false],
    ["COMPLETED", "PENDING", false],
    ["COMPLETED", "IN_PROGRESS", false],
    ["COMPLETED", "CANCELLED", false],
    ["COMPLETED", "COMPLETED", false],
    ["CANCELLED", "PENDING", false],
    ["CANCELLED", "IN_PROGRESS", false],
    ["CANCELLED", "COMPLETED", false],
    ["CANCELLED", "CANCELLED", false],
  ];

  for (const [from, to, allowed] of cases) {
    it(`${from} → ${to} is ${allowed ? "allowed" : "rejected"}`, () => {
      expect(canTransition(from, to)).toBe(allowed);
    });
  }
});

describe("assertTransition", () => {
  it("returns silently for an allowed transition", () => {
    expect(() => assertTransition("PENDING", "IN_PROGRESS")).not.toThrow();
  });

  it("throws InvalidTransitionError for a disallowed transition", () => {
    expect(() => assertTransition("PENDING", "COMPLETED")).toThrow(InvalidTransitionError);
  });
});
