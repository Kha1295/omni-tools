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

export interface ReverseLoanInput {
  principal: number | string; // Tổng tiền vay
  termMonths: number; // Số tháng trả
  monthlyPayment?: number | string; // Số tiền phải trả mỗi tháng
  totalPayment?: number | string; // Tổng gốc + lãi (optional)
}

export interface ReverseLoanResult {
  principal: number;
  termMonths: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  annualRateReducing: number; // Lãi suất năm theo dư nợ giảm dần (APR, %/năm)
  monthlyRateReducing: number; // Lãi suất tháng theo dư nợ giảm dần (%/tháng)
  annualRateFlat: number; // Lãi suất phẳng theo dư nợ gốc (%/năm)
  monthlyRateFlat: number; // Lãi suất phẳng theo dư nợ gốc (%/tháng)
  interestRatio: number; // Tỷ lệ lãi / gốc (%)
  schedule: MonthlyLoanSchedule[];
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

/**
 * Reverse loan calculation: Finds the exact effective interest rate (Reducing APR and Flat Rate)
 * based on Principal, Term, and Monthly Payment (or Total Payment).
 */
export function findLoanInterestRate(input: ReverseLoanInput): ReverseLoanResult {
  const P = new Decimal(input.principal || 0);
  const N = Math.max(1, input.termMonths || 1);

  // Determine monthly payment PMT and total payment
  let PMT = new Decimal(0);
  let totalPaymentDec = new Decimal(0);

  if (input.monthlyPayment && new Decimal(input.monthlyPayment).gt(0)) {
    PMT = new Decimal(input.monthlyPayment);
    totalPaymentDec = PMT.times(N);
  } else if (input.totalPayment && new Decimal(input.totalPayment).gt(0)) {
    totalPaymentDec = new Decimal(input.totalPayment);
    PMT = totalPaymentDec.div(N);
  } else {
    // Default fallback
    PMT = P.div(N);
    totalPaymentDec = P;
  }

  const totalInterestDec = Decimal.max(0, totalPaymentDec.minus(P));
  const interestRatio = P.gt(0)
    ? totalInterestDec.div(P).times(100).toDecimalPlaces(2).toNumber()
    : 0;

  // 1. Flat Rate calculation (Lãi suất phẳng)
  // Flat annual rate = (Total Interest / (P * (N/12))) * 100
  let annualRateFlat = 0;
  let monthlyRateFlat = 0;
  if (P.gt(0)) {
    const years = new Decimal(N).div(12);
    annualRateFlat = totalInterestDec.div(P.times(years)).times(100).toDecimalPlaces(2).toNumber();
    monthlyRateFlat = totalInterestDec.div(P.times(N)).times(100).toDecimalPlaces(2).toNumber();
  }

  // 2. Reducing Balance APR calculation (Lãi suất thực tế theo dư nợ giảm dần)
  // Solve for monthly rate r: PMT * (1 - (1+r)^(-N)) / r = P
  let monthlyRateReducingDec = new Decimal(0);

  if (totalPaymentDec.gt(P) && P.gt(0)) {
    // Binary search for r in [0, 5.0] (0% to 500% monthly)
    let low = 0.0;
    let high = 5.0;

    for (let iter = 0; iter < 80; iter++) {
      const mid = (low + high) / 2;
      // Calculate present value of annuity with rate mid
      // PV = PMT * (1 - (1 + mid)^(-N)) / mid
      const pv = (PMT.toNumber() * (1 - Math.pow(1 + mid, -N))) / mid;

      if (pv > P.toNumber()) {
        // Rate is too low -> need higher rate to reduce PV
        low = mid;
      } else {
        high = mid;
      }
    }

    monthlyRateReducingDec = new Decimal((low + high) / 2);
  }

  const monthlyRateReducing = monthlyRateReducingDec.times(100).toDecimalPlaces(2).toNumber();
  const annualRateReducing = monthlyRateReducingDec.times(12).times(100).toDecimalPlaces(2).toNumber();

  // 3. Generate monthly schedule based on effective APR
  const schedule: MonthlyLoanSchedule[] = [];
  let currentBalance = P;
  const mRate = monthlyRateReducingDec;

  for (let m = 1; m <= N; m++) {
    const startingBal = currentBalance;
    const interestPay = startingBal.times(mRate);
    let principalPay = PMT.minus(interestPay);

    if (m === N || principalPay.gt(currentBalance)) {
      principalPay = currentBalance;
    }

    const actualMonthlyTotal = principalPay.plus(interestPay);
    const endingBal = Decimal.max(0, currentBalance.minus(principalPay));

    schedule.push({
      month: m,
      startingBalance: startingBal.toDecimalPlaces(0).toNumber(),
      principalPayment: principalPay.toDecimalPlaces(0).toNumber(),
      interestPayment: interestPay.toDecimalPlaces(0).toNumber(),
      totalMonthlyPayment: actualMonthlyTotal.toDecimalPlaces(0).toNumber(),
      endingBalance: endingBal.toDecimalPlaces(0).toNumber(),
      isGracePeriod: false,
    });

    currentBalance = endingBal;
  }

  return {
    principal: P.toDecimalPlaces(0).toNumber(),
    termMonths: N,
    monthlyPayment: PMT.toDecimalPlaces(0).toNumber(),
    totalPayment: totalPaymentDec.toDecimalPlaces(0).toNumber(),
    totalInterest: totalInterestDec.toDecimalPlaces(0).toNumber(),
    annualRateReducing,
    monthlyRateReducing,
    annualRateFlat,
    monthlyRateFlat,
    interestRatio,
    schedule,
  };
}
