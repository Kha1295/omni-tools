"use client";

import * as React from "react";
import {
  calculateLoan,
  compareLoanMethods,
  LoanCalculationMethod,
  LoanResult,
  LoanComparisonResult,
} from "@/lib/math/loan";
import { getToolBySlug } from "@/config/tools.config";
import { ToolLayoutTemplate } from "@/components/tools/ToolLayoutTemplate";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  Landmark,
  Wallet,
  TrendingDown,
  Sparkles,
  Download,
  BarChart2,
  Table as TableIcon,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const toolMetadata = getToolBySlug("/finance/loan-calculator")!;

export default function LoanCalculatorPage() {
  const [principal, setPrincipal] = React.useState<number>(1000000000); // 1 Tỷ VND
  const [annualInterestRate, setAnnualInterestRate] = React.useState<number>(8.5); // 8.5%/năm
  const [termYears, setTermYears] = React.useState<number>(5); // 5 năm
  const [termType, setTermType] = React.useState<"years" | "months">("years");
  const [termMonthsInput, setTermMonthsInput] = React.useState<number>(60);
  const [method, setMethod] = React.useState<LoanCalculationMethod>("reducing_balance");
  const [gracePeriodMonths, setGracePeriodMonths] = React.useState<number>(0); // Ân hạn 0 tháng

  const totalMonths = React.useMemo(() => {
    return termType === "years" ? Math.max(1, termYears * 12) : Math.max(1, termMonthsInput);
  }, [termType, termYears, termMonthsInput]);

  // Main calculation result
  const loanResult: LoanResult = React.useMemo(() => {
    return calculateLoan({
      principal,
      annualInterestRate,
      termMonths: totalMonths,
      method,
      gracePeriodMonths,
    });
  }, [principal, annualInterestRate, totalMonths, method, gracePeriodMonths]);

  // Comparison between Reducing Balance vs Flat Rate
  const comparison: LoanComparisonResult = React.useMemo(() => {
    return compareLoanMethods(
      principal,
      annualInterestRate,
      totalMonths,
      gracePeriodMonths
    );
  }, [principal, annualInterestRate, totalMonths, gracePeriodMonths]);

  const handleReset = () => {
    setPrincipal(1000000000);
    setAnnualInterestRate(8.5);
    setTermYears(5);
    setTermType("years");
    setTermMonthsInput(60);
    setMethod("reducing_balance");
    setGracePeriodMonths(0);
  };

  const handleExportCSV = () => {
    const headers = "Kỳ (Tháng),Dư Nợ Đầu Kỳ,Tiền Gốc Trả,Tiền Lãi Trả,Tổng Thanh Toán,Dư Nợ Còn Lại,Trạng Thái\n";
    const rows = loanResult.schedule
      .map(
        (s) =>
          `${s.month},${s.startingBalance},${s.principalPayment},${s.interestPayment},${s.totalMonthlyPayment},${s.endingBalance},${s.isGracePeriod ? "Ân hạn gốc" : "Thường"}`
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + headers + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `lich_tra_no_vay_${totalMonths}thang_${method}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sample data for chart (Downsample if months > 60 for clean UI rendering)
  const chartData = React.useMemo(() => {
    return loanResult.schedule.map((item) => ({
      name: `Tháng ${item.month}`,
      month: item.month,
      "Tiền gốc": item.principalPayment,
      "Tiền lãi": item.interestPayment,
      "Tổng trả tháng": item.totalMonthlyPayment,
      "Dư nợ còn lại": item.endingBalance,
    }));
  }, [loanResult.schedule]);

  return (
    <ToolLayoutTemplate tool={toolMetadata} onReset={handleReset}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form Controls */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-border/80 shadow-md">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Landmark className="h-5 w-5 text-primary" />
                <span>Thông Số Khoản Vay</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Nhập chi tiết khoản vay để tính lịch trả nợ chuẩn ngân hàng
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 pt-5">
              {/* Principal Amount */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Số tiền vay</span>
                  <span className="text-primary font-bold">
                    {formatCurrency(principal)}
                  </span>
                </label>
                <Input
                  type="number"
                  min="10000000"
                  step="10000000"
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  suffix="VND"
                />
                <Slider
                  value={principal}
                  min={50000000}
                  max={10000000000}
                  step={50000000}
                  onChange={setPrincipal}
                  leftLabel="50 Tr ₫"
                  rightLabel="10 Tỷ ₫"
                />
              </div>

              {/* Annual Interest Rate */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Lãi suất vay (%/năm)</span>
                  <span className="text-primary font-bold">
                    {annualInterestRate}% / năm
                  </span>
                </label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  step="0.1"
                  value={annualInterestRate}
                  onChange={(e) => setAnnualInterestRate(Number(e.target.value))}
                  suffix="%"
                />
                <Slider
                  value={annualInterestRate}
                  min={3}
                  max={20}
                  step={0.1}
                  onChange={setAnnualInterestRate}
                  unit="%"
                />
              </div>

              {/* Loan Term */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Thời hạn vay ({totalMonths} tháng ~ {(totalMonths / 12).toFixed(1)} năm)
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setTermType("years")}
                      className={`text-[11px] px-2 py-0.5 rounded font-medium transition-all ${
                        termType === "years"
                          ? "bg-primary text-primary-foreground font-bold"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Năm
                    </button>
                    <button
                      type="button"
                      onClick={() => setTermType("months")}
                      className={`text-[11px] px-2 py-0.5 rounded font-medium transition-all ${
                        termType === "months"
                          ? "bg-primary text-primary-foreground font-bold"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Tháng
                    </button>
                  </div>
                </div>

                {termType === "years" ? (
                  <>
                    <Input
                      type="number"
                      min="1"
                      max="35"
                      value={termYears}
                      onChange={(e) => setTermYears(Number(e.target.value))}
                      suffix="năm"
                    />
                    <Slider
                      value={termYears}
                      min={1}
                      max={30}
                      step={1}
                      onChange={setTermYears}
                      unit=" năm"
                    />
                  </>
                ) : (
                  <>
                    <Input
                      type="number"
                      min="6"
                      max="420"
                      value={termMonthsInput}
                      onChange={(e) => setTermMonthsInput(Number(e.target.value))}
                      suffix="tháng"
                    />
                    <Slider
                      value={termMonthsInput}
                      min={6}
                      max={360}
                      step={6}
                      onChange={setTermMonthsInput}
                      unit=" tháng"
                    />
                  </>
                )}
              </div>

              {/* Calculation Method */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Phương thức tính lãi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod("reducing_balance")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      method === "reducing_balance"
                        ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                        : "border-border/80 bg-card hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <div className="text-xs font-bold">Dư nợ giảm dần</div>
                    <div className="text-[10px] opacity-80 mt-0.5">
                      Lãi tính trên nợ thực tế còn lại (Chuẩn ngân hàng)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("flat_rate")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      method === "flat_rate"
                        ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                        : "border-border/80 bg-card hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <div className="text-xs font-bold">Dư nợ gốc ban đầu</div>
                    <div className="text-[10px] opacity-80 mt-0.5">
                      Lãi tính cố định trên số tiền vay ban đầu
                    </div>
                  </button>
                </div>
              </div>

              {/* Grace Period (Ân hạn nợ gốc) */}
              <div className="space-y-2 p-3.5 rounded-xl bg-muted/40 border border-border/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Ân hạn nợ gốc (Grace Period)</span>
                  </label>
                  <span className="text-xs font-bold text-primary">
                    {gracePeriodMonths} tháng
                  </span>
                </div>
                <Slider
                  value={gracePeriodMonths}
                  min={0}
                  max={Math.min(36, totalMonths - 1)}
                  step={1}
                  onChange={setGracePeriodMonths}
                  unit=" tháng"
                />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {gracePeriodMonths > 0 ? (
                    <>
                      💡 Trong <strong>{gracePeriodMonths} tháng đầu</strong>, bạn chỉ phải trả tiền lãi (
                      {formatCurrency(loanResult.schedule[0]?.interestPayment || 0)}/tháng), chưa phải trả nợ gốc.
                    </>
                  ) : (
                    "Không ân hạn: Bắt đầu trả cả gốc và lãi ngay từ tháng thứ 1."
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Result Highlights, Comparison & Charts */}
        <div className="lg:col-span-7 space-y-6">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-border/80 bg-gradient-to-br from-card to-primary/5 shadow-sm">
              <CardContent className="p-5 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5 text-blue-500" />
                  Tiền Trả Tháng Đầu
                </span>
                <div className="text-lg sm:text-xl font-extrabold text-foreground truncate">
                  {formatCurrency(loanResult.firstMonthPayment)}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {loanResult.schedule[0]?.isGracePeriod
                    ? "Chỉ gồm tiền lãi (Ân hạn)"
                    : `Gốc ${formatCurrency(loanResult.schedule[0]?.principalPayment || 0)}`}
                </span>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-gradient-to-br from-card to-amber-500/5 shadow-sm">
              <CardContent className="p-5 space-y-1">
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <TrendingDown className="h-3.5 w-3.5" />
                  Tổng Tiền Lãi Phải Trả
                </span>
                <div className="text-lg sm:text-xl font-extrabold text-amber-600 dark:text-amber-400 truncate">
                  {formatCurrency(loanResult.totalInterest)}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {(loanResult.totalInterest / loanResult.principal * 100).toFixed(1)}% so với tiền gốc
                </span>
              </CardContent>
            </Card>

            <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-card to-primary/5 shadow-glow-sm">
              <CardContent className="p-5 space-y-1">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Tổng Gốc + Lãi Phải Trả
                </span>
                <div className="text-lg sm:text-xl font-black text-primary truncate">
                  {formatCurrency(loanResult.totalPayment)}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Trong suốt {totalMonths} tháng
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Callout: Reducing Balance vs Flat Rate */}
          <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-transparent shadow-sm">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-foreground">
                    So Sánh Tiết Kiệm: Dư Nợ Giảm Dần vs Dư Nợ Gốc
                  </span>
                </div>
                <Badge variant="success" className="text-xs font-bold">
                  Tiết kiệm {formatCurrency(comparison.interestDifference)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 text-xs pt-1">
                <div className="p-3 rounded-xl bg-background/80 border border-border/60 space-y-1">
                  <span className="text-muted-foreground font-semibold">Theo Dư Nợ Giảm Dần:</span>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    Lãi: {formatCurrency(comparison.reducing.totalInterest)}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Tổng trả: {formatCurrency(comparison.reducing.totalPayment)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-background/80 border border-border/60 space-y-1">
                  <span className="text-muted-foreground font-semibold">Theo Dư Nợ Gốc Ban Đầu:</span>
                  <div className="text-sm font-bold text-rose-600 dark:text-rose-400">
                    Lãi: {formatCurrency(comparison.flat.totalInterest)}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Tổng trả: {formatCurrency(comparison.flat.totalPayment)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Chart / Table Tabs */}
          <Card className="border-border/80 shadow-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between border-b border-border/40">
              <div>
                <CardTitle className="text-base font-bold">
                  Trực Quan Hóa Lịch Trả Nợ & Dư Nợ
                </CardTitle>
                <CardDescription className="text-xs">
                  Theo dõi số tiền trả từng tháng (gốc vs lãi) và biểu đồ dư nợ còn lại
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
              <Tabs defaultValue="cashflow">
                <TabsList className="mb-4">
                  <TabsTrigger
                    value="cashflow"
                    icon={<BarChart2 className="h-4 w-4" />}
                  >
                    Dòng Tiền Hàng Tháng
                  </TabsTrigger>
                  <TabsTrigger
                    value="balance"
                    icon={<TrendingDown className="h-4 w-4" />}
                  >
                    Dư Nợ Còn Lại
                  </TabsTrigger>
                  <TabsTrigger
                    value="table"
                    icon={<TableIcon className="h-4 w-4" />}
                  >
                    Bảng Lịch Trả Nợ
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Monthly Cashflow Bar Chart */}
                <TabsContent value="cashflow">
                  <div className="h-[320px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                          opacity={0.6}
                        />
                        <XAxis
                          dataKey="month"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                          tickFormatter={(val: number) => `T${val}`}
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
                        <Bar
                          dataKey="Tiền gốc"
                          stackId="a"
                          fill="#6366f1"
                          radius={[0, 0, 0, 0]}
                        />
                        <Bar
                          dataKey="Tiền lãi"
                          stackId="a"
                          fill="#f59e0b"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                {/* Tab 2: Loan Balance Area Chart */}
                <TabsContent value="balance">
                  <div className="h-[320px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorBalance"
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
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                          opacity={0.6}
                        />
                        <XAxis
                          dataKey="month"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                          tickFormatter={(val: number) => `T${val}`}
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
                        <Area
                          type="monotone"
                          dataKey="Dư nợ còn lại"
                          stroke="#6366f1"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorBalance)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                {/* Tab 3: Detailed Amortization Table */}
                <TabsContent value="table">
                  <div className="max-h-[340px] overflow-y-auto border border-border/80 rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/80 text-muted-foreground font-semibold sticky top-0 backdrop-blur-md">
                        <tr>
                          <th className="p-3">Kỳ (Tháng)</th>
                          <th className="p-3">Dư nợ đầu kỳ</th>
                          <th className="p-3">Tiền gốc trả</th>
                          <th className="p-3">Tiền lãi trả</th>
                          <th className="p-3">Tổng trả tháng</th>
                          <th className="p-3 text-right">Dư nợ còn lại</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {loanResult.schedule.map((row) => (
                          <tr
                            key={row.month}
                            className={`hover:bg-muted/30 transition-colors ${
                              row.isGracePeriod ? "bg-indigo-500/5" : ""
                            }`}
                          >
                            <td className="p-3 font-bold text-foreground flex items-center gap-1.5">
                              <span>Tháng {row.month}</span>
                              {row.isGracePeriod && (
                                <Badge variant="accent" className="text-[9px] px-1 py-0">
                                  Ân hạn
                                </Badge>
                              )}
                            </td>
                            <td className="p-3">{formatCurrency(row.startingBalance)}</td>
                            <td className="p-3 font-medium text-foreground">
                              {formatCurrency(row.principalPayment)}
                            </td>
                            <td className="p-3 text-amber-600 dark:text-amber-400 font-medium">
                              {formatCurrency(row.interestPayment)}
                            </td>
                            <td className="p-3 font-bold text-primary">
                              {formatCurrency(row.totalMonthlyPayment)}
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
