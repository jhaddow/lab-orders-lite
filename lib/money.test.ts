import { describe, expect, it } from "vitest";
import { formatMoney } from "./money";

describe("formatMoney", () => {
  it("formats whole-dollar USD amounts", () => {
    expect(formatMoney(4500, "USD")).toBe("$45.00");
  });

  it("formats fractional amounts", () => {
    expect(formatMoney(1299, "USD")).toBe("$12.99");
  });

  it("formats zero", () => {
    expect(formatMoney(0, "USD")).toBe("$0.00");
  });

  it("formats large amounts with grouping", () => {
    expect(formatMoney(123456789, "USD")).toBe("$1,234,567.89");
  });

  it("defaults to USD when no currency provided", () => {
    expect(formatMoney(500)).toBe("$5.00");
  });

  it("throws on non-integer input", () => {
    expect(() => formatMoney(12.5, "USD")).toThrow(/integer cents/);
  });
});
