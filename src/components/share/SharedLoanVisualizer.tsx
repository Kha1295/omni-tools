"use client";

import React, { useMemo } from "react";
import {
  calculateLoan,
  compareLoanMethods,
  findLoanInterestRate,
  LoanCalculationMethod,
  LoanResult,
  LoanComparisonResult,
  ReverseLoanResult,
} from "@/lib/math/loan";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { BarChart2, TrendingDown, Table as TableIcon, Download, AlertTriangle, Percent } from "lucide-react";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export interface SharedVisualizerProps {
  inputData: Record<string, unknown>;
  resultData: Record<string, unknown>;
}

const num = (v: unknown): number => (typeof v === "number" ? v : Number(v) || 0);
const str = (v: unknown): string => (typeof v === "string" ? v : String(v ?? ""));

interface ChartItem {
  name: string;
  month: number;
  "Tiền gốc": number;
  "Tiền lãi": number;
  "Tổng trả tháng": number;
  "Dư nợ còn lại": number;
  isGracePeriod: boolean;
}

type ForwardComputation = {
  mode: "forward";
  principal: number;
  annualInterestRate: number;
  termYears: number;
  termType: string;
  termMonthsInput: number;
  method: LoanCalculationMethod;
  gracePeriodMonths: number;
  totalMonths: number;
  loanResult: LoanResult;
  comparison: LoanComparisonResult;
  chartData: ChartItem[];
};

type ReverseComputation = {
  mode: "reverse";
  principal: number;
  termMonths: number;
  revInputType: string;
  monthlyPayment: number;
  totalPayment: number;
  reverseResult: ReverseLoanResult;
  chartData: ChartItem[];
};

type Computation = ForwardComputation | ReverseComputation;

export function SharedLoanVisualizer({ inputData }: SharedVisualizerProps) {
  const calcMode = str(inputData.calcMode) || "forward";

  const computation: Computation = useMemo(() => {
    if (calcMode === "reverse") {
      const principal = num(inputData.revPrincipal);
      const termMonths = num(inputData.revTermMonths) || 12;
      const revInputType = str(inputData.revInputType) || "monthly";
      const monthlyPayment = num(inputData.revMonthlyPayment);
      const totalPayment = num(inputData.revTotalPayment);

      const reverseResult = findLoanInterestRate({
        principal,
        termMonths,
        ...(revInputType === "monthly" ? { monthlyPayment } : { totalPayment }),
      });

      const chartData: ChartItem[] = reverseResult.schedule.map((item) => ({
        name: `Tháng ${item.month}`,
        month: item.month,
        "Tiền gốc": item.principalPayment,
        "Tiền lãi": item.interestPayment,
        "Tổng trả tháng": item.totalMonthlyPayment,
        "Dư nợ còn lại": item.endingBalance,
        isGracePeriod: item.isGracePeriod,
      }));

      return {
        mode: "reverse",
        principal,
        termMonths,
        revInputType,
        monthlyPayment,
        totalPayment,
        reverseResult,
        chartData,
      };
    } else {
      // Forward mode
      const principal = num(inputData.principal) || 1000000000;
      const annualInterestRate = num(inputData.annualInterestRate) || 8.5;
      const termYears = num(inputData.termYears) || 5;
      const termType = str(inputData.termType) || "years";
      const termMonthsInput = num(inputData.termMonthsInput) || 60;
      const rawMethod = str(inputData.method);
      const method: LoanCalculationMethod = rawMethod === "flat_rate" ? "flat_rate" : "reducing_balance";
      const gracePeriodMonths = num(inputData.gracePeriodMonths);

      const totalMonths = termType === "years" ? termYears * 12 : termMonthsInput || 60;

      const loanResult = calculateLoan({
        principal,
        annualInterestRate,
        termMonths: totalMonths,
        method,
        gracePeriodMonths,
      });

      const comparison = compareLoanMethods(
        principal,
        annualInterestRate,
        totalMonths,
        gracePeriodMonths
      );

      const chartData: ChartItem[] = loanResult.schedule.map((item) => ({
        name: `Tháng ${item.month}`,
        month: item.month,
        "Tiền gốc": item.principalPayment,
        "Tiền lãi": item.interestPayment,
        "Tổng trả tháng": item.totalMonthlyPayment,
        "Dư nợ còn lại": item.endingBalance,
        isGracePeriod: item.isGracePeriod,
      }));

      return {
        mode: "forward",
        principal,
        annualInterestRate,
        termYears,
        termType,
        termMonthsInput,
        method,
        gracePeriodMonths,
        totalMonths,
        loanResult,
        comparison,
        chartData,
      };
    }
  }, [calcMode, inputData]);

  const handleExportCSV = () => {
    const currentSchedule =
      computation.mode === "forward"
        ? computation.loanResult.schedule
        : computation.reverseResult.schedule;

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
    link.setAttribute("download", `lich_tra_no_omni_tools_${computation.mode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tooltipFormatter = (
    value: number | string | readonly (number | string)[] | undefined
  ): [string, string] => {
    const numericValue = typeof value === "number" ? value : Number(value) || 0;
    return [formatCurrency(numericValue), ""];
  };

  if (computation.mode === "reverse") {
    const {
      principal,
      termMonths,
      revInputType,
      monthlyPayment,
      totalPayment,
      reverseResult,
      chartData,
    } = computation;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Số tiền vay</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(principal)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Số tháng trả</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{termMonths} tháng</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {revInputType === "monthly" ? "Tiền trả/tháng" : "Tổng trả"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(revInputType === "monthly" ? monthlyPayment : totalPayment)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-indigo-100 bg-indigo-50/50 dark:bg-indigo-950/20 dark:border-indigo-900/40">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Percent className="w-5 h-5 text-indigo-500" />
                <h3 className="font-semibold text-indigo-900 dark:text-indigo-200">Lãi suất thực tế APR</h3>
              </div>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {reverseResult.annualRateReducing}%
                <span className="text-sm font-normal text-indigo-400 ml-1">/năm</span>
              </p>
              <p className="text-sm text-indigo-600/80 dark:text-indigo-400/80 mt-1">Dư nợ giảm dần</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/40">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Percent className="w-5 h-5 text-emerald-500" />
                <h3 className="font-semibold text-emerald-900 dark:text-emerald-200">Lãi suất phẳng</h3>
              </div>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {reverseResult.annualRateFlat}%
                <span className="text-sm font-normal text-emerald-400 ml-1">/năm</span>
              </p>
              <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80 mt-1">Tính trên nợ gốc ban đầu</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <CardTitle className="text-base font-semibold">Phân tích chi tiết</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Tải CSV
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="cashflow" className="w-full">
              <div className="p-4 border-b">
                <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50 rounded-xl">
                  <TabsTrigger value="cashflow" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <BarChart2 className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Dòng Tiền Hàng Tháng</span>
                    <span className="sm:hidden">Dòng tiền</span>
                  </TabsTrigger>
                  <TabsTrigger value="balance" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <TrendingDown className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Dư Nợ Còn Lại</span>
                    <span className="sm:hidden">Dư nợ</span>
                  </TabsTrigger>
                  <TabsTrigger value="table" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <TableIcon className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Bảng Lịch Trả Nợ</span>
                    <span className="sm:hidden">Lịch trả</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-4 min-h-[400px]">
                <TabsContent value="cashflow" className="h-[400px] mt-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.6} vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickFormatter={(val: number) => `T${val}`}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <YAxis
                        tickFormatter={(val: number) =>
                          val >= 1000000000 ? `${(val / 1000000000).toFixed(1)}T` : `${(val / 1000000).toFixed(0)}M`
                        }
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        width={45}
                      />
                      <Tooltip
                        formatter={tooltipFormatter}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "12px",
                          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                          fontSize: "12px",
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }} />
                      <Bar dataKey="Tiền gốc" stackId="a" fill="#6366f1" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="Tiền lãi" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="balance" className="h-[400px] mt-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
                      <defs>
                        <linearGradient id="shareColorBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.6} vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickFormatter={(val: number) => `T${val}`}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <YAxis
                        tickFormatter={(val: number) =>
                          val >= 1000000000 ? `${(val / 1000000000).toFixed(1)}T` : `${(val / 1000000).toFixed(0)}M`
                        }
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        width={45}
                      />
                      <Tooltip
                        formatter={tooltipFormatter}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "12px",
                          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                          fontSize: "12px",
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }} />
                      <Area
                        type="monotone"
                        dataKey="Dư nợ còn lại"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fill="url(#shareColorBalance)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="table" className="mt-0">
                  <div className="overflow-x-auto rounded-lg border max-h-[400px]">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground bg-muted/50 uppercase sticky top-0">
                        <tr>
                          <th className="px-4 py-3 font-medium">Kỳ</th>
                          <th className="px-4 py-3 font-medium text-right">Dư Nợ Đầu Kỳ</th>
                          <th className="px-4 py-3 font-medium text-right">Gốc Trả</th>
                          <th className="px-4 py-3 font-medium text-right">Lãi Trả</th>
                          <th className="px-4 py-3 font-medium text-right text-primary">Tổng Trả</th>
                          <th className="px-4 py-3 font-medium text-right">Dư Nợ Cuối</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {chartData.map((row) => (
                          <tr key={row.month} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              Tháng {row.month}
                              {row.isGracePeriod && (
                                <Badge variant="outline" className="ml-2 text-[10px] bg-amber-50 text-amber-600 border-amber-200">
                                  Ân hạn
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">{formatCurrency(row["Dư nợ còn lại"] + row["Tiền gốc"])}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(row["Tiền gốc"])}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(row["Tiền lãi"])}</td>
                            <td className="px-4 py-3 text-right font-medium text-primary">{formatCurrency(row["Tổng trả tháng"])}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(row["Dư nợ còn lại"])}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Forward mode rendering
  const {
    principal,
    annualInterestRate,
    termYears,
    termType,
    method,
    loanResult,
    comparison,
    chartData,
    totalMonths,
  } = computation;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Số tiền vay gốc</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate" title={formatCurrency(principal)}>{formatCurrency(principal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Lãi suất năm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-indigo-500">{annualInterestRate}%/năm</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Thời hạn vay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {termType === "years" ? `${termYears} năm` : `${totalMonths} tháng`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Phương thức tính</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold mt-1 line-clamp-2">
              {method === "reducing_balance" ? "Dư nợ giảm dần" : "Dư nợ gốc"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Tổng tiền lãi phải trả</h3>
            <p className="text-2xl font-bold text-primary">{formatCurrency(loanResult.totalInterest)}</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/50 border-border/50">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Tổng gốc + lãi</h3>
            <p className="text-2xl font-bold">{formatCurrency(loanResult.totalPayment)}</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Tháng đầu trả cao nhất</h3>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(loanResult.firstMonthPayment)}</p>
          </CardContent>
        </Card>
      </div>

      {method === "reducing_balance" && comparison.interestDifference > 0 && (
        <Card className="border-indigo-100 bg-indigo-50/50 dark:bg-indigo-950/20 dark:border-indigo-900/40">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full shrink-0">
              <AlertTriangle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h4 className="font-medium text-indigo-900 dark:text-indigo-200 text-sm">So sánh phương thức</h4>
              <p className="text-sm text-indigo-700/80 dark:text-indigo-300/80 mt-1">
                Với phương thức <strong>Dư nợ giảm dần</strong>, bạn tiết kiệm được <strong className="text-indigo-600 dark:text-indigo-400">{formatCurrency(comparison.interestDifference)}</strong> tiền lãi so với phương thức Dư nợ gốc (lãi phẳng).
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
          <CardTitle className="text-base font-semibold">Phân tích chi tiết</CardTitle>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Tải CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="cashflow" className="w-full">
            <div className="p-4 border-b">
              <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50 rounded-xl">
                <TabsTrigger value="cashflow" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <BarChart2 className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Dòng Tiền Hàng Tháng</span>
                  <span className="sm:hidden">Dòng tiền</span>
                </TabsTrigger>
                <TabsTrigger value="balance" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <TrendingDown className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Dư Nợ Còn Lại</span>
                  <span className="sm:hidden">Dư nợ</span>
                </TabsTrigger>
                <TabsTrigger value="table" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <TableIcon className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Bảng Lịch Trả Nợ</span>
                  <span className="sm:hidden">Lịch trả</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-4 min-h-[400px]">
              <TabsContent value="cashflow" className="h-[400px] mt-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.6} vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickFormatter={(val: number) => `T${val}`}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                    />
                    <YAxis
                      tickFormatter={(val: number) =>
                        val >= 1000000000 ? `${(val / 1000000000).toFixed(1)}T` : `${(val / 1000000).toFixed(0)}M`
                      }
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={45}
                    />
                    <Tooltip
                      formatter={tooltipFormatter}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "12px",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }} />
                    <Bar dataKey="Tiền gốc" stackId="a" fill="#6366f1" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="Tiền lãi" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="balance" className="h-[400px] mt-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="shareColorBalanceForward" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.6} vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickFormatter={(val: number) => `T${val}`}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                    />
                    <YAxis
                      tickFormatter={(val: number) =>
                        val >= 1000000000 ? `${(val / 1000000000).toFixed(1)}T` : `${(val / 1000000).toFixed(0)}M`
                      }
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={45}
                    />
                    <Tooltip
                      formatter={tooltipFormatter}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "12px",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }} />
                    <Area
                      type="monotone"
                      dataKey="Dư nợ còn lại"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fill="url(#shareColorBalanceForward)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="table" className="mt-0">
                <div className="overflow-x-auto rounded-lg border max-h-[400px]">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground bg-muted/50 uppercase sticky top-0">
                      <tr>
                        <th className="px-4 py-3 font-medium">Kỳ</th>
                        <th className="px-4 py-3 font-medium text-right">Dư Nợ Đầu Kỳ</th>
                        <th className="px-4 py-3 font-medium text-right">Gốc Trả</th>
                        <th className="px-4 py-3 font-medium text-right">Lãi Trả</th>
                        <th className="px-4 py-3 font-medium text-right text-primary">Tổng Trả</th>
                        <th className="px-4 py-3 font-medium text-right">Dư Nợ Cuối</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {chartData.map((row) => (
                        <tr key={row.month} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            Tháng {row.month}
                            {row.isGracePeriod && (
                              <Badge variant="outline" className="ml-2 text-[10px] bg-amber-50 text-amber-600 border-amber-200">
                                Ân hạn
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">{formatCurrency(row["Dư nợ còn lại"] + row["Tiền gốc"])}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(row["Tiền gốc"])}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(row["Tiền lãi"])}</td>
                          <td className="px-4 py-3 text-right font-medium text-primary">{formatCurrency(row["Tổng trả tháng"])}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(row["Dư nợ còn lại"])}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
