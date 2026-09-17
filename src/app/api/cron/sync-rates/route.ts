import { NextResponse } from "next/server";
import { syncDailyRates } from "@/lib/services/currencySync";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await syncDailyRates();
  return NextResponse.json(result, {
    status: result.success ? 200 : 500,
  });
}

export async function POST() {
  const result = await syncDailyRates();
  return NextResponse.json(result, {
    status: result.success ? 200 : 500,
  });
}

