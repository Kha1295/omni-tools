"use client";

import * as React from "react";
import {
  calculateBillSplit,
  BillSplitResult,
} from "@/lib/math/bill";
import { getToolBySlug } from "@/config/tools.config";
import { ToolLayoutTemplate } from "@/components/tools/ToolLayoutTemplate";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import {
  Receipt,
  Copy,
  Check,
  Sparkles,
  PieChart as PieChartIcon,
  DollarSign,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const toolMetadata = getToolBySlug("/finance/bill-split")!;

const TIP_PRESETS = [0, 5, 10, 15, 20];
const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899"];

export default function BillSplitPage() {
  const [subtotal, setSubtotal] = React.useState<number>(1200000); // 1.2M VND
  const [taxPercent, setTaxPercent] = React.useState<number>(10); // 10% VAT
  const [tipPercent, setTipPercent] = React.useState<number>(5); // 5% Tip
  const [serviceChargePercent] = React.useState<number>(0);
  const [numberOfPeople, setNumberOfPeople] = React.useState<number>(4);
  const [roundingStep, setRoundingStep] = React.useState<number>(1000); // Làm tròn 1.000 ₫
  const [copiedNote, setCopiedNote] = React.useState<boolean>(false);

  const result: BillSplitResult = React.useMemo(() => {
    return calculateBillSplit({
      subtotal,
      taxPercent,
      tipPercent,
      serviceChargePercent,
      numberOfPeople,
      roundingStep,
    });
  }, [
    subtotal,
    taxPercent,
    tipPercent,
    serviceChargePercent,
    numberOfPeople,
    roundingStep,
  ]);

  const handleReset = () => {
    setSubtotal(1200000);
    setTaxPercent(10);
    setTipPercent(5);
    setNumberOfPeople(4);
    setRoundingStep(1000);
  };

  const handleCopyNote = () => {
    const text = `💸 CHIA TIỀN HÓA ĐƠN (${numberOfPeople} người)\n` +
      `-----------------------------\n` +
      `▪️ Tiền món: ${formatCurrency(result.subtotal)}\n` +
      `▪️ VAT (${taxPercent}%): ${formatCurrency(result.taxAmount)}\n` +
      (result.tipAmount > 0 ? `▪️ Tip (${tipPercent}%): ${formatCurrency(result.tipAmount)}\n` : "") +
      `▪️ Tổng hóa đơn: ${formatCurrency(result.totalAmount)}\n` +
      `👉 MỖI NGƯỜI: ${formatCurrency(result.roundedPerPersonTotal)}\n` +
      `-----------------------------\n` +
      `Tính toán bằng omni-tools`;

    navigator.clipboard.writeText(text);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2000);
  };

  // Pie chart data
  const pieData = [
    { name: "Tiền món", value: result.subtotal },
    { name: "Thuế VAT", value: result.taxAmount },
    ...(result.tipAmount > 0 ? [{ name: "Tiền Tip", value: result.tipAmount }] : []),
    ...(result.serviceChargeAmount > 0
      ? [{ name: "Phí dịch vụ", value: result.serviceChargeAmount }]
      : []),
  ];

  return (
    <ToolLayoutTemplate tool={toolMetadata} onReset={handleReset}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="border-border/80 shadow-md">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                <span>Chi Tiết Hóa Đơn & Người Tham Gia</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Nhập số tiền và chọn tỷ lệ phân bổ chi phí
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 pt-5">
              {/* Bill Subtotal */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Tổng tiền món (trước thuế & tip)</span>
                  <span className="text-primary font-bold">
                    {formatCurrency(subtotal)}
                  </span>
                </label>
                <Input
                  type="number"
                  min="0"
                  step="10000"
                  value={subtotal}
                  onChange={(e) => setSubtotal(Number(e.target.value))}
                  suffix="VND"
                  leftIcon={<DollarSign className="h-4 w-4" />}
                />
              </div>

              {/* Number of People */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Số người chia ({numberOfPeople} người)</span>
                  <span className="text-primary font-bold">{numberOfPeople} người</span>
                </label>
                <Slider
                  value={numberOfPeople}
                  min={1}
                  max={30}
                  step={1}
                  onChange={setNumberOfPeople}
                  unit=" người"
                />
              </div>

              {/* Tip Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Tiền Tip (% hoặc tùy chọn)</span>
                  <span className="text-primary font-bold">{tipPercent}%</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {TIP_PRESETS.map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant={tipPercent === preset ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTipPercent(preset)}
                      className="rounded-xl text-xs"
                    >
                      {preset}%
                    </Button>
                  ))}
                </div>
              </div>

              {/* Tax VAT & Service Charge */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">
                    Thuế VAT (%)
                  </label>
                  <Select
                    value={taxPercent.toString()}
                    onChange={(e) => setTaxPercent(Number(e.target.value))}
                    options={[
                      { value: "0", label: "0% (Không VAT)" },
                      { value: "8", label: "8% (VAT ưu đãi)" },
                      { value: "10", label: "10% (VAT chuẩn)" },
                    ]}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">
                    Làm tròn tiền
                  </label>
                  <Select
                    value={roundingStep.toString()}
                    onChange={(e) => setRoundingStep(Number(e.target.value))}
                    options={[
                      { value: "0", label: "Không làm tròn (Chính xác)" },
                      { value: "1000", label: "Hàng nghìn (1.000 ₫)" },
                      { value: "5000", label: "5.000 ₫" },
                      { value: "10000", label: "10.000 ₫" },
                    ]}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Result Highlight & Pie Chart */}
        <div className="lg:col-span-6 space-y-6">
          {/* Main Hero Result Card */}
          <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-card to-primary/5 shadow-glow-md overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Số Tiền Mỗi Người Cần Trả
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-primary">
                    {formatCurrency(result.roundedPerPersonTotal)}
                  </div>
                  {roundingStep > 0 && result.roundedPerPersonTotal !== result.perPersonTotal && (
                    <span className="text-[11px] text-muted-foreground">
                      (Chính xác: {formatCurrency(result.perPersonTotal)})
                    </span>
                  )}
                </div>

                <Button
                  onClick={handleCopyNote}
                  className="rounded-2xl gap-2 font-semibold shadow-md"
                  variant="gradient"
                >
                  {copiedNote ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Đã Copy</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy Bảng Chia</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border/60">
                <div className="p-2.5 rounded-xl bg-background/80 border border-border/60 space-y-0.5">
                  <span className="text-[11px] text-muted-foreground">Tiền Món</span>
                  <p className="text-xs font-bold text-foreground truncate">
                    {formatCurrency(result.subtotal)}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-background/80 border border-border/60 space-y-0.5">
                  <span className="text-[11px] text-muted-foreground">Thuế VAT</span>
                  <p className="text-xs font-bold text-foreground truncate">
                    {formatCurrency(result.taxAmount)}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-background/80 border border-border/60 space-y-0.5">
                  <span className="text-[11px] text-muted-foreground">Tiền Tip</span>
                  <p className="text-xs font-bold text-foreground truncate">
                    {formatCurrency(result.tipAmount)}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 space-y-0.5">
                  <span className="text-[11px] text-primary font-medium">Tổng Bill</span>
                  <p className="text-xs font-black text-primary truncate">
                    {formatCurrency(result.totalAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visual Pie Chart Proportion */}
          <Card className="border-border/80 shadow-md">
            <CardHeader className="pb-2 border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <PieChartIcon className="h-4 w-4 text-primary" />
                <span>Tỷ Trọng Chi Phí Hóa Đơn</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number | string | readonly (number | string)[] | undefined) => [
                        formatCurrency(typeof value === "number" || typeof value === "string" ? value : 0),
                        "",
                      ]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ToolLayoutTemplate>
  );
}
