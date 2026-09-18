import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { checkAndSyncRatesIfNeeded } from "@/lib/services/currencySync";

export const dynamic = "force-dynamic";

/**
 * Calculates start date string "YYYY-MM-DD" based on range selector.
 */
function getStartDateForRange(range: string): string {
  const now = new Date();
  switch (range) {
    case "7d":
      now.setDate(now.getDate() - 7);
      break;
    case "30d":
      now.setDate(now.getDate() - 30);
      break;
    case "90d":
      now.setDate(now.getDate() - 90);
      break;
    case "1y":
      now.setFullYear(now.getFullYear() - 1);
      break;
    case "5y":
      now.setFullYear(now.getFullYear() - 5);
      break;
    default: {
      const numDays = parseInt(range, 10);
      if (!isNaN(numDays) && numDays > 0) {
        now.setDate(now.getDate() - numDays);
      } else {
        now.setDate(now.getDate() - 30);
      }
      break;
    }
  }
  return now.toISOString().split("T")[0];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = (searchParams.get("from") || "USD").toUpperCase();
    const to = (searchParams.get("to") || "VND").toUpperCase();
    const range = searchParams.get("range") || "30d";

    const startDate = getStartDateForRange(range);
    const todayStr = new Date().toISOString().split("T")[0];

    // Determine which currencies we need to query from usd_rates_history
    const currenciesToQuery: string[] = [];
    if (from !== "USD") currenciesToQuery.push(from);
    if (to !== "USD" && to !== from) currenciesToQuery.push(to);

    // Check if today's sync is needed and ensure synced
    const todayCheck = await prisma.usdRateHistory.findFirst({
      where: { date: todayStr },
      select: { id: true },
    });

    if (!todayCheck) {
      try {
        await checkAndSyncRatesIfNeeded();
      } catch (e) {
        console.error("Auto sync failed, falling back to existing records:", e);
      }
    }

    // Query database for rates in date range
    const rawRecords = await prisma.usdRateHistory.findMany({
      where: {
        date: { gte: startDate },
        currency: { in: currenciesToQuery },
      },
      orderBy: { date: "asc" },
      select: {
        date: true,
        currency: true,
        rate: true,
      },
    });

    // If one of the currencies is USD, we need all distinct dates in that range
    let allDates: string[] = [];
    if (from === "USD" || to === "USD") {
      const targetCurrency = from === "USD" ? to : from;
      allDates = rawRecords
        .filter((r) => r.currency === targetCurrency)
        .map((r) => r.date);
    } else {
      // Both are non-USD, find common dates where both rates exist
      const datesByCurr: Record<string, Set<string>> = {
        [from]: new Set(),
        [to]: new Set(),
      };
      rawRecords.forEach((r) => {
        datesByCurr[r.currency]?.add(r.date);
      });
      const datesFrom = datesByCurr[from];
      const datesTo = datesByCurr[to];
      if (datesFrom && datesTo) {
        allDates = Array.from(datesFrom)
          .filter((d) => datesTo.has(d))
          .sort();
      }
    }

    // Map records by `${date}_${currency}` for O(1) lookup
    const rateMap = new Map<string, number>();
    rawRecords.forEach((r) => {
      rateMap.set(`${r.date}_${r.currency}`, Number(r.rate));
    });

    // Compute cross-rate for each date
    const chart: Array<{ date: string; rate: number }> = [];
    let minRate = Infinity;
    let maxRate = -Infinity;

    for (const date of allDates) {
      // Rate of A to USD: 1 USD = rate_USD_A A => 1 A = 1 / rate_USD_A USD
      const rate_USD_A = from === "USD" ? 1 : rateMap.get(`${date}_${from}`);
      // Rate of B to USD: 1 USD = rate_USD_B B
      const rate_USD_B = to === "USD" ? 1 : rateMap.get(`${date}_${to}`);

      if (rate_USD_A && rate_USD_B && rate_USD_A > 0) {
        // Cross Rate: 1 A = (rate_USD_B / rate_USD_A) B
        const crossRate = Number((rate_USD_B / rate_USD_A).toFixed(4));
        chart.push({ date, rate: crossRate });
        if (crossRate < minRate) minRate = crossRate;
        if (crossRate > maxRate) maxRate = crossRate;
      }
    }

    const currentRate = chart.length > 0 ? chart[chart.length - 1].rate : 1;
    const firstRate = chart.length > 0 ? chart[0].rate : currentRate;
    const changePercent =
      firstRate > 0
        ? Number((((currentRate - firstRate) / firstRate) * 100).toFixed(2))
        : 0;

    return NextResponse.json({
      success: true,
      pair: `${from}_${to}`,
      from,
      to,
      range,
      currentRate,
      highestRate: maxRate === -Infinity ? currentRate : maxRate,
      lowestRate: minRate === Infinity ? currentRate : minRate,
      changePercent,
      dataPointsCount: chart.length,
      chart,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to calculate currency rates";
    console.error("[GET /api/currency/history error]:", error);
    return NextResponse.json(
      {
        success: false,
        message,
        chart: [],
      },
      { status: 500 }
    );
  }
}

