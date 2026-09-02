import Decimal from "decimal.js";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export interface PersonShare {
  id: string;
  name: string;
  shares: number; // Số lượng phần (ví dụ: 1.0, 0.5, 2.0)
}

export interface PersonSplitDetail {
  id: string;
  name: string;
  shares: number;
  amount: number; // Số tiền phải trả
  roundedAmount: number; // Số tiền sau làm tròn
  percentOfTotal: number; // Tỷ lệ % trên tổng tiền
}

export interface BillSplitInput {
  subtotal: number | string; // Tổng tiền trước thuế/tip
  taxPercent: number | string; // Thuế VAT (%)
  tipPercent: number | string; // Phần trăm Tip (%)
  customTipAmount?: number | string; // Hoặc số tiền Tip cố định
  serviceChargePercent?: number | string; // Phí dịch vụ (%)
  numberOfPeople: number; // Số người chia (ở chế độ chia đều)
  roundingStep?: number; // Làm tròn (ví dụ: 1000 để làm tròn hàng nghìn)
  splitMode?: "equal" | "shares"; // Chế độ: chia đều hoặc chia theo phần
  peopleShares?: PersonShare[]; // Danh sách người và số phần
}

export interface BillSplitResult {
  subtotal: number;
  taxAmount: number;
  tipAmount: number;
  serviceChargeAmount: number;
  totalAmount: number;
  // Equal split metrics
  perPersonSubtotal: number;
  perPersonTax: number;
  perPersonTip: number;
  perPersonTotal: number;
  roundedPerPersonTotal: number;
  // Shares split metrics
  splitMode: "equal" | "shares";
  totalShares: number;
  pricePerShare: number;
  roundedPricePerShare: number;
  personDetails: PersonSplitDetail[];
}

export function calculateBillSplit(input: BillSplitInput): BillSplitResult {
  const subtotal = new Decimal(input.subtotal || 0);
  const taxPct = new Decimal(input.taxPercent || 0).div(100);
  const servicePct = new Decimal(input.serviceChargePercent || 0).div(100);
  const splitMode = input.splitMode || "equal";

  // Calculate tax and service charge
  const taxAmount = subtotal.times(taxPct);
  const serviceChargeAmount = subtotal.times(servicePct);

  // Calculate tip (custom fixed amount or percentage of subtotal)
  let tipAmount = new Decimal(0);
  if (input.customTipAmount && new Decimal(input.customTipAmount).gt(0)) {
    tipAmount = new Decimal(input.customTipAmount);
  } else {
    const tipPct = new Decimal(input.tipPercent || 0).div(100);
    tipAmount = subtotal.times(tipPct);
  }

  const totalAmount = subtotal
    .plus(taxAmount)
    .plus(serviceChargeAmount)
    .plus(tipAmount);

  // 1. Equal Split calculation
  const people = Math.max(1, input.numberOfPeople || 1);
  const peopleDec = new Decimal(people);
  const perPersonSubtotal = subtotal.div(peopleDec);
  const perPersonTax = taxAmount.div(peopleDec);
  const perPersonTip = tipAmount.div(peopleDec);
  const perPersonTotal = totalAmount.div(peopleDec);

  let roundedPerPerson = perPersonTotal;
  if (input.roundingStep && input.roundingStep > 1) {
    const step = new Decimal(input.roundingStep);
    roundedPerPerson = perPersonTotal.div(step).ceil().times(step);
  }

  // 2. Shares Split calculation
  const peopleShares = input.peopleShares && input.peopleShares.length > 0
    ? input.peopleShares
    : Array.from({ length: people }, (_, i) => ({
        id: `person-${i + 1}`,
        name: `Name ${i + 1}`,
        shares: 1,
      }));

  let totalSharesDec = new Decimal(0);
  for (const p of peopleShares) {
    totalSharesDec = totalSharesDec.plus(Math.max(0, p.shares || 0));
  }

  if (totalSharesDec.isZero()) {
    totalSharesDec = new Decimal(1);
  }

  const pricePerShare = totalAmount.div(totalSharesDec);
  let roundedPricePerShare = pricePerShare;
  if (input.roundingStep && input.roundingStep > 1) {
    const step = new Decimal(input.roundingStep);
    roundedPricePerShare = pricePerShare.div(step).ceil().times(step);
  }

  const personDetails: PersonSplitDetail[] = peopleShares.map((p) => {
    const pShares = new Decimal(Math.max(0, p.shares || 0));
    const amount = pShares.times(pricePerShare);
    let roundedAmount = amount;
    if (input.roundingStep && input.roundingStep > 1) {
      const step = new Decimal(input.roundingStep);
      roundedAmount = amount.div(step).ceil().times(step);
    }
    const percentOfTotal = totalAmount.gt(0)
      ? amount.div(totalAmount).times(100).toDecimalPlaces(2).toNumber()
      : 0;

    return {
      id: p.id,
      name: p.name || `Người`,
      shares: pShares.toNumber(),
      amount: amount.toDecimalPlaces(0).toNumber(),
      roundedAmount: roundedAmount.toDecimalPlaces(0).toNumber(),
      percentOfTotal,
    };
  });

  return {
    subtotal: subtotal.toDecimalPlaces(0).toNumber(),
    taxAmount: taxAmount.toDecimalPlaces(0).toNumber(),
    tipAmount: tipAmount.toDecimalPlaces(0).toNumber(),
    serviceChargeAmount: serviceChargeAmount.toDecimalPlaces(0).toNumber(),
    totalAmount: totalAmount.toDecimalPlaces(0).toNumber(),
    perPersonSubtotal: perPersonSubtotal.toDecimalPlaces(0).toNumber(),
    perPersonTax: perPersonTax.toDecimalPlaces(0).toNumber(),
    perPersonTip: perPersonTip.toDecimalPlaces(0).toNumber(),
    perPersonTotal: perPersonTotal.toDecimalPlaces(0).toNumber(),
    roundedPerPersonTotal: roundedPerPerson.toDecimalPlaces(0).toNumber(),
    splitMode,
    totalShares: totalSharesDec.toNumber(),
    pricePerShare: pricePerShare.toDecimalPlaces(0).toNumber(),
    roundedPricePerShare: roundedPricePerShare.toDecimalPlaces(0).toNumber(),
    personDetails,
  };
}
