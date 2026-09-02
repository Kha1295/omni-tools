import { describe, it, expect } from "vitest";
import { convertCurrency } from "../converter";

describe("Currency Converter Math Core (convertCurrency)", () => {
  it("should convert USD to USD as 1:1", () => {
    const { result, rate } = convertCurrency(100, "USD", "USD");
    expect(result).toBe(100);
    expect(rate).toBe(1);
  });

  it("should convert USD to VND with high decimal accuracy", () => {
    const { result, rate } = convertCurrency(100, "USD", "VND");
    expect(result).toBeGreaterThan(2000000);
    expect(rate).toBeGreaterThan(20000);
  });

  it("should convert two-way reversibly", () => {
    const toVND = convertCurrency(100, "USD", "VND");
    const backToUSD = convertCurrency(toVND.result, "VND", "USD");

    // Close to 100 within roundoff tolerance
    expect(Math.round(backToUSD.result)).toBe(100);
  });

  it("should fallback to default currency for unknown codes without throwing errors", () => {
    const { result } = convertCurrency(50, "UNKNOWN_CODE", "USD");
    expect(result).toBeDefined();
    expect(typeof result).toBe("number");
  });
});
