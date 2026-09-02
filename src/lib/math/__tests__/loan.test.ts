import { describe, it, expect } from "vitest";
import { calculateLoan, compareLoanMethods } from "../loan";

describe("Loan Calculator Math Core (calculateLoan & compareLoanMethods)", () => {
  it("should calculate reducing balance loan repayment correctly", () => {
    const result = calculateLoan({
      principal: 120000000, // 120M VND
      annualInterestRate: 12, // 12%/year = 1%/month
      termMonths: 12, // 12 months -> principal 10M/month
      method: "reducing_balance",
      gracePeriodMonths: 0,
    });

    expect(result.principal).toBe(120000000);
    expect(result.schedule.length).toBe(12);

    // Month 1: 10M principal + 1% of 120M (1.2M) = 11.2M
    expect(result.schedule[0].principalPayment).toBe(10000000);
    expect(result.schedule[0].interestPayment).toBe(1200000);
    expect(result.schedule[0].totalMonthlyPayment).toBe(11200000);
    expect(result.schedule[0].endingBalance).toBe(110000000);

    // Month 12: 10M principal + 1% of 10M (100,000) = 10.1M
    expect(result.schedule[11].principalPayment).toBe(10000000);
    expect(result.schedule[11].interestPayment).toBe(100000);
    expect(result.schedule[11].totalMonthlyPayment).toBe(10100000);
    expect(result.schedule[11].endingBalance).toBe(0);

    // Total interest = 1% * (120 + 110 + 100 + ... + 10) = 1% * 780M = 7.8M
    expect(result.totalInterest).toBe(7800000);
    expect(result.totalPayment).toBe(127800000);
  });

  it("should calculate flat rate loan correctly", () => {
    const result = calculateLoan({
      principal: 120000000,
      annualInterestRate: 12, // 1%/month
      termMonths: 12,
      method: "flat_rate",
      gracePeriodMonths: 0,
    });

    expect(result.principal).toBe(120000000);
    // Flat interest every month = 1.2M
    for (const item of result.schedule) {
      expect(item.interestPayment).toBe(1200000);
    }
    // Total interest = 1.2M * 12 = 14.4M
    expect(result.totalInterest).toBe(14400000);
    expect(result.totalPayment).toBe(134400000);
  });

  it("should support grace period (ân hạn nợ gốc)", () => {
    const result = calculateLoan({
      principal: 100000000,
      annualInterestRate: 12,
      termMonths: 12,
      method: "reducing_balance",
      gracePeriodMonths: 3, // 3 months grace period
    });

    expect(result.schedule.length).toBe(12);

    // First 3 months are grace period: principal payment = 0, interest = 1M
    for (let i = 0; i < 3; i++) {
      expect(result.schedule[i].isGracePeriod).toBe(true);
      expect(result.schedule[i].principalPayment).toBe(0);
      expect(result.schedule[i].interestPayment).toBe(1000000);
      expect(result.schedule[i].endingBalance).toBe(100000000);
    }

    // From month 4: Principal is split across remaining 9 months (100M / 9 = ~11,111,111)
    expect(result.schedule[3].isGracePeriod).toBe(false);
    expect(result.schedule[3].principalPayment).toBeGreaterThan(0);
    expect(result.schedule[11].endingBalance).toBe(0);
  });

  it("should calculate side-by-side comparison with savings", () => {
    const comparison = compareLoanMethods(500000000, 10, 36, 0);

    expect(comparison.reducing.totalInterest).toBeLessThan(comparison.flat.totalInterest);
    expect(comparison.interestDifference).toBe(
      comparison.flat.totalInterest - comparison.reducing.totalInterest
    );
  });
});
