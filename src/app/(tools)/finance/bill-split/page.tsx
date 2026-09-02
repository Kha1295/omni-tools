"use client";

import * as React from "react";
import {
  calculateBillSplit,
  BillSplitResult,
  PersonShare,
} from "@/lib/math/bill";
import { getToolBySlug } from "@/config/tools.config";
import { ToolLayoutTemplate } from "@/components/tools/ToolLayoutTemplate";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  Receipt,
  Copy,
  Check,
  Sparkles,
  PieChart as PieChartIcon,
  DollarSign,
  Plus,
  Trash2,
  Users,
  Layers,
  FileSpreadsheet,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const toolMetadata = getToolBySlug("/finance/bill-split")!;

const TIP_PRESETS = [0, 5, 10, 15, 20];
const COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#14b8a6",
  "#a855f7",
  "#3b82f6",
  "#e11d48",
  "#84cc16",
];

// Initial demo data matching user specification
const INITIAL_DEMO_PEOPLE: PersonShare[] = [
  { id: "1", name: "Name 1", shares: 1 },
  { id: "2", name: "Name 2", shares: 1 },
  { id: "3", name: "Name 3", shares: 1 },
  { id: "4", name: "Name 4", shares: 1 },
  { id: "5", name: "Name 5", shares: 1 },
  { id: "6", name: "Name 6", shares: 1 },
  { id: "7", name: "Name 7", shares: 1 },
  { id: "8", name: "Name 8", shares: 1 },
  { id: "9", name: "Name 9", shares: 0.5 },
  { id: "10", name: "Name 10", shares: 0.5 },
  { id: "11", name: "Name 11", shares: 0.5 },
  { id: "12", name: "Name 12", shares: 0.5 },
];

export default function BillSplitPage() {
  const [splitMode, setSplitMode] = React.useState<"equal" | "shares">("shares");
  const [subtotal, setSubtotal] = React.useState<number>(2000000); // 2M VND
  const [taxPercent, setTaxPercent] = React.useState<number>(0); // 0%
  const [tipPercent, setTipPercent] = React.useState<number>(0); // 0%
  const [serviceChargePercent, setServiceChargePercent] = React.useState<number>(0);
  const [numberOfPeople, setNumberOfPeople] = React.useState<number>(10);
  const [roundingStep, setRoundingStep] = React.useState<number>(0); // Chính xác 0 đ
  const [peopleShares, setPeopleShares] = React.useState<PersonShare[]>(INITIAL_DEMO_PEOPLE);
  const [copiedNote, setCopiedNote] = React.useState<boolean>(false);

  const result: BillSplitResult = React.useMemo(() => {
    return calculateBillSplit({
      subtotal,
      taxPercent,
      tipPercent,
      serviceChargePercent,
      numberOfPeople,
      roundingStep,
      splitMode,
      peopleShares,
    });
  }, [
    subtotal,
    taxPercent,
    tipPercent,
    serviceChargePercent,
    numberOfPeople,
    roundingStep,
    splitMode,
    peopleShares,
  ]);

  const handleReset = () => {
    setSubtotal(2000000);
    setTaxPercent(0);
    setTipPercent(0);
    setServiceChargePercent(0);
    setNumberOfPeople(10);
    setRoundingStep(0);
    setSplitMode("shares");
    setPeopleShares(INITIAL_DEMO_PEOPLE);
  };

  const handleAddPerson = () => {
    const nextId = (peopleShares.length + 1).toString();
    setPeopleShares([
      ...peopleShares,
      { id: `person-${Date.now()}`, name: `Name ${nextId}`, shares: 1 },
    ]);
  };

  const handleRemovePerson = (id: string) => {
    if (peopleShares.length <= 1) return;
    setPeopleShares(peopleShares.filter((p) => p.id !== id));
  };

  const handleUpdatePerson = (id: string, field: "name" | "shares", value: string | number) => {
    setPeopleShares(
      peopleShares.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            [field]: field === "shares" ? Math.max(0, Number(value) || 0) : value,
          };
        }
        return p;
      })
    );
  };

  const handleCopyNote = () => {
    let text = "";
    if (splitMode === "shares") {
      text = `💸 BẢNG TỔNG HỢP CHI PHÍ & CHIA THEO PHẦN\n` +
        `=============================\n` +
        `▪️ Total: ${formatCurrency(result.totalAmount)}\n` +
        `▪️ Tổng số phần: ${result.totalShares} phần (${result.personDetails.length} người)\n` +
        `▪️ Tiền / phần: ${formatCurrency(result.roundedPricePerShare)}\n` +
        `-----------------------------\n` +
        `DANH SÁCH CHI TIẾT:\n` +
        result.personDetails
          .map(
            (p, idx) =>
              `${idx + 1}. ${p.name} (${p.shares} phần): ${formatCurrency(p.roundedAmount)}`
          )
          .join("\n") +
        `\n=============================\n` +
        `Tính toán chính xác bằng omni-tools`;
    } else {
      text = `💸 CHIA TIỀN HÓA ĐƠN (${numberOfPeople} người)\n` +
        `-----------------------------\n` +
        `▪️ Tiền món: ${formatCurrency(result.subtotal)}\n` +
        (result.taxAmount > 0 ? `▪️ VAT (${taxPercent}%): ${formatCurrency(result.taxAmount)}\n` : "") +
        (result.tipAmount > 0 ? `▪️ Tip (${tipPercent}%): ${formatCurrency(result.tipAmount)}\n` : "") +
        `▪️ Tổng hóa đơn: ${formatCurrency(result.totalAmount)}\n` +
        `👉 MỖI NGƯỜI: ${formatCurrency(result.roundedPerPersonTotal)}\n` +
        `-----------------------------\n` +
        `Tính toán bằng omni-tools`;
    }

    navigator.clipboard.writeText(text);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2000);
  };

  // Chart data
  const pieData = splitMode === "shares"
    ? result.personDetails.map((p) => ({
        name: `${p.name} (${p.shares} phần)`,
        value: p.amount,
      }))
    : [
        { name: "Tiền món", value: result.subtotal },
        ...(result.taxAmount > 0 ? [{ name: "Thuế VAT", value: result.taxAmount }] : []),
        ...(result.tipAmount > 0 ? [{ name: "Tiền Tip", value: result.tipAmount }] : []),
        ...(result.serviceChargeAmount > 0
          ? [{ name: "Phí dịch vụ", value: result.serviceChargeAmount }]
          : []),
      ];

  return (
    <ToolLayoutTemplate tool={toolMetadata} onReset={handleReset}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form & Mode Switcher */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="border-border/80 shadow-md">
            <CardHeader className="pb-4 border-b border-border/40">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  <span>Chi Tiết Hóa Đơn & Cách Chia</span>
                </CardTitle>

                {/* Mode Switcher */}
                <div className="flex items-center gap-1 p-1 bg-muted rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSplitMode("equal")}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      splitMode === "equal"
                        ? "bg-card text-primary shadow-sm font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>Chia đều</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitMode("shares")}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      splitMode === "shares"
                        ? "bg-card text-primary shadow-sm font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Chia theo phần</span>
                  </button>
                </div>
              </div>
              <CardDescription className="text-xs">
                {splitMode === "shares"
                  ? "Chia theo số lượng phần ăn/uống hoặc tỷ lệ tham gia của từng người"
                  : "Chia đều tổng tiền cho tất cả các thành viên"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 pt-5">
              {/* Bill Subtotal */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Tổng tiền hóa đơn (Total)</span>
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

              {/* Mode-specific settings */}
              {splitMode === "equal" ? (
                /* Equal Split: Slider for Number of People */
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Số người chia ({numberOfPeople} người)</span>
                    <span className="text-primary font-bold">{numberOfPeople} người</span>
                  </label>
                  <Slider
                    value={numberOfPeople}
                    min={1}
                    max={50}
                    step={1}
                    onChange={setNumberOfPeople}
                    unit=" người"
                  />
                </div>
              ) : (
                /* Shares Split: Person List with Share inputs */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-primary" />
                      <span>Danh sách người & số phần ({peopleShares.length} người - {result.totalShares} phần)</span>
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddPerson}
                      className="h-8 gap-1 text-xs rounded-xl"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Thêm người</span>
                    </Button>
                  </div>

                  {/* List of people */}
                  <div className="max-h-[280px] overflow-y-auto space-y-2 p-2 border border-border/80 rounded-xl bg-muted/20">
                    {peopleShares.map((person, idx) => (
                      <div
                        key={person.id}
                        className="flex items-center gap-2 p-2 rounded-xl bg-card border border-border/60 shadow-sm"
                      >
                        <span className="text-xs font-bold text-muted-foreground w-6 text-center shrink-0">
                          #{idx + 1}
                        </span>
                        <input
                          type="text"
                          value={person.name}
                          onChange={(e) =>
                            handleUpdatePerson(person.id, "name", e.target.value)
                          }
                          placeholder="Tên thành viên"
                          className="flex-1 h-9 px-2.5 rounded-lg border border-border bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={person.shares}
                            onChange={(e) =>
                              handleUpdatePerson(person.id, "shares", e.target.value)
                            }
                            className="w-16 h-9 px-2 rounded-lg border border-border bg-background text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                          <span className="text-[11px] text-muted-foreground font-medium pr-1">
                            phần
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePerson(person.id)}
                          disabled={peopleShares.length <= 1}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-30"
                          title="Xóa người"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

              {/* Tax VAT & Rounding */}
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

        {/* Right Column: Cost Summary Table & Detailed Breakdown */}
        <div className="lg:col-span-6 space-y-6">
          {/* Main Hero Summary Card */}
          <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-card to-primary/5 shadow-glow-md overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {splitMode === "shares" ? "Giá Trị Mỗi Phần Ăn / Uống" : "Số Tiền Mỗi Người Cần Trả"}
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-primary">
                    {formatCurrency(
                      splitMode === "shares"
                        ? result.roundedPricePerShare
                        : result.roundedPerPersonTotal
                    )}
                    {splitMode === "shares" && (
                      <span className="text-sm font-bold text-muted-foreground ml-1.5">
                        / 1 phần
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {splitMode === "shares"
                      ? `Tổng cộng ${result.totalShares} phần (${peopleShares.length} người tham gia)`
                      : `Chia đều cho ${numberOfPeople} người`}
                  </span>
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

              {/* Bảng tổng hợp chi phí (Follow format data demo) */}
              <div className="space-y-2 pt-3 border-t border-border/60">
                <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
                  <span>Bảng tổng hợp chi phí</span>
                </div>
                <div className="border border-border/80 rounded-xl overflow-hidden bg-background/80">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/70 text-muted-foreground font-semibold">
                      <tr>
                        <th className="p-2.5">Thông tin</th>
                        <th className="p-2.5 text-right">Giá trị</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      <tr>
                        <td className="p-2.5 font-medium text-foreground">Total</td>
                        <td className="p-2.5 text-right font-bold text-primary">
                          {formatCurrency(result.totalAmount)}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium text-foreground">
                          {splitMode === "shares" ? "Tổng số phần" : "Số người"}
                        </td>
                        <td className="p-2.5 text-right font-semibold text-foreground">
                          {splitMode === "shares" ? `${result.totalShares} phần` : `${numberOfPeople} người`}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium text-foreground">
                          {splitMode === "shares" ? "Tiền / phần" : "Tiền / người"}
                        </td>
                        <td className="p-2.5 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(
                            splitMode === "shares"
                              ? result.roundedPricePerShare
                              : result.roundedPerPersonTotal
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Breakdown List (When in shares mode) */}
          {splitMode === "shares" && (
            <Card className="border-border/80 shadow-md">
              <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span>Danh Sách Chi Tiết Từng Người</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Số tiền thanh toán tương ứng theo số lượng phần ăn của mỗi cá nhân
                  </CardDescription>
                </div>
                <Badge variant="accent" className="font-mono text-xs">
                  {result.personDetails.length} người
                </Badge>
              </CardHeader>
              <CardContent className="p-4">
                <div className="max-h-[300px] overflow-y-auto border border-border/80 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/80 text-muted-foreground font-semibold sticky top-0 backdrop-blur-md">
                      <tr>
                        <th className="p-2.5 text-center w-10">#</th>
                        <th className="p-2.5">Name</th>
                        <th className="p-2.5 text-center">Số lượng</th>
                        <th className="p-2.5 text-right">Tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {result.personDetails.map((person, index) => (
                        <tr
                          key={person.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="p-2.5 text-center font-bold text-muted-foreground">
                            {index + 1}
                          </td>
                          <td className="p-2.5 font-semibold text-foreground">
                            {person.name}
                          </td>
                          <td className="p-2.5 text-center font-mono">
                            <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-bold">
                              {person.shares}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-extrabold text-primary">
                            {formatCurrency(person.roundedAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Visual Pie Chart Proportion */}
          <Card className="border-border/80 shadow-md">
            <CardHeader className="pb-2 border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <PieChartIcon className="h-4 w-4 text-primary" />
                <span>Trực Quan Hóa Tỷ Trọng Chi Tiêu</span>
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
                      paddingAngle={3}
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
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
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
