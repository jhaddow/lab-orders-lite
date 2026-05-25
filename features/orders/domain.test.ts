import { describe, expect, it } from "vitest";
import {
  calculateEstimatedReadyDate,
  calculateOrderTotalCents,
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
    const ready = calculateEstimatedReadyDate(base, [
      { turnaroundDaysAtOrder: 5 },
    ]);
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
