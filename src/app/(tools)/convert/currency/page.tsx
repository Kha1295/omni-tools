"use client";

import * as React from "react";
import {
  convertCurrency,
  POPULAR_CURRENCIES,
} from "@/lib/math/converter";
import { getToolBySlug } from "@/config/tools.config";
import { ToolLayoutTemplate } from "@/components/tools/ToolLayoutTemplate";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatNumber } from "@/lib/utils";
import { ArrowLeftRight, Coins, Sparkles } from "lucide-react";

const toolMetadata = getToolBySlug("/convert/currency")!;

export default function CurrencyConverterPage() {
  const [amount, setAmount] = React.useState<number>(100);
  const [fromCurrency, setFromCurrency] = React.useState<string>("USD");
  const [toCurrency, setToCurrency] = React.useState<string>("VND");

  const { result, rate } = React.useMemo(() => {
    return convertCurrency(amount, fromCurrency, toCurrency);
  }, [amount, fromCurrency, toCurrency]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleReset = () => {
    setAmount(100);
    setFromCurrency("USD");
    setToCurrency("VND");
  };

  const currencyOptions = POPULAR_CURRENCIES.map((c) => ({
    value: c.code,
    label: `${c.code} - ${c.name} (${c.symbol})`,
  }));

  const fromInfo = POPULAR_CURRENCIES.find((c) => c.code === fromCurrency);
  const toInfo = POPULAR_CURRENCIES.find((c) => c.code === toCurrency);

  // Common benchmark amounts
  const benchmarkAmounts = [1, 5, 10, 50, 100, 500, 1000];

  return (
    <ToolLayoutTemplate tool={toolMetadata} onReset={handleReset}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Converter Card */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-border/80 shadow-md">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                <span>Quy Đổi Tỷ Giá Hai Chiều</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Tính toán chính xác theo thời gian thực không sai số
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Số tiền cần đổi
                </label>
                <Input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="text-lg font-bold"
                  suffix={fromCurrency}
                />
              </div>

              {/* Currency Selector Grid with Swap button */}
              <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">
                <div className="sm:col-span-5 space-y-2">
                  <label className="text-xs font-semibold text-foreground">
                    Từ loại tiền
                  </label>
                  <Select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                    options={currencyOptions}
                  />
                </div>

                <div className="sm:col-span-1 flex justify-center pt-5 sm:pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleSwap}
                    className="rounded-full shadow-sm hover:scale-110 hover:border-primary transition-all"
                    title="Đảo chiều tiền tệ"
                  >
                    <ArrowLeftRight className="h-4 w-4 text-primary" />
                  </Button>
                </div>

                <div className="sm:col-span-5 space-y-2">
                  <label className="text-xs font-semibold text-foreground">
                    Sang loại tiền
                  </label>
                  <Select
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}
                    options={currencyOptions}
                  />
                </div>
              </div>

              {/* Conversion Result Banner */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-primary/5 border border-primary/20 space-y-2">
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Kết Quả Quy Đổi
                </span>
                <div className="text-2xl sm:text-3xl font-black text-primary truncate">
                  {formatNumber(result, 4)} {toInfo?.symbol} ({toCurrency})
                </div>
                <div className="text-xs text-muted-foreground pt-1 flex items-center gap-2">
                  <span>Tỷ giá tham chiếu:</span>
                  <span className="font-semibold text-foreground">
                    1 {fromCurrency} = {formatNumber(rate, 6)} {toCurrency}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Quick Reference Matrix */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-border/80 shadow-md">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-bold">
                Bảng Quy Đổi Nhanh ({fromCurrency} sang {toCurrency})
              </CardTitle>
              <CardDescription className="text-xs">
                Các mốc tiền tệ thông dụng để tra cứu nhanh
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-2.5">{fromCurrency}</th>
                      <th className="p-2.5 text-right">{toCurrency}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {benchmarkAmounts.map((amt) => {
                      const converted = convertCurrency(amt, fromCurrency, toCurrency);
                      return (
                        <tr
                          key={amt}
                          className="hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => setAmount(amt)}
                        >
                          <td className="p-2.5 font-bold text-foreground">
                            {formatNumber(amt)} {fromInfo?.symbol}
                          </td>
                          <td className="p-2.5 text-right font-extrabold text-primary">
                            {formatNumber(converted.result, 2)} {toInfo?.symbol}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ToolLayoutTemplate>
  );
}
