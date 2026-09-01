import Decimal from "decimal.js";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rateToUSD: number; // 1 Unit = X USD
}

export const POPULAR_CURRENCIES: CurrencyRate[] = [
  { code: "VND", name: "Việt Nam Đồng", symbol: "₫", rateToUSD: 0.00003937 }, // ~25,400 VND/USD
  { code: "USD", name: "Đô la Mỹ", symbol: "$", rateToUSD: 1.0 },
  { code: "EUR", name: "Euro", symbol: "€", rateToUSD: 1.085 },
  { code: "JPY", name: "Yên Nhật", symbol: "¥", rateToUSD: 0.0066 },
  { code: "GBP", name: "Bảng Anh", symbol: "£", rateToUSD: 1.29 },
  { code: "AUD", name: "Đô la Úc", symbol: "A$", rateToUSD: 0.66 },
  { code: "CAD", name: "Đô la Canada", symbol: "C$", rateToUSD: 0.73 },
  { code: "SGD", name: "Đô la Singapore", symbol: "S$", rateToUSD: 0.76 },
  { code: "KRW", name: "Won Hàn Quốc", symbol: "₩", rateToUSD: 0.00073 },
  { code: "CNY", name: "Nhân dân tệ", symbol: "¥", rateToUSD: 0.14 },
  { code: "THB", name: "Baht Thái", symbol: "฿", rateToUSD: 0.029 },
];

export function convertCurrency(
  amount: number | string,
  fromCode: string,
  toCode: string
): { result: number; rate: number } {
  const from = POPULAR_CURRENCIES.find((c) => c.code === fromCode) || POPULAR_CURRENCIES[0];
  const to = POPULAR_CURRENCIES.find((c) => c.code === toCode) || POPULAR_CURRENCIES[1];

  const amt = new Decimal(amount || 0);
  const fromRateUSD = new Decimal(from.rateToUSD);
  const toRateUSD = new Decimal(to.rateToUSD);

  // Amount in USD = amt * fromRateUSD
  // Amount in Target = (amt * fromRateUSD) / toRateUSD
  const result = amt.times(fromRateUSD).div(toRateUSD);
  const directRate = fromRateUSD.div(toRateUSD);

  return {
    result: result.toDecimalPlaces(4).toNumber(),
    rate: directRate.toDecimalPlaces(6).toNumber(),
  };
}
