"use client";

import * as React from 'react';
import { convertCurrency, POPULAR_CURRENCIES } from '@/lib/math/converter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface SharedVisualizerProps {
  inputData: Record<string, unknown>;
  resultData: Record<string, unknown>;
}

const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);
const str = (v: unknown): string => (typeof v === 'string' ? v : String(v ?? ''));

const BENCHMARK_AMOUNTS = [1, 5, 10, 50, 100, 500, 1000];

export function SharedCurrencyVisualizer({ inputData, resultData }: SharedVisualizerProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = resultData; // Just to use resultData and satisfy the linter if needed
  
  const amount = num(inputData.amount);
  const fromCurrency = str(inputData.fromCurrency);
  const toCurrency = str(inputData.toCurrency);

  const reconverted = React.useMemo(() => {
    return convertCurrency(amount, fromCurrency, toCurrency);
  }, [amount, fromCurrency, toCurrency]);

  const fromInfo = POPULAR_CURRENCIES.find(c => c.code === fromCurrency);
  const toInfo = POPULAR_CURRENCIES.find(c => c.code === toCurrency);

  const benchmarks = React.useMemo(() => {
    return BENCHMARK_AMOUNTS.map(amt => ({
      amount: amt,
      converted: convertCurrency(amt, fromCurrency, toCurrency)
    }));
  }, [fromCurrency, toCurrency]);

  return (
    <div className="space-y-6">
      {/* Input Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Số tiền nguồn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(amount)} {fromCurrency}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tỷ giá áp dụng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-500">
              1 {fromCurrency} = {formatNumber(reconverted.rate)} {toCurrency}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quy đổi thành</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatNumber(reconverted.result)} {toCurrency}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Result Banner */}
      <Card className="bg-gradient-to-br from-primary/10 via-card to-primary/5 border-primary/20">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            <span>Kết Quả Quy Đổi</span>
          </div>
          <div className="text-4xl md:text-5xl font-extrabold tracking-tight">
            {formatNumber(reconverted.result, 4)} {toInfo?.symbol} <span className="text-muted-foreground text-2xl md:text-3xl font-medium">({toCurrency})</span>
          </div>
          <p className="text-muted-foreground">
            Tỷ giá tham chiếu: 1 {fromCurrency} = {formatNumber(reconverted.rate, 6)} {toCurrency}
          </p>
        </CardContent>
      </Card>

      {/* Quick Reference Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bảng Quy Đổi Nhanh ({fromCurrency} sang {toCurrency})</CardTitle>
          <CardDescription>Các mốc tiền tệ thông dụng để tra cứu nhanh</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/60 text-muted-foreground font-semibold">
                <tr>
                  <th className="p-2.5">{fromCurrency}</th>
                  <th className="p-2.5">{toCurrency}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {benchmarks.map((b, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="p-2.5">
                      {formatNumber(b.amount)} {fromInfo?.symbol}
                    </td>
                    <td className="p-2.5 text-primary font-extrabold">
                      {formatNumber(b.converted.result, 2)} {toInfo?.symbol}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
