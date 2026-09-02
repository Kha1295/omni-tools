import Decimal from "decimal.js";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export type LoanCalculationMethod = "reducing_balance" | "flat_rate";

export interface LoanInput {
  principal: number | string; // Số tiền vay (VND)
  annualInterestRate: number | string; // Lãi suất (%/năm)
  termMonths: number; // Thời gian vay (tháng)
  method: LoanCalculationMethod; // Phương thức tính: Dư nợ giảm dần vs Dư nợ gốc
  gracePeriodMonths?: number; // Thời gian ân hạn nợ gốc (tháng)
}

export interface MonthlyLoanSchedule {
  month: number;
  startingBalance: number;
  principalPayment: number;
  interestPayment: number;
  totalMonthlyPayment: number;
  endingBalance: number;
  isGracePeriod: boolean;
}

export interface LoanResult {
  principal: number;
  totalInterest: number;
  totalPayment: number;
  firstMonthPayment: number;
  lastMonthPayment: number;
  maxMonthlyPayment: number;
  minMonthlyPayment: number;
  schedule: MonthlyLoanSchedule[];
  method: LoanCalculationMethod;
}

export interface LoanComparisonResult {
  reducing: LoanResult;
  flat: LoanResult;
  interestDifference: number; // Chênh lệch tiền lãi giữa 2 phương thức
}

/**
 * Calculates loan repayment schedule and summary using exact Decimal.js math
 */
export function calculateLoan(input: LoanInput): LoanResult {
  const principal = new Decimal(input.principal || 0);
  const annualRate = new Decimal(input.annualInterestRate || 0).div(100);
  const monthlyRate = annualRate.div(12);
  const termMonths = Math.max(1, input.termMonths || 1);
  const gracePeriod = Math.min(termMonths - 1, Math.max(0, input.gracePeriodMonths || 0));

  const schedule: MonthlyLoanSchedule[] = [];
  let currentBalance = principal;
  let totalInterest = new Decimal(0);

  // Remaining months to pay principal after grace period
  const activeRepaymentMonths = termMonths - gracePeriod;
  const regularMonthlyPrincipal = activeRepaymentMonths > 0 
    ? principal.div(activeRepaymentMonths) 
    : new Decimal(0);

  if (input.method === "flat_rate") {
    // Phương thức dư nợ gốc ban đầu: Lãi mỗi tháng tính cố định trên gốc ban đầu
    const monthlyInterestFixed = principal.times(monthlyRate);

    for (let m = 1; m <= termMonths; m++) {
      const isGrace = m <= gracePeriod;
      const principalPay = isGrace ? new Decimal(0) : regularMonthlyPrincipal;
      const interestPay = monthlyInterestFixed;
      const totalPay = principalPay.plus(interestPay);
      const endingBal = Decimal.max(0, currentBalance.minus(principalPay));

      schedule.push({
        month: m,
        startingBalance: currentBalance.toDecimalPlaces(0).toNumber(),
        principalPayment: principalPay.toDecimalPlaces(0).toNumber(),
        interestPayment: interestPay.toDecimalPlaces(0).toNumber(),
        totalMonthlyPayment: totalPay.toDecimalPlaces(0).toNumber(),
        endingBalance: endingBal.toDecimalPlaces(0).toNumber(),
        isGracePeriod: isGrace,
      });

      totalInterest = totalInterest.plus(interestPay);
      currentBalance = endingBal;
    }
  } else {
    // Phương thức dư nợ giảm dần: Lãi mỗi tháng tính trên số dư nợ còn lại thực tế
    for (let m = 1; m <= termMonths; m++) {
      const isGrace = m <= gracePeriod;
      const principalPay = isGrace ? new Decimal(0) : regularMonthlyPrincipal;
      const interestPay = currentBalance.times(monthlyRate);
      const totalPay = principalPay.plus(interestPay);
      const endingBal = Decimal.max(0, currentBalance.minus(principalPay));

      schedule.push({
        month: m,
        startingBalance: currentBalance.toDecimalPlaces(0).toNumber(),
        principalPayment: principalPay.toDecimalPlaces(0).toNumber(),
        interestPayment: interestPay.toDecimalPlaces(0).toNumber(),
        totalMonthlyPayment: totalPay.toDecimalPlaces(0).toNumber(),
        endingBalance: endingBal.toDecimalPlaces(0).toNumber(),
        isGracePeriod: isGrace,
      });

      totalInterest = totalInterest.plus(interestPay);
      currentBalance = endingBal;
    }
  }

  const totalPayment = principal.plus(totalInterest);
  const monthlyPayments = schedule.map((s) => s.totalMonthlyPayment);
  const firstMonthPayment = schedule.length > 0 ? schedule[0].totalMonthlyPayment : 0;
  const lastMonthPayment = schedule.length > 0 ? schedule[schedule.length - 1].totalMonthlyPayment : 0;
  const maxMonthlyPayment = Math.max(...monthlyPayments, 0);
  const minMonthlyPayment = Math.min(...monthlyPayments, 0);

  return {
    principal: principal.toDecimalPlaces(0).toNumber(),
    totalInterest: totalInterest.toDecimalPlaces(0).toNumber(),
    totalPayment: totalPayment.toDecimalPlaces(0).toNumber(),
    firstMonthPayment,
    lastMonthPayment,
    maxMonthlyPayment,
    minMonthlyPayment,
    schedule,
    method: input.method,
  };
}

/**
 * Calculates both Reducing Balance and Flat Rate side-by-side for easy comparison
 */
export function compareLoanMethods(
  principal: number | string,
  annualInterestRate: number | string,
  termMonths: number,
  gracePeriodMonths: number = 0
): LoanComparisonResult {
  const reducing = calculateLoan({
    principal,
    annualInterestRate,
    termMonths,
    method: "reducing_balance",
    gracePeriodMonths,
  });

  const flat = calculateLoan({
    principal,
    annualInterestRate,
    termMonths,
    method: "flat_rate",
    gracePeriodMonths,
  });

  const interestDifference = Math.abs(flat.totalInterest - reducing.totalInterest);

  return {
    reducing,
    flat,
    interestDifference,
  };
}
