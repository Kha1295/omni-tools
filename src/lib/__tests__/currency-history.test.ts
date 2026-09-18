import { describe, it, expect } from "vitest";
import { POPULAR_CURRENCIES_INFO } from "../services/currencySync";

describe("Currency Cross-Rate and Time-Series Math", () => {
  it("computes direct rate when from currency is USD", () => {
    // 1 USD = 25,900 VND
    const rate_USD_from = 1;
    const rate_USD_to = 25900;
    const crossRate = rate_USD_to / rate_USD_from;
    expect(crossRate).toBe(25900);
  });

  it("computes inverse rate when to currency is USD", () => {
    // 1 USD = 0.85 EUR => 1 EUR = 1 / 0.85 USD
    const rate_USD_from = 0.85;
    const rate_USD_to = 1;
    const crossRate = Number((rate_USD_to / rate_USD_from).toFixed(4));
    expect(crossRate).toBe(1.1765);
  });

  it("computes cross rate between two non-USD currencies correctly", () => {
    // 1 USD = 0.85 EUR
    // 1 USD = 25,900 VND
    // 1 EUR = 25,900 / 0.85 VND ~ 30,470.5882 VND
    const rate_USD_EUR = 0.85;
    const rate_USD_VND = 25900;
    const crossRate = Number((rate_USD_VND / rate_USD_EUR).toFixed(4));
    expect(crossRate).toBe(30470.5882);
  });

  it("calculates percentage change accurately", () => {
    const firstRate = 25000;
    const currentRate = 25500;
    const changePercent = Number((((currentRate - firstRate) / firstRate) * 100).toFixed(2));
    expect(changePercent).toBe(2.0);

    const decliningCurrent = 24500;
    const declinePercent = Number((((decliningCurrent - firstRate) / firstRate) * 100).toFixed(2));
    expect(declinePercent).toBe(-2.0);
  });

  it("exports POPULAR_CURRENCIES_INFO with all core currencies", () => {
    expect(POPULAR_CURRENCIES_INFO).toBeDefined();
    expect(POPULAR_CURRENCIES_INFO.USD.name).toBe("Đô la Mỹ");
    expect(POPULAR_CURRENCIES_INFO.VND.symbol).toBe("₫");
    expect(POPULAR_CURRENCIES_INFO.EUR.code === undefined).toBe(true); // Keys are currency codes
    expect(Object.keys(POPULAR_CURRENCIES_INFO)).toContain("USD");
    expect(Object.keys(POPULAR_CURRENCIES_INFO)).toContain("VND");
    expect(Object.keys(POPULAR_CURRENCIES_INFO)).toContain("EUR");
    expect(Object.keys(POPULAR_CURRENCIES_INFO)).toContain("JPY");
    expect(Object.keys(POPULAR_CURRENCIES_INFO)).toContain("GBP");
  });

  it("calculates live cross rates using allRates map", () => {
    const allRates: Record<string, number> = {
      USD: 1,
      VND: 25964.16,
      EUR: 0.8706,
      JPY: 155.84,
    };

    // EUR to VND: (25964.16 / 0.8706) = 29823.2942798...
    const eurToVnd = Number((allRates.VND / allRates.EUR).toFixed(4));
    expect(eurToVnd).toBe(29823.2943);

    // JPY to VND: (25964.16 / 155.84) = 166.60780...
    const jpyToVnd = Number((allRates.VND / allRates.JPY).toFixed(4));
    expect(jpyToVnd).toBe(166.6078);
  });
});
