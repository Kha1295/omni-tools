"use client";

import * as React from "react";
import {
  calculateCompoundInterest,
  CompoundInterestResult,
} from "@/lib/math/interest";
import { getToolBySlug } from "@/config/tools.config";
import { ToolLayoutTemplate } from "@/components/tools/ToolLayoutTemplate";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  Wallet,
  PiggyBank,
  Download,
  Sparkles,
  BarChart2,
  Table as TableIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const toolMetadata = getToolBySlug("/finance/interest-rate")!;

export default function InterestRatePage() {
  const [initialPrincipal, setInitialPrincipal] = React.useState<number>(100000000); // 100M VND
  const [annualInterestRate, setAnnualInterestRate] = React.useState<number>(7.5); // 7.5%
  const [durationYears, setDurationYears] = React.useState<number>(10); // 10 years
  const [periodicContribution, setPeriodicContribution] = React.useState<number>(2000000); // 2M / month
  const [compoundFrequency, setCompoundFrequency] = React.useState<
    "monthly" | "quarterly" | "annually"
  >("monthly");
  const [contributionFrequency] = React.useState<"monthly" | "annually">("monthly");

  // Calculate realtime result
  const result: CompoundInterestResult = React.useMemo(() => {
    return calculateCompoundInterest({
      initialPrincipal,
      annualInterestRate,
      durationYears,
      periodicContribution,
      compoundFrequency,
      contributionFrequency,
    });
  }, [
    initialPrincipal,
    annualInterestRate,
    durationYears,
    periodicContribution,
    compoundFrequency,
    contributionFrequency,
  ]);

  const handleReset = () => {
    setInitialPrincipal(100000000);
    setAnnualInterestRate(7.5);
    setDurationYears(10);
    setPeriodicContribution(2000000);
    setCompoundFrequency("monthly");
  };

  const handleExportCSV = () => {
    const headers = "Năm,Tiền Gốc Đã Nộp,Tiền Lãi Tích Lũy,Tổng Số Dư\n";
    const rows = result.breakdown
      .map(
        (b) =>
          `${b.year},${b.totalDeposit},${b.totalInterest},${b.endingBalance}`
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + headers + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `lai_kep_omni_tools_${durationYears}nam.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Prepare chart data
  const chartData = result.breakdown.map((item) => ({
    name: `Năm ${item.year}`,
    "Tiền gốc": item.totalDeposit,
    "Tiền lãi": item.totalInterest,
    "Tổng tài sản": item.endingBalance,
  }));

  const profitRatio =
    result.totalPrincipal > 0
      ? ((result.totalInterest / result.totalPrincipal) * 100).toFixed(1)
      : "0";

  return (
    <ToolLayoutTemplate tool={toolMetadata} onReset={handleReset}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form Controls */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-border/80 shadow-md">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-primary" />
                <span>Thông Số Tiết Kiệm & Đầu Tư</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Nhập số tiền và thời gian để tính toán mức sinh lời
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 pt-5">
              {/* Initial Principal */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Số tiền gốc ban đầu</span>
                  <span className="text-primary font-bold">
                    {formatCurrency(initialPrincipal)}
                  </span>
                </label>
                <Input
                  type="number"
                  min="0"
                  step="1000000"
                  value={initialPrincipal}
                  onChange={(e) => setInitialPrincipal(Number(e.target.value))}
                  suffix="VND"
                />
                <Slider
                  value={initialPrincipal}
                  min={0}
                  max={1000000000}
                  step={5000000}
                  onChange={setInitialPrincipal}
                  leftLabel="0 ₫"
                  rightLabel="1 Tỷ ₫"
                />
              </div>

              {/* Annual Interest Rate */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Lãi suất năm (%)</span>
                  <span className="text-primary font-bold">
                    {annualInterestRate}% / năm
                  </span>
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={annualInterestRate}
                  onChange={(e) => setAnnualInterestRate(Number(e.target.value))}
                  suffix="%"
                />
                <Slider
                  value={annualInterestRate}
                  min={1}
                  max={25}
                  step={0.1}
                  onChange={setAnnualInterestRate}
                  unit="%"
                />
              </div>

              {/* Duration Years */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Thời gian gửi (năm)</span>
                  <span className="text-primary font-bold">
                    {durationYears} năm
                  </span>
                </label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={durationYears}
                  onChange={(e) => setDurationYears(Number(e.target.value))}
                  suffix="năm"
                />
                <Slider
                  value={durationYears}
                  min={1}
                  max={40}
                  step={1}
                  onChange={setDurationYears}
                  unit=" năm"
                />
              </div>

              {/* Periodic Contribution */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Gửi thêm định kỳ (mỗi tháng)</span>
                  <span className="text-primary font-bold">
                    {formatCurrency(periodicContribution)}
                  </span>
                </label>
                <Input
                  type="number"
                  min="0"
                  step="500000"
                  value={periodicContribution}
                  onChange={(e) => setPeriodicContribution(Number(e.target.value))}
                  suffix="VND"
                />
                <Slider
                  value={periodicContribution}
                  min={0}
                  max={50000000}
                  step={500000}
                  onChange={setPeriodicContribution}
                  leftLabel="0 ₫"
                  rightLabel="50 Tr ₫"
                />
              </div>

              {/* Compound Frequency */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Tần suất ghép lãi
                </label>
                <Select
                  value={compoundFrequency}
                  onChange={(e) =>
                    setCompoundFrequency(
                      e.target.value as "monthly" | "quarterly" | "annually"
                    )
                  }
                  options={[
                    { value: "monthly", label: "Ghép lãi hàng tháng (Chuẩn ngân hàng)" },
                    { value: "quarterly", label: "Ghép lãi hàng quý (3 tháng/lần)" },
                    { value: "annually", label: "Ghép lãi hàng năm" },
                  ]}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Result Summary Cards & Visual Charts */}
        <div className="lg:col-span-7 space-y-6">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-border/80 bg-gradient-to-br from-card to-primary/5 shadow-sm">
              <CardContent className="p-5 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5 text-blue-500" />
                  Tổng Tiền Gốc
                </span>
                <div className="text-lg sm:text-xl font-extrabold text-foreground truncate">
                  {formatCurrency(result.totalPrincipal)}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Gốc ban đầu + Tiền tích lũy
                </span>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-gradient-to-br from-card to-emerald-500/5 shadow-sm">
              <CardContent className="p-5 space-y-1">
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Tổng Tiền Lãi
                </span>
                <div className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 truncate">
                  +{formatCurrency(result.totalInterest)}
                </div>
                <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-semibold">
                  Tăng trưởng +{profitRatio}%
                </span>
              </CardContent>
            </Card>

            <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-card to-primary/5 shadow-glow-sm">
              <CardContent className="p-5 space-y-1">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Số Dư Cuối Kỳ
                </span>
                <div className="text-lg sm:text-2xl font-black text-primary truncate">
                  {formatCurrency(result.finalBalance)}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Sau {durationYears} năm gửi
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Chart / Table Tabs */}
          <Card className="border-border/80 shadow-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between border-b border-border/40">
              <div>
                <CardTitle className="text-base font-bold">
                  Trực Quan Hóa Tăng Trưởng Lãi Kép
                </CardTitle>
                <CardDescription className="text-xs">
                  Theo dõi sự gia tăng theo hàm số mũ của tiền lãi theo từng năm
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="gap-1.5 text-xs rounded-xl hidden sm:inline-flex"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Xuất CSV</span>
              </Button>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              <Tabs defaultValue="chart">
                <TabsList className="mb-4">
                  <TabsTrigger
                    value="chart"
                    icon={<BarChart2 className="h-4 w-4" />}
                  >
                    Biểu Đồ
                  </TabsTrigger>
                  <TabsTrigger
                    value="table"
                    icon={<TableIcon className="h-4 w-4" />}
                  >
                    Lịch Phân Kỳ
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Area Chart */}
                <TabsContent value="chart">
                  <div className="h-[320px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorPrincipal"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#6366f1"
                              stopOpacity={0.4}
                            />
                            <stop
                              offset="95%"
                              stopColor="#6366f1"
                              stopOpacity={0.0}
                            />
                          </linearGradient>
                          <linearGradient
                            id="colorInterest"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#10b981"
                              stopOpacity={0.5}
                            />
                            <stop
                              offset="95%"
                              stopColor="#10b981"
                              stopOpacity={0.05}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                          opacity={0.6}
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        />
                        <YAxis
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                          tickFormatter={(val: number) =>
                            val >= 1000000000
                              ? `${(val / 1000000000).toFixed(1)}T`
                              : `${(val / 1000000).toFixed(0)}M`
                          }
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "12px",
                            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                            fontSize: "12px",
                          }}
                          formatter={(value: number | string | readonly (number | string)[] | undefined) => [
                            formatCurrency(typeof value === "number" || typeof value === "string" ? value : 0),
                            "",
                          ]}
                        />
                        <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                        <Area
                          type="monotone"
                          dataKey="Tiền gốc"
                          stroke="#6366f1"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorPrincipal)"
                        />
                        <Area
                          type="monotone"
                          dataKey="Tiền lãi"
                          stroke="#10b981"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorInterest)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                {/* Tab 2: Table Breakdown */}
                <TabsContent value="table">
                  <div className="max-h-[320px] overflow-y-auto border border-border/80 rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/80 text-muted-foreground font-semibold sticky top-0 backdrop-blur-md">
                        <tr>
                          <th className="p-3">Năm</th>
                          <th className="p-3">Gốc tích lũy</th>
                          <th className="p-3">Lãi năm đó</th>
                          <th className="p-3">Lãi tích lũy</th>
                          <th className="p-3 text-right">Tổng số dư</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {result.breakdown.map((row) => (
                          <tr
                            key={row.year}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            <td className="p-3 font-bold text-foreground">
                              Năm {row.year}
                            </td>
                            <td className="p-3">{formatCurrency(row.totalDeposit)}</td>
                            <td className="p-3 text-emerald-600 dark:text-emerald-400 font-medium">
                              +{formatCurrency(row.yearlyInterest)}
                            </td>
                            <td className="p-3 text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(row.totalInterest)}
                            </td>
                            <td className="p-3 text-right font-extrabold text-foreground">
                              {formatCurrency(row.endingBalance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </ToolLayoutTemplate>
  );
}
