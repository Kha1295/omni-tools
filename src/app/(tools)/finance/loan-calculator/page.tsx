"use client";

import * as React from "react";
import {
  calculateLoan,
  compareLoanMethods,
  findLoanInterestRate,
  LoanCalculationMethod,
  LoanResult,
  LoanComparisonResult,
  ReverseLoanResult,
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
  Search,
  Calculator,
  AlertTriangle,
  Percent,
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
  // Main mode: "forward" (Tính lịch trả nợ) vs "reverse" (Tìm lãi suất)
  const [calcMode, setCalcMode] = React.useState<"forward" | "reverse">("forward");

  // State for Forward Mode (Lập lịch trả nợ)
  const [principal, setPrincipal] = React.useState<number>(1000000000); // 1 Tỷ VND
  const [annualInterestRate, setAnnualInterestRate] = React.useState<number>(8.5); // 8.5%/năm
  const [termYears, setTermYears] = React.useState<number>(5); // 5 năm
  const [termType, setTermType] = React.useState<"years" | "months">("years");
  const [termMonthsInput, setTermMonthsInput] = React.useState<number>(60);
  const [method, setMethod] = React.useState<LoanCalculationMethod>("reducing_balance");
  const [gracePeriodMonths, setGracePeriodMonths] = React.useState<number>(0);

  // State for Reverse Mode (Tìm lãi suất)
  const [revPrincipal, setRevPrincipal] = React.useState<number>(50000000); // 50M VND (ví dụ vay tiêu dùng/trả góp)
  const [revTermMonths, setRevTermMonths] = React.useState<number>(12); // 12 tháng
  const [revInputType, setRevInputType] = React.useState<"monthly" | "total">("monthly");
  const [revMonthlyPayment, setRevMonthlyPayment] = React.useState<number>(4600000); // 4.6M/tháng
  const [revTotalPayment, setRevTotalPayment] = React.useState<number>(55200000); // 55.2M tổng

  const totalMonths = React.useMemo(() => {
    return termType === "years" ? Math.max(1, termYears * 12) : Math.max(1, termMonthsInput);
  }, [termType, termYears, termMonthsInput]);

  // Forward calculation result
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

  // Reverse calculation result (Tìm lãi suất)
  const reverseResult: ReverseLoanResult = React.useMemo(() => {
    return findLoanInterestRate({
      principal: revPrincipal,
      termMonths: revTermMonths,
      ...(revInputType === "monthly"
        ? { monthlyPayment: revMonthlyPayment }
        : { totalPayment: revTotalPayment }),
    });
  }, [revPrincipal, revTermMonths, revInputType, revMonthlyPayment, revTotalPayment]);

  const handleReset = () => {
    if (calcMode === "forward") {
      setPrincipal(1000000000);
      setAnnualInterestRate(8.5);
      setTermYears(5);
      setTermType("years");
      setTermMonthsInput(60);
      setMethod("reducing_balance");
      setGracePeriodMonths(0);
    } else {
      setRevPrincipal(50000000);
      setRevTermMonths(12);
      setRevInputType("monthly");
      setRevMonthlyPayment(4600000);
      setRevTotalPayment(55200000);
    }
  };

  const handleExportCSV = () => {
    const currentSchedule = calcMode === "forward" ? loanResult.schedule : reverseResult.schedule;
    const headers = "Kỳ (Tháng),Dư Nợ Đầu Kỳ,Tiền Gốc Trả,Tiền Lãi Trả,Tổng Thanh Toán,Dư Nợ Còn Lại,Trạng Thái\n";
    const rows = currentSchedule
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
    link.setAttribute("download", `lich_tra_no_omni_tools_${calcMode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Chart data
  const chartData = React.useMemo(() => {
    const schedule = calcMode === "forward" ? loanResult.schedule : reverseResult.schedule;
    return schedule.map((item) => ({
      name: `Tháng ${item.month}`,
      month: item.month,
      "Tiền gốc": item.principalPayment,
      "Tiền lãi": item.interestPayment,
      "Tổng trả tháng": item.totalMonthlyPayment,
      "Dư nợ còn lại": item.endingBalance,
    }));
  }, [calcMode, loanResult.schedule, reverseResult.schedule]);

  return (
    <ToolLayoutTemplate tool={toolMetadata} onReset={handleReset}>
      <div className="space-y-6">
        {/* Top Feature Mode Switcher */}
        <div className="flex items-center justify-center">
          <div className="inline-flex p-1.5 bg-muted/80 backdrop-blur-md rounded-2xl border border-border shadow-sm">
            <button
              type="button"
              onClick={() => setCalcMode("forward")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                calcMode === "forward"
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Calculator className="h-4 w-4" />
              <span>1. Tính Lịch Trả Nợ & Tiền Lãi</span>
            </button>
            <button
              type="button"
              onClick={() => setCalcMode("reverse")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                calcMode === "reverse"
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Search className="h-4 w-4" />
              <span>2. Tìm Lãi Suất Thực Tế (Từ Số Tiền Trả)</span>
            </button>
          </div>
        </div>

        {/* MODE 1: FORWARD (LẬP LỊCH TRẢ NỢ) */}
        {calcMode === "forward" ? (
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

              {/* Comparison Callout */}
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

                  <div className="grid grid-cols-2 gap-4 text-xs pt-1">
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

              {/* Charts & Table Tabs */}
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
        ) : (
          /* MODE 2: REVERSE SOLVER (TÌM LÃI SUẤT TỪ SỐ TIỀN TRẢ) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            {/* Left Column: Inputs */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="border-border/80 shadow-md">
                <CardHeader className="pb-4 border-b border-border/40">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary" />
                    <span>Tham Số Tìm Lãi Suất</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Nhập số tiền vay, thời hạn và số tiền phải trả để tìm lãi suất thực tế
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5 pt-5">
                  {/* Total Principal */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                      <span>1. Tổng tiền vay (Gốc ban đầu)</span>
                      <span className="text-primary font-bold">
                        {formatCurrency(revPrincipal)}
                      </span>
                    </label>
                    <Input
                      type="number"
                      min="1000000"
                      step="1000000"
                      value={revPrincipal}
                      onChange={(e) => setRevPrincipal(Number(e.target.value))}
                      suffix="VND"
                    />
                    <Slider
                      value={revPrincipal}
                      min={5000000}
                      max={1000000000}
                      step={5000000}
                      onChange={setRevPrincipal}
                      leftLabel="5 Tr ₫"
                      rightLabel="1 Tỷ ₫"
                    />
                  </div>

                  {/* Term Months */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                      <span>2. Số tháng trả ({revTermMonths} tháng ~ {(revTermMonths / 12).toFixed(1)} năm)</span>
                      <span className="text-primary font-bold">
                        {revTermMonths} tháng
                      </span>
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="120"
                      value={revTermMonths}
                      onChange={(e) => setRevTermMonths(Math.max(1, Number(e.target.value)))}
                      suffix="tháng"
                    />
                    <Slider
                      value={revTermMonths}
                      min={3}
                      max={60}
                      step={1}
                      onChange={setRevTermMonths}
                      unit=" tháng"
                    />
                  </div>

                  {/* Input Type Selector: Monthly Payment vs Total Payment */}
                  <div className="space-y-3 pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-foreground">
                        3. Chọn tham số thanh toán
                      </label>
                      <div className="flex items-center gap-1 p-0.5 bg-muted rounded-lg text-[11px]">
                        <button
                          type="button"
                          onClick={() => setRevInputType("monthly")}
                          className={`px-2 py-1 rounded font-semibold transition-all ${
                            revInputType === "monthly"
                              ? "bg-card text-primary shadow-sm font-bold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Số tiền / tháng
                        </button>
                        <button
                          type="button"
                          onClick={() => setRevInputType("total")}
                          className={`px-2 py-1 rounded font-semibold transition-all ${
                            revInputType === "total"
                              ? "bg-card text-primary shadow-sm font-bold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Tổng gốc + lãi
                        </button>
                      </div>
                    </div>

                    {revInputType === "monthly" ? (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                          <span>Số tiền phải trả mỗi tháng</span>
                          <span className="text-primary font-bold">
                            {formatCurrency(revMonthlyPayment)}
                          </span>
                        </label>
                        <Input
                          type="number"
                          min="100000"
                          step="100000"
                          value={revMonthlyPayment}
                          onChange={(e) => setRevMonthlyPayment(Number(e.target.value))}
                          suffix="VND / tháng"
                        />
                        <span className="text-[11px] text-muted-foreground block">
                          Tương đương tổng thanh toán:{" "}
                          <strong className="text-foreground">
                            {formatCurrency(revMonthlyPayment * revTermMonths)}
                          </strong>
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                          <span>Tổng số tiền gốc + lãi (Total)</span>
                          <span className="text-primary font-bold">
                            {formatCurrency(revTotalPayment)}
                          </span>
                        </label>
                        <Input
                          type="number"
                          min={revPrincipal}
                          step="500000"
                          value={revTotalPayment}
                          onChange={(e) => setRevTotalPayment(Number(e.target.value))}
                          suffix="VND"
                        />
                        <span className="text-[11px] text-muted-foreground block">
                          Tương đương mỗi tháng trả:{" "}
                          <strong className="text-foreground">
                            {formatCurrency(revTotalPayment / revTermMonths)}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Reverse Calculation Results & Breakdown */}
            <div className="lg:col-span-7 space-y-6">
              {/* Main Rates Highlight Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Reducing APR Rate Card */}
                <Card className="border-primary/50 bg-gradient-to-br from-primary/15 via-card to-primary/5 shadow-glow-md">
                  <CardContent className="p-5 space-y-2">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Lãi Suất Thực Tế (Dư Nợ Giảm Dần)
                    </span>
                    <div className="text-3xl sm:text-4xl font-black text-primary">
                      {reverseResult.annualRateReducing}% <span className="text-sm font-semibold text-muted-foreground">/ năm</span>
                    </div>
                    <div className="text-xs text-muted-foreground pt-1 flex items-center justify-between">
                      <span>Theo tháng:</span>
                      <span className="font-bold text-foreground">
                        {reverseResult.monthlyRateReducing}% / tháng
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Flat Rate Card */}
                <Card className="border-border/80 bg-gradient-to-br from-card to-amber-500/5 shadow-sm">
                  <CardContent className="p-5 space-y-2">
                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                      <Percent className="h-4 w-4 text-amber-500" />
                      Lãi Suất Phẳng (Dư Nợ Gốc Ban Đầu)
                    </span>
                    <div className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400">
                      {reverseResult.annualRateFlat}% <span className="text-sm font-semibold text-muted-foreground">/ năm</span>
                    </div>
                    <div className="text-xs text-muted-foreground pt-1 flex items-center justify-between">
                      <span>Theo tháng:</span>
                      <span className="font-bold text-foreground">
                        {reverseResult.monthlyRateFlat}% / tháng
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Installment Interest Trap Alert */}
              <Card className="border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-card to-transparent shadow-sm">
                <CardContent className="p-5 space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs sm:text-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Lưu Ý Về &ldquo;Lãi Suất Phẳng&rdquo; Trong Mua Trả Góp / Vay Tiêu Dùng</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Các gói vay tiêu dùng hoặc mua hàng trả góp thường chỉ quảng cáo mức <strong>Lãi suất phẳng ({reverseResult.annualRateFlat}%/năm)</strong> để tạo cảm giác rẻ. Nhưng vì bạn trả dần tiền gốc mỗi tháng, số nợ thực tế giảm đi mà tiền lãi vẫn tính nguyên vẹn trên gốc ban đầu — khiến <strong>Lãi suất thực tế bạn phải gánh (APR) lên tới {reverseResult.annualRateReducing}%/năm</strong> (cao gấp gần 1.8 lần)!
                  </p>
                </CardContent>
              </Card>

              {/* Total Payment Summary Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-card border border-border/80 shadow-sm space-y-1">
                  <span className="text-[11px] text-muted-foreground">Tiền Vay Ban Đầu</span>
                  <div className="text-sm font-bold text-foreground truncate">
                    {formatCurrency(reverseResult.principal)}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-card border border-border/80 shadow-sm space-y-1">
                  <span className="text-[11px] text-muted-foreground">Tổng Tiền Lãi</span>
                  <div className="text-sm font-bold text-amber-600 dark:text-amber-400 truncate">
                    +{formatCurrency(reverseResult.totalInterest)}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-card border border-border/80 shadow-sm space-y-1">
                  <span className="text-[11px] text-muted-foreground">Tổng Trả (Gốc+Lãi)</span>
                  <div className="text-sm font-black text-primary truncate">
                    {formatCurrency(reverseResult.totalPayment)}
                  </div>
                </div>
              </div>

              {/* Recharts Table / Cashflow Tabs */}
              <Card className="border-border/80 shadow-md">
                <CardHeader className="pb-2 flex flex-row items-center justify-between border-b border-border/40">
                  <div>
                    <CardTitle className="text-base font-bold">
                      Bảng Lịch Trả Nợ Chi Tiết
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Phân bổ gốc & lãi hàng tháng theo mức lãi suất thực tế {reverseResult.annualRateReducing}%/năm
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
                  <div className="max-h-[300px] overflow-y-auto border border-border/80 rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/80 text-muted-foreground font-semibold sticky top-0 backdrop-blur-md">
                        <tr>
                          <th className="p-3">Kỳ</th>
                          <th className="p-3">Dư nợ đầu kỳ</th>
                          <th className="p-3">Tiền gốc</th>
                          <th className="p-3">Tiền lãi</th>
                          <th className="p-3">Tổng trả</th>
                          <th className="p-3 text-right">Dư nợ còn lại</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {reverseResult.schedule.map((row) => (
                          <tr key={row.month} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3 font-bold text-foreground">
                              Tháng {row.month}
                            </td>
                            <td className="p-3">{formatCurrency(row.startingBalance)}</td>
                            <td className="p-3 font-medium text-foreground">
                              {formatCurrency(row.principalPayment)}
                            </td>
                            <td className="p-3 text-amber-600 dark:text-amber-400">
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
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </ToolLayoutTemplate>
  );
}
