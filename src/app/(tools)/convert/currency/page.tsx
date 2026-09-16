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
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import {
  ArrowLeftRight,
  Coins,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Calendar,
  Loader2,
  LineChart as LineChartIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const toolMetadata = getToolBySlug("/convert/currency")!;

type TimeRange = "7d" | "30d" | "90d" | "1y" | "5y";

interface CurrencyHistoryResponse {
  success: boolean;
  pair: string;
  from: string;
  to: string;
  range: string;
  currentRate: number;
  highestRate: number;
  lowestRate: number;
  changePercent: number;
  dataPointsCount: number;
  chart: Array<{ date: string; rate: number }>;
}

export default function CurrencyConverterPage() {
  const [amount, setAmount] = React.useState<number>(100);
  const [fromCurrency, setFromCurrency] = React.useState<string>("USD");
  const [toCurrency, setToCurrency] = React.useState<string>("VND");
  const [range, setRange] = React.useState<TimeRange>("30d");

  const [historyData, setHistoryData] = React.useState<CurrencyHistoryResponse | null>(null);
  const [loadingHistory, setLoadingHistory] = React.useState<boolean>(false);

  // Fetch real-time rate & historical time-series
  React.useEffect(() => {
    let isCancelled = false;
    setLoadingHistory(true);

    fetch(`/api/currency/history?from=${fromCurrency}&to=${toCurrency}&range=${range}`)
      .then((res) => res.json())
      .then((data: CurrencyHistoryResponse) => {
        if (!isCancelled && data.success) {
          setHistoryData(data);
        }
      })
      .catch((err) => {
        console.error("Failed to load currency historical data:", err);
      })
      .finally(() => {
        if (!isCancelled) {
          setLoadingHistory(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [fromCurrency, toCurrency, range]);

  // Determine active rate: Use live DB/API rate if available, else static fallback
  const activeRate = React.useMemo(() => {
    if (historyData?.currentRate && historyData.currentRate > 0) {
      return historyData.currentRate;
    }
    return convertCurrency(1, fromCurrency, toCurrency).rate;
  }, [historyData, fromCurrency, toCurrency]);

  // Live conversion result
  const result = React.useMemo(() => {
    return Number((amount * activeRate).toFixed(4));
  }, [amount, activeRate]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleReset = () => {
    setAmount(100);
    setFromCurrency("USD");
    setToCurrency("VND");
    setRange("30d");
  };

  const currencyOptions = POPULAR_CURRENCIES.map((c) => ({
    value: c.code,
    label: `${c.code} - ${c.name} (${c.symbol})`,
  }));

  const fromInfo = POPULAR_CURRENCIES.find((c) => c.code === fromCurrency);
  const toInfo = POPULAR_CURRENCIES.find((c) => c.code === toCurrency);

  // Common benchmark amounts
  const benchmarkAmounts = [1, 5, 10, 50, 100, 500, 1000];

  const handleShareData = React.useCallback(() => {
    return {
      title: `Quy đổi ${formatNumber(amount)} ${fromCurrency} sang ${toCurrency}`,
      inputData: {
        amount,
        fromCurrency,
        toCurrency,
        range,
      },
      resultData: {
        result,
        rate: activeRate,
        changePercent: historyData?.changePercent ?? 0,
      },
    };
  }, [amount, fromCurrency, toCurrency, range, result, activeRate, historyData]);

  // Format date for chart X-Axis
  const formatXAxis = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length < 3) return dateStr;
    const [, m, d] = parts;
    if (range === "1y" || range === "5y") {
      return `${m}/${parts[0].slice(2)}`;
    }
    return `${d}/${m}`;
  };

  // Y-Axis domain with padding
  const yDomain = React.useMemo(() => {
    if (!historyData || historyData.chart.length === 0) return ["auto", "auto"];
    const rates = historyData.chart.map((c) => c.rate);
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const diff = max - min;
    const padding = diff > 0 ? diff * 0.08 : min * 0.02;
    return [Number((min - padding).toFixed(4)), Number((max + padding).toFixed(4))];
  }, [historyData]);

  const rangeButtons: Array<{ id: TimeRange; label: string }> = [
    { id: "7d", label: "7 Ngày" },
    { id: "30d", label: "30 Ngày" },
    { id: "90d", label: "3 Tháng" },
    { id: "1y", label: "1 Năm" },
    { id: "5y", label: "5 Năm" },
  ];

  return (
    <ToolLayoutTemplate
      tool={toolMetadata}
      onReset={handleReset}
      onShareData={handleShareData}
    >
      <div className="space-y-8">
        {/* Top Two-Column Conversion & Benchmark Row */}
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
                  Dữ liệu tỷ giá thời gian thực cập nhật từ hệ thống liên ngân hàng quốc tế
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
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      Kết Quả Quy Đổi Trực Tiếp
                    </span>
                    {historyData && (
                      <Badge
                        variant={historyData.changePercent >= 0 ? "success" : "destructive"}
                        className="gap-1 text-[11px]"
                      >
                        {historyData.changePercent >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>
                          {historyData.changePercent >= 0 ? "+" : ""}
                          {historyData.changePercent}% ({range})
                        </span>
                      </Badge>
                    )}
                  </div>

                  <div className="text-2xl sm:text-3xl font-black text-primary truncate">
                    {formatNumber(result, 4)} {toInfo?.symbol} ({toCurrency})
                  </div>

                  <div className="text-xs text-muted-foreground pt-1 flex items-center gap-2">
                    <span>Tỷ giá áp dụng:</span>
                    <span className="font-semibold text-foreground">
                      1 {fromCurrency} = {formatNumber(activeRate, 6)} {toCurrency}
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
                  Bấm vào hàng bất kỳ để gán nhanh giá trị vào ô tính
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
                        const convertedValue = Number((amt * activeRate).toFixed(2));
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
                              {formatNumber(convertedValue, 2)} {toInfo?.symbol}
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

        {/* Bottom Full-Width Section: Historical Exchange Rate Chart */}
        <Card className="border-border/80 shadow-md overflow-hidden">
          <CardHeader className="p-6 pb-4 border-b border-border/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <LineChartIcon className="h-5 w-5 text-indigo-500" />
                  <span>
                    Biểu Đồ Lịch Sử Tỷ Giá {fromCurrency}/{toCurrency}
                  </span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Dữ liệu chuỗi thời gian dựa trên đồng gốc USD tiêu chuẩn quốc tế
                </CardDescription>
              </div>

              {/* Range Selector Buttons */}
              <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl self-start sm:self-center">
                {rangeButtons.map((btn) => (
                  <Button
                    key={btn.id}
                    type="button"
                    size="sm"
                    variant={range === btn.id ? "default" : "ghost"}
                    onClick={() => setRange(btn.id)}
                    className="h-7 px-2.5 text-xs font-semibold rounded-lg"
                  >
                    {btn.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Quick Stat Badges */}
            {historyData && (
              <div className="flex flex-wrap items-center gap-3 pt-3 text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span>Mới nhất:</span>
                  <span className="font-bold text-foreground">
                    {formatNumber(historyData.currentRate, 4)}
                  </span>
                </div>
                <div className="h-3 w-px bg-border" />
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span>Cao nhất:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatNumber(historyData.highestRate, 4)}
                  </span>
                </div>
                <div className="h-3 w-px bg-border" />
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span>Thấp nhất:</span>
                  <span className="font-bold text-rose-500">
                    {formatNumber(historyData.lowestRate, 4)}
                  </span>
                </div>
                <div className="h-3 w-px bg-border" />
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{historyData.dataPointsCount} mốc giao dịch</span>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            {loadingHistory && !historyData ? (
              <div className="h-[340px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs">Đang tải chuỗi dữ liệu tỷ giá lịch sử...</p>
              </div>
            ) : historyData && historyData.chart.length > 0 ? (
              <div className="h-[340px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={historyData.chart}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="currencyRateGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      opacity={0.6}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatXAxis}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      minTickGap={24}
                    />
                    <YAxis
                      domain={yDomain}
                      tickFormatter={(val: number) => formatNumber(val, 2)}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={65}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "12px",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                        fontSize: "12px",
                      }}
                      formatter={(val: number | string | readonly (number | string)[] | undefined) => [
                        `1 ${fromCurrency} = ${formatNumber(Number(val) || 0, 4)} ${toCurrency}`,
                        "Tỷ giá",
                      ]}
                      labelFormatter={(label) => `Ngày: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="rate"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fill="url(#currencyRateGradient)"
                      isAnimationActive={true}
                      animationDuration={700}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[340px] flex flex-col items-center justify-center text-center gap-2 text-muted-foreground">
                <Coins className="h-8 w-8 text-muted-foreground/60" />
                <p className="text-sm">Không có dữ liệu lịch sử cho cặp tiền này.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ToolLayoutTemplate>
  );
}
