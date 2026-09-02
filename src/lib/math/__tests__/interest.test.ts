import { describe, it, expect } from "vitest";
import { calculateCompoundInterest } from "../interest";

describe("Compound Interest Math Core (calculateCompoundInterest)", () => {
  it("should calculate simple compound interest without periodic contribution", () => {
    const result = calculateCompoundInterest({
      initialPrincipal: 100000000, // 100M VND
      annualInterestRate: 10, // 10%/year
      durationYears: 1,
      compoundFrequency: "monthly",
      periodicContribution: 0,
    });

    expect(result.totalPrincipal).toBe(100000000);
    expect(result.finalBalance).toBeGreaterThan(110000000);
    expect(result.totalInterest).toBe(result.finalBalance - result.totalPrincipal);
    expect(result.breakdown.length).toBe(1);
  });

  it("should calculate compound interest with monthly contributions over multiple years", () => {
    const result = calculateCompoundInterest({
      initialPrincipal: 50000000,
      annualInterestRate: 8,
      durationYears: 5,
      periodicContribution: 2000000,
      contributionFrequency: "monthly",
      compoundFrequency: "monthly",
    });

    // 50M + 2M * 12 * 5 = 170M
    expect(result.totalPrincipal).toBe(170000000);
    expect(result.finalBalance).toBeGreaterThan(result.totalPrincipal);
    expect(result.breakdown.length).toBe(5);

    // Each year balance is strictly increasing
    for (let i = 1; i < result.breakdown.length; i++) {
      expect(result.breakdown[i].endingBalance).toBeGreaterThan(
        result.breakdown[i - 1].endingBalance
      );
    }
  });

  it("should yield higher interest for more frequent compounding", () => {
    const monthlyResult = calculateCompoundInterest({
      initialPrincipal: 100000000,
      annualInterestRate: 12,
      durationYears: 3,
      compoundFrequency: "monthly",
      periodicContribution: 0,
    });

    const yearlyResult = calculateCompoundInterest({
      initialPrincipal: 100000000,
      annualInterestRate: 12,
      durationYears: 3,
      compoundFrequency: "annually",
      periodicContribution: 0,
    });

    expect(monthlyResult.totalInterest).toBeGreaterThanOrEqual(yearlyResult.totalInterest);
  });
});
