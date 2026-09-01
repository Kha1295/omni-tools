import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Decimal from "decimal.js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number/Decimal to localized currency or standard notation
 */
export function formatCurrency(
  value: Decimal.Value | number | string,
  currency: string = "VND",
  locale: string = "vi-VN"
): string {
  try {
    const num = new Decimal(value || 0).toNumber();
    if (currency === "VND") {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(num);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return "0 ₫";
  }
}

/**
 * Format standard number with commas
 */
export function formatNumber(
  value: Decimal.Value | number | string,
  decimals: number = 2
): string {
  try {
    const num = new Decimal(value || 0).toNumber();
    return new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: decimals,
    }).format(num);
  } catch {
    return "0";
  }
}
