import prisma from "../db";

interface ExchangeRateApiResponse {
  result: string;
  time_last_update_utc?: string;
  time_last_update_unix?: number;
  rates?: Record<string, number>;
  conversion_rates?: Record<string, number>;
}

export interface SyncResult {
  success: boolean;
  date: string;
  count: number;
  message: string;
}

/**
 * Synchronizes the latest daily exchange rates against USD into the usd_rates_history table.
 * Uses ExchangeRate-API (free/open endpoint, or custom API key if configured).
 */
export async function syncDailyRates(): Promise<SyncResult> {
  const todayStr = new Date().toISOString().split("T")[0];

  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  const endpoint = apiKey
    ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
    : "https://open.er-api.com/v6/latest/USD";

  try {
    const res = await fetch(endpoint, {
      next: { revalidate: 3600 }, // cache for at most 1 hour in Next.js fetch
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch exchange rates: ${res.status} ${res.statusText}`);
    }

    const data: ExchangeRateApiResponse = await res.json();
    const rates = data.conversion_rates || data.rates;

    if (!rates || typeof rates !== "object") {
      throw new Error("Invalid response format: 'rates' or 'conversion_rates' not found");
    }

    const records: Array<{ date: string; currency: string; rate: number }> = [];

    for (const [curr, val] of Object.entries(rates)) {
      if (curr && typeof val === "number" && val > 0) {
        records.push({
          date: todayStr,
          currency: curr.toUpperCase(),
          rate: Number(val.toFixed(6)),
        });
      }
    }

    if (records.length === 0) {
      return {
        success: false,
        date: todayStr,
        count: 0,
        message: "No valid currency rates parsed from API",
      };
    }

    // Upsert or insert records for today
    // Using createMany with skipDuplicates ensures existing records for today aren't duplicated,
    // and for existing ones we can do a bulk update or recreate.
    await prisma.$transaction(async (tx) => {
      // Delete today's existing records to ensure fresh update
      await tx.usdRateHistory.deleteMany({
        where: { date: todayStr },
      });

      // Bulk insert today's latest rates in batches of 1000
      const BATCH_SIZE = 1000;
      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        await tx.usdRateHistory.createMany({
          data: batch,
        });
      }

      // Also update the legacy ExchangeRate table for popular currencies
      for (const [code, info] of Object.entries(POPULAR_CURRENCIES_INFO)) {
        const rateToUSD = code === "USD" ? 1 : rates[code] ? 1 / rates[code] : undefined;
        if (rateToUSD !== undefined) {
          await tx.exchangeRate.upsert({
            where: { currencyCode: code },
            update: {
              rateToUSD,
              name: info.name,
              symbol: info.symbol,
            },
            create: {
              currencyCode: code,
              name: info.name,
              symbol: info.symbol,
              rateToUSD,
            },
          });
        }
      }
    });

    return {
      success: true,
      date: todayStr,
      count: records.length,
      message: `Successfully synchronized ${records.length} currency rates for ${todayStr}`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[syncDailyRates error]:", msg);
    return {
      success: false,
      date: todayStr,
      count: 0,
      message: msg,
    };
  }
}

export const POPULAR_CURRENCIES_INFO: Record<string, { name: string; symbol: string }> = {
  USD: { name: "Đô la Mỹ", symbol: "$" },
  VND: { name: "Việt Nam Đồng", symbol: "₫" },
  EUR: { name: "Euro", symbol: "€" },
  JPY: { name: "Yên Nhật", symbol: "¥" },
  GBP: { name: "Bảng Anh", symbol: "£" },
  AUD: { name: "Đô la Úc", symbol: "A$" },
  CAD: { name: "Đô la Canada", symbol: "C$" },
  SGD: { name: "Đô la Singapore", symbol: "S$" },
  KRW: { name: "Won Hàn Quốc", symbol: "₩" },
  CNY: { name: "Nhân dân tệ", symbol: "¥" },
  THB: { name: "Baht Thái", symbol: "฿" },
};

export interface CheckSyncResult {
  synced: boolean;
  justSynced: boolean;
  date: string;
  count: number;
  message: string;
}

/**
 * Checks whether today's rates have already been synced into usd_rates_history.
 * If not present (or forced), executes syncDailyRates() to sync latest rates.
 */
export async function checkAndSyncRatesIfNeeded(force = false): Promise<CheckSyncResult> {
  const todayStr = new Date().toISOString().split("T")[0];

  if (!force) {
    const todayCount = await prisma.usdRateHistory.count({
      where: { date: todayStr },
    });

    if (todayCount > 0) {
      return {
        synced: true,
        justSynced: false,
        date: todayStr,
        count: todayCount,
        message: `Tỷ giá ngày ${todayStr} đã được đồng bộ trong cơ sở dữ liệu (${todayCount} đồng tiền).`,
      };
    }
  }

  // Need sync: call syncDailyRates()
  const syncRes = await syncDailyRates();
  return {
    synced: syncRes.success,
    justSynced: syncRes.success,
    date: syncRes.date,
    count: syncRes.count,
    message: syncRes.message,
  };
}

export interface LatestCurrencyRateItem {
  code: string;
  name: string;
  symbol: string;
  rateToUSD: number;   // 1 Unit = X USD (for converter logic)
  rateFromUSD: number; // 1 USD = X Unit (e.g. 1 USD = 25,964 VND)
}

export interface LatestRatesResponse {
  success: boolean;
  latestDate: string;
  syncedToday: boolean;
  justSynced: boolean;
  lastUpdated: string;
  popularCurrencies: LatestCurrencyRateItem[];
  allRates: Record<string, number>; // Currency code -> 1 USD = X Currency
  message?: string;
}

/**
 * Retrieves the latest currency rates from the database.
 * Automatically checks and syncs today's rates if not yet synced.
 */
export async function getLatestCurrencyRates(forceSync = false): Promise<LatestRatesResponse> {
  // 1. Check & Sync if needed
  const syncStatus = await checkAndSyncRatesIfNeeded(forceSync);

  const todayStr = new Date().toISOString().split("T")[0];

  // 2. Find the latest date available in usdRateHistory
  const latestRecord = await prisma.usdRateHistory.findFirst({
    orderBy: { date: "desc" },
    select: { date: true },
  });

  const latestDate = latestRecord?.date || todayStr;
  const syncedToday = latestDate === todayStr && syncStatus.synced;

  // 3. Fetch all rates for latestDate from usdRateHistory
  const records = await prisma.usdRateHistory.findMany({
    where: { date: latestDate },
    select: { currency: true, rate: true },
  });

  const allRates: Record<string, number> = { USD: 1 };
  records.forEach((r) => {
    allRates[r.currency] = Number(r.rate);
  });

  // 4. Build popular currencies array
  const popularCurrencies: LatestCurrencyRateItem[] = [];
  for (const [code, info] of Object.entries(POPULAR_CURRENCIES_INFO)) {
    if (code === "USD") {
      popularCurrencies.push({
        code: "USD",
        name: info.name,
        symbol: info.symbol,
        rateToUSD: 1,
        rateFromUSD: 1,
      });
    } else {
      const rateFromUSD = allRates[code] || 1;
      const rateToUSD = rateFromUSD > 0 ? Number((1 / rateFromUSD).toFixed(8)) : 1;
      popularCurrencies.push({
        code,
        name: info.name,
        symbol: info.symbol,
        rateToUSD,
        rateFromUSD,
      });
    }
  }

  // 5. Get last updated timestamp from ExchangeRate table or current time
  const sampleExchangeRate = await prisma.exchangeRate.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { updatedAt: true },
  });

  return {
    success: true,
    latestDate,
    syncedToday,
    justSynced: syncStatus.justSynced,
    lastUpdated: sampleExchangeRate?.updatedAt.toISOString() || new Date().toISOString(),
    popularCurrencies,
    allRates,
    message: syncStatus.message,
  };
}
