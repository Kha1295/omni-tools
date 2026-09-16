"use client";

import * as React from 'react';
import { calculateCompoundInterest } from '@/lib/math/interest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { BarChart2, Table as TableIcon, Download } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface SharedVisualizerProps {
  inputData: Record<string, unknown>;
  resultData: Record<string, unknown>;
}

const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);

export function SharedInterestVisualizer({ inputData }: SharedVisualizerProps) {
  const initialPrincipal = num(inputData.initialPrincipal);
  const annualInterestRate = num(inputData.annualInterestRate);
  const durationYears = num(inputData.durationYears);
  const rawCompound = typeof inputData.compoundFrequency === 'string' ? inputData.compoundFrequency : 'monthly';
  const compoundFrequency: "monthly" | "quarterly" | "annually" =
    rawCompound === "quarterly" || rawCompound === "annually" ? rawCompound : "monthly";
  const periodicContribution = num(inputData.periodicContribution);
  const rawContribution = typeof inputData.contributionFrequency === 'string' ? inputData.contributionFrequency : 'monthly';
  const contributionFrequency: "monthly" | "annually" =
    rawContribution === "annually" ? "annually" : "monthly";

  const result = React.useMemo(() => {
    return calculateCompoundInterest({
      initialPrincipal,
      annualInterestRate,
      durationYears,
      compoundFrequency,
      periodicContribution,
      contributionFrequency,
    });
  }, [
    initialPrincipal,
    annualInterestRate,
    durationYears,
    compoundFrequency,
    periodicContribution,
    contributionFrequency,
  ]);

  const chartData = React.useMemo(() => {
    return result.breakdown.map((item) => ({
      name: `Năm ${item.year}`,
      'Tiền gốc': item.totalDeposit,
      'Tiền lãi': item.totalInterest,
      'Tổng tài sản': item.endingBalance
    }));
  }, [result]);

  const profitRatio = result.totalPrincipal > 0 ? ((result.totalInterest / result.totalPrincipal) * 100).toFixed(1) : '0';

  const exportCSV = () => {
    const headers = ['Năm', 'Tiền Gốc Đã Nộp', 'Tiền Lãi Tích Lũy', 'Tổng Số Dư'];
    const rows = result.breakdown.map((item) => [
      item.year.toString(),
      item.totalDeposit.toString(),
      item.totalInterest.toString(),
      item.endingBalance.toString()
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'lai_kep_omni_tools_shared.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatTooltipValue = (value: number | string | readonly (number | string)[] | undefined): [string, string] => {
    return [formatCurrency(num(value)), ''];
  };

  const formatYAxis = (value: number): string => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}T`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    return value.toString();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Tiền gốc ban đầu</p>
            <p className="font-semibold text-foreground">{formatCurrency(initialPrincipal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Lãi suất năm</p>
            <p className="font-semibold text-emerald-500">{annualInterestRate}%/năm</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Thời gian tích lũy</p>
            <p className="font-semibold text-foreground">{durationYears} năm</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Gửi thêm định kỳ</p>
            <p className="font-semibold text-indigo-500">{formatCurrency(periodicContribution)}/tháng</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tổng Tiền Gốc Đã Nộp</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(result.totalPrincipal)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tổng Tiền Lãi Tích Lũy</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-primary">{formatCurrency(result.totalInterest)}</p>
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                  +{profitRatio}%
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tổng Tài Sản Cuối Kỳ</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(result.finalBalance)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Xuất CSV
        </Button>
      </div>

      <Tabs defaultValue="chart" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="chart">
            <BarChart2 className="w-4 h-4 mr-2" />
            Biểu Đồ Tăng Trưởng
          </TabsTrigger>
          <TabsTrigger value="table">
            <TableIcon className="w-4 h-4 mr-2" />
            Lịch Phân Kỳ
          </TabsTrigger>
        </TabsList>
        <TabsContent value="chart" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Biểu đồ tích lũy tài sản qua các năm</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="shareColorPrincipal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="shareColorInterest" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tickFormatter={formatYAxis}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={60}
                    />
                    <Tooltip 
                      formatter={formatTooltipValue}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        borderColor: 'hsl(var(--border))', 
                        borderRadius: '12px', 
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', 
                        fontSize: '12px' 
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Area 
                      type="monotone" 
                      dataKey="Tiền gốc" 
                      stroke="#6366f1" 
                      fill="url(#shareColorPrincipal)" 
                      strokeWidth={2}
                      stackId="1"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Tiền lãi" 
                      stroke="#10b981" 
                      fill="url(#shareColorInterest)" 
                      strokeWidth={2}
                      stackId="1"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="table" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Năm</th>
                      <th className="py-3 px-4 text-right font-medium text-muted-foreground">Gốc Tích Lũy</th>
                      <th className="py-3 px-4 text-right font-medium text-muted-foreground">Lãi Năm</th>
                      <th className="py-3 px-4 text-right font-medium text-muted-foreground">Lãi Tích Lũy</th>
                      <th className="py-3 px-4 text-right font-medium text-muted-foreground">Tổng Số Dư</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.breakdown.map((item) => (
                      <tr key={item.year} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="py-3 px-4 text-left">{item.year}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(item.totalDeposit)}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(item.yearlyInterest)}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(item.totalInterest)}</td>
                        <td className="py-3 px-4 text-right font-medium text-primary">{formatCurrency(item.endingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
