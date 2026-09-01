import Decimal from "decimal.js";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export interface BillSplitInput {
  subtotal: number | string; // Tổng tiền trước thuế/tip
  taxPercent: number | string; // Thuế VAT (%)
  tipPercent: number | string; // Phần trăm Tip (%)
  customTipAmount?: number | string; // Hoặc số tiền Tip cố định
  serviceChargePercent?: number | string; // Phí dịch vụ (%)
  numberOfPeople: number; // Số người chia
  roundingStep?: number; // Làm tròn (ví dụ: 1000 để làm tròn hàng nghìn)
}

export interface BillSplitResult {
  subtotal: number;
  taxAmount: number;
  tipAmount: number;
  serviceChargeAmount: number;
  totalAmount: number;
  perPersonSubtotal: number;
  perPersonTax: number;
  perPersonTip: number;
  perPersonTotal: number;
  roundedPerPersonTotal: number;
}

export function calculateBillSplit(input: BillSplitInput): BillSplitResult {
  const subtotal = new Decimal(input.subtotal || 0);
  const taxPct = new Decimal(input.taxPercent || 0).div(100);
  const servicePct = new Decimal(input.serviceChargePercent || 0).div(100);
  const people = Math.max(1, input.numberOfPeople || 1);

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

  const peopleDec = new Decimal(people);
  const perPersonSubtotal = subtotal.div(peopleDec);
  const perPersonTax = taxAmount.div(peopleDec);
  const perPersonTip = tipAmount.div(peopleDec);
  const perPersonTotal = totalAmount.div(peopleDec);

  let roundedPerPerson = perPersonTotal;
  if (input.roundingStep && input.roundingStep > 1) {
    const step = new Decimal(input.roundingStep);
    // Ceiling round to step
    roundedPerPerson = perPersonTotal.div(step).ceil().times(step);
  }

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
  };
}
