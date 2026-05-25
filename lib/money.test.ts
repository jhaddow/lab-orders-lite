import { describe, expect, it } from "vitest";
import { formatMoney, parseDollars } from "./money";

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

describe("parseDollars", () => {
  it("parses whole dollars", () => {
    expect(parseDollars("45")).toBe(4500);
  });

  it("parses dollars with two decimals", () => {
    expect(parseDollars("45.50")).toBe(4550);
  });

  it("parses dollars with one decimal as tens-of-cents", () => {
    expect(parseDollars("45.5")).toBe(4550);
  });

  it("parses zero", () => {
    expect(parseDollars("0")).toBe(0);
    expect(parseDollars("0.00")).toBe(0);
  });

  it("ignores surrounding whitespace", () => {
    expect(parseDollars("  12.34  ")).toBe(1234);
  });

  it("avoids floating-point drift", () => {
    expect(parseDollars("0.10") + parseDollars("0.20")).toBe(30);
  });

  it("rejects more than two decimal places", () => {
    expect(() => parseDollars("45.555")).toThrow(/Invalid/);
  });

  it("rejects negative values", () => {
    expect(() => parseDollars("-1")).toThrow(/Invalid/);
  });

  it("rejects non-numeric input", () => {
    expect(() => parseDollars("forty-five")).toThrow(/Invalid/);
    expect(() => parseDollars("")).toThrow(/Invalid/);
    expect(() => parseDollars(".50")).toThrow(/Invalid/);
  });
});
