"use client";

import * as React from 'react';
import { calculateBillSplit } from '@/lib/math/bill';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { PieChart as PieChartIcon, Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface SharedVisualizerProps {
  inputData: Record<string, unknown>;
  resultData: Record<string, unknown>;
}

const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);
const str = (v: unknown): string => (typeof v === 'string' ? v : String(v ?? ''));

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6', '#a855f7', '#3b82f6', '#e11d48', '#84cc16'];

export function SharedBillSplitVisualizer({ inputData }: SharedVisualizerProps) {
  const result = React.useMemo(() => {
    const splitMode = str(inputData.splitMode) as 'equal' | 'shares';
    const subtotal = num(inputData.subtotal);
    const numberOfPeople = num(inputData.numberOfPeople);
    const taxPercent = num(inputData.taxPercent);
    const tipPercent = num(inputData.tipPercent);
    const serviceChargePercent = num(inputData.serviceChargePercent);
    const roundingStep = num(inputData.roundingStep);
    
    let peopleShares: Array<{id: string; name: string; shares: number}> = [];
    if (Array.isArray(inputData.peopleShares)) {
      peopleShares = inputData.peopleShares as Array<{id: string; name: string; shares: number}>;
    } else if (typeof inputData.peopleShares === 'string') {
      try {
        const parsed = JSON.parse(inputData.peopleShares);
        if (Array.isArray(parsed)) {
          peopleShares = parsed;
        }
      } catch {
        // ignore JSON parse error
      }
    }

    return calculateBillSplit({
      subtotal,
      taxPercent,
      tipPercent,
      serviceChargePercent,
      numberOfPeople,
      roundingStep,
      splitMode,
      peopleShares
    });
  }, [inputData]);

  const pieData = React.useMemo(() => {
    if (str(inputData.splitMode) === 'shares') {
      return result.personDetails.map(p => ({
        name: `${p.name} (${p.shares} phần)`,
        value: p.amount
      }));
    } else {
      return [
        { name: 'Tiền món', value: result.subtotal },
        ...(result.taxAmount > 0 ? [{ name: 'Thuế VAT', value: result.taxAmount }] : []),
        ...(result.tipAmount > 0 ? [{ name: 'Tiền Tip', value: result.tipAmount }] : []),
        ...(result.serviceChargeAmount > 0 ? [{ name: 'Phí dịch vụ', value: result.serviceChargeAmount }] : [])
      ];
    }
  }, [inputData.splitMode, result]);

  const tooltipFormatter = React.useCallback(
    (value: number | string | readonly (number | string)[] | undefined): [string, string] => {
      return [formatCurrency(Number(value) || 0), ''];
    },
    []
  );

  const isEqualMode = str(inputData.splitMode) !== 'shares';
  const totalShares = result.personDetails.reduce((sum, p) => sum + p.shares, 0);

  return (
    <div className="space-y-6">
      <div className={`grid grid-cols-2 sm:grid-cols-${isEqualMode ? 4 : 3} gap-4`}>
        <Card>
          <CardContent className="p-4 flex flex-col justify-center items-center text-center">
            <span className="text-xs text-muted-foreground mb-1">Tiền món trước thuế</span>
            <span className="font-semibold">{formatCurrency(result.subtotal)}</span>
          </CardContent>
        </Card>
        
        {(result.taxAmount > 0 || result.tipAmount > 0 || result.serviceChargeAmount > 0) && (
          <Card>
            <CardContent className="p-4 flex flex-col justify-center items-center text-center">
              <span className="text-xs text-muted-foreground mb-1">Thuế + Tip + Phí DV</span>
              <span className="font-semibold text-orange-600">
                {formatCurrency(result.taxAmount + result.tipAmount + result.serviceChargeAmount)}
              </span>
            </CardContent>
          </Card>
        )}

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex flex-col justify-center items-center text-center">
            <span className="text-xs text-primary/80 mb-1 font-medium">Tổng hóa đơn</span>
            <span className="font-extrabold text-primary text-lg">{formatCurrency(result.totalAmount)}</span>
          </CardContent>
        </Card>

        {isEqualMode && (
          <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50">
            <CardContent className="p-4 flex flex-col justify-center items-center text-center">
              <span className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mb-1 font-medium">Mỗi người thanh toán</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-lg">
                {formatCurrency(result.roundedPerPersonTotal)}
              </span>
            </CardContent>
          </Card>
        )}
      </div>

      {!isEqualMode && result.personDetails.length > 0 && (
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Danh Sách Chi Tiết Từng Người
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">#</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tên</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Số phần</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Số tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {result.personDetails.map((person, index) => (
                    <tr key={person.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                      <td className="px-4 py-3 font-medium">{person.name}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="secondary" className="font-normal">{person.shares}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-primary">
                        {formatCurrency(person.roundedAmount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/20 font-semibold border-t-2">
                    <td colSpan={2} className="px-4 py-3 text-right">Tổng cộng:</td>
                    <td className="px-4 py-3 text-center">{totalShares}</td>
                    <td className="px-4 py-3 text-right text-primary">
                      {formatCurrency(result.totalAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
            <PieChartIcon className="w-4 h-4" />
            Trực Quan Hóa Tỷ Trọng Chi Tiêu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={pieData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={90} 
                  paddingAngle={3} 
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={tooltipFormatter} 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
