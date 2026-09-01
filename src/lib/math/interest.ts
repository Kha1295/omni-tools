import Decimal from "decimal.js";

// Set high precision for financial operations
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export interface CompoundInterestInput {
  initialPrincipal: number | string; // Số tiền gốc ban đầu
  annualInterestRate: number | string; // Lãi suất năm (%)
  durationYears: number | string; // Thời gian gửi (năm)
  compoundFrequency: "monthly" | "quarterly" | "annually"; // Tần suất ghép lãi
  periodicContribution?: number | string; // Tiền gửi thêm định kỳ
  contributionFrequency?: "monthly" | "annually"; // Tần suất gửi thêm
}

export interface YearlyBreakdown {
  year: number;
  totalDeposit: number;
  totalInterest: number;
  endingBalance: number;
  yearlyInterest: number;
}

export interface CompoundInterestResult {
  totalPrincipal: number; // Tổng tiền gốc đã nộp
  totalInterest: number; // Tổng tiền lãi thu được
  finalBalance: number; // Tổng số dư cuối kỳ
  breakdown: YearlyBreakdown[];
}

/**
 * Calculates compound interest with optional periodic deposits using exact decimal math.
 */
export function calculateCompoundInterest(
  input: CompoundInterestInput
): CompoundInterestResult {
  const P = new Decimal(input.initialPrincipal || 0);
  const annualRate = new Decimal(input.annualInterestRate || 0).div(100);
  const years = new Decimal(input.durationYears || 1).toNumber();
  const PMT = new Decimal(input.periodicContribution || 0);
  const isMonthlyContribution = input.contributionFrequency !== "annually";

  const breakdown: YearlyBreakdown[] = [];
  let currentBalance = P;
  let accumulatedDeposits = P;
  let previousBalance = P;

  for (let year = 1; year <= years; year++) {
    // Simulate month by month for exact accuracy
    for (let month = 1; month <= 12; month++) {
      // Periodic contribution at the beginning of the month
      if (PMT.gt(0)) {
        if (isMonthlyContribution) {
          currentBalance = currentBalance.plus(PMT);
          accumulatedDeposits = accumulatedDeposits.plus(PMT);
        } else if (month === 1) {
          currentBalance = currentBalance.plus(PMT);
          accumulatedDeposits = accumulatedDeposits.plus(PMT);
        }
      }

      // Add interest based on monthly compounding rate
      const monthlyRate = annualRate.div(12);
      currentBalance = currentBalance.plus(currentBalance.times(monthlyRate));
    }

    const totalInterestSoFar = currentBalance.minus(accumulatedDeposits);
    const yearlyInterest = currentBalance.minus(previousBalance).minus(
      isMonthlyContribution ? PMT.times(12) : PMT
    );

    breakdown.push({
      year,
      totalDeposit: accumulatedDeposits.toDecimalPlaces(0).toNumber(),
      totalInterest: Decimal.max(0, totalInterestSoFar).toDecimalPlaces(0).toNumber(),
      endingBalance: currentBalance.toDecimalPlaces(0).toNumber(),
      yearlyInterest: Decimal.max(0, yearlyInterest).toDecimalPlaces(0).toNumber(),
    });

    previousBalance = currentBalance;
  }

  const finalBalance = currentBalance.toDecimalPlaces(0).toNumber();
  const totalPrincipal = accumulatedDeposits.toDecimalPlaces(0).toNumber();
  const totalInterest = currentBalance.minus(accumulatedDeposits).toDecimalPlaces(0).toNumber();

  return {
    totalPrincipal,
    totalInterest: Math.max(0, totalInterest),
    finalBalance,
    breakdown,
  };
}
