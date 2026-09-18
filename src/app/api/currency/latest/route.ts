import { NextRequest, NextResponse } from "next/server";
import { getLatestCurrencyRates } from "@/lib/services/currencySync";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true" || searchParams.get("force") === "1";

    const result = await getLatestCurrencyRates(force);

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get latest currency rates";
    console.error("[GET /api/currency/latest error]:", error);
    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}
