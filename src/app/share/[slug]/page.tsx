import Link from "next/link";
import { getCalculationBySlug } from "@/app/actions/calculations.action";
import { TOOLS_CONFIG } from "@/config/tools.config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  Sparkles,
  ArrowLeft,
  Calendar,
  Eye,
  Database,
  ExternalLink,
  Calculator,
  Receipt,
  ArrowLeftRight,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { CopyButton } from "./CopyButton";

interface SharePageProps {
  params: Promise<{
    slug: string;
  }>;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  "loan-calculator": <Calculator className="h-6 w-6 text-indigo-500" />,
  "bill-split": <Receipt className="h-6 w-6 text-teal-500" />,
  "interest-rate": <TrendingUp className="h-6 w-6 text-emerald-500" />,
  "currency-converter": <ArrowLeftRight className="h-6 w-6 text-blue-500" />,
};

export default async function SharedCalculationPage({ params }: SharePageProps) {
  const { slug } = await params;
  const calculation = await getCalculationBySlug(slug);

  if (!calculation) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto text-muted-foreground">
          <Database className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Không tìm thấy kết quả tính toán</h1>
          <p className="text-sm text-muted-foreground">
            Liên kết này có thể không tồn tại hoặc đã được dọn dẹp bởi quản trị viên.
          </p>
        </div>
        <Link href="/">
          <Button variant="default" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Về trang chủ</span>
          </Button>
        </Link>
      </div>
    );
  }

  const tool = TOOLS_CONFIG.find((t) => t.id === calculation.toolId);
  const toolSlug = tool ? tool.slug : "/";
  const toolName = tool ? tool.name : calculation.toolId;

  const { inputData, resultData } = calculation;
  const formattedDate = new Date(calculation.createdAt).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const num = (v: unknown): number => (typeof v === "number" ? v : Number(v) || 0);
  const str = (v: unknown): string => (typeof v === "string" ? v : String(v ?? ""));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href={toolSlug}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại công cụ {toolName}</span>
        </Link>

        <div className="flex items-center gap-2">
          <CopyButton textToCopy={""} />
          <Link href={toolSlug}>
            <Button size="sm" className="gap-1.5 text-xs">
              <span>Mở công cụ</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Header Card */}
      <Card className="border-border/80 bg-card/70 backdrop-blur-md shadow-lg overflow-hidden">
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-background border border-border flex items-center justify-center shadow-sm">
                {ICON_MAP[calculation.toolId] || <Sparkles className="h-6 w-6 text-primary" />}
              </div>
              <div>
                <Badge variant="accent" className="text-[10px] mb-1">
                  {toolName}
                </Badge>
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
                  {calculation.title}
                </h1>
              </div>
            </div>

            <Badge variant="success" className="gap-1 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Đã lưu trên Supabase
            </Badge>
          </div>

          {/* Meta Information Bar */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/60">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-indigo-500" />
              <span>{calculation.viewCount} lượt xem</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-emerald-500" />
              <span>{(calculation.dataSizeBytes / 1024).toFixed(2)} KB dữ liệu</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Snapshot Content based on Tool Type */}
      <div className="space-y-6">
        {/* LOAN CALCULATOR SNAPSHOT */}
        {calculation.toolId === "loan-calculator" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4 bg-muted/40 border-border">
                <p className="text-xs text-muted-foreground">Số tiền vay gốc</p>
                <p className="text-lg font-bold text-foreground mt-1">
                  {formatCurrency(num(inputData.principal))}
                </p>
              </Card>
              <Card className="p-4 bg-muted/40 border-border">
                <p className="text-xs text-muted-foreground">Lãi suất năm</p>
                <p className="text-lg font-bold text-indigo-500 mt-1">
                  {num(inputData.annualInterestRate)}%/năm
                </p>
              </Card>
              <Card className="p-4 bg-muted/40 border-border">
                <p className="text-xs text-muted-foreground">Thời hạn vay</p>
                <p className="text-lg font-bold text-foreground mt-1">
                  {inputData.termYears ? `${num(inputData.termYears)} năm` : `${num(inputData.termMonthsInput)} tháng`}
                </p>
              </Card>
              <Card className="p-4 bg-muted/40 border-border">
                <p className="text-xs text-muted-foreground">Phương thức tính</p>
                <p className="text-sm font-bold text-foreground mt-1">
                  {str(inputData.method) === "reducing_balance" ? "Dư nợ giảm dần" : "Dư nợ gốc"}
                </p>
              </Card>
            </div>

            {resultData && (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base font-bold">Kết Quả Tính Toán Đã Lưu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div>
                      <p className="text-xs text-muted-foreground">Tổng tiền lãi phải trả</p>
                      <p className="text-lg font-extrabold text-primary mt-1">
                        {formatCurrency(num(resultData.totalInterest))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tổng số tiền gốc + lãi</p>
                      <p className="text-lg font-extrabold text-foreground mt-1">
                        {formatCurrency(num(resultData.totalPayment))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tháng đầu trả cao nhất</p>
                      <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                        {formatCurrency(num(resultData.firstMonthPayment || resultData.maxMonthlyPayment))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* BILL SPLIT SNAPSHOT */}
        {calculation.toolId === "bill-split" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4 bg-muted/40 border-border">
                <p className="text-xs text-muted-foreground">Tiền món trước thuế</p>
                <p className="text-lg font-bold text-foreground mt-1">
                  {formatCurrency(num(inputData.subtotal))}
                </p>
              </Card>
              <Card className="p-4 bg-muted/40 border-border">
                <p className="text-xs text-muted-foreground">Số người chia</p>
                <p className="text-lg font-bold text-indigo-500 mt-1">
                  {num(inputData.numberOfPeople || inputData.numPeople || 1)} người
                </p>
              </Card>
              <Card className="p-4 bg-muted/40 border-border">
                <p className="text-xs text-muted-foreground">Mỗi người thanh toán</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(num(resultData.perPersonAmount || resultData.roundedPerPersonTotal))}
                </p>
              </Card>
            </div>
          </div>
        )}

        {/* INTEREST RATE SNAPSHOT */}
        {calculation.toolId === "interest-rate" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card className="p-4 bg-muted/40 border-border">
                <p className="text-xs text-muted-foreground">Tiền gốc ban đầu</p>
                <p className="text-lg font-bold text-foreground mt-1">
                  {formatCurrency(num(inputData.initialPrincipal || inputData.initialAmount))}
                </p>
              </Card>
              <Card className="p-4 bg-muted/40 border-border">
                <p className="text-xs text-muted-foreground">Lãi suất gửi</p>
                <p className="text-lg font-bold text-emerald-500 mt-1">
                  {num(inputData.annualInterestRate || inputData.annualRate)}%/năm
                </p>
              </Card>
              <Card className="p-4 bg-muted/40 border-border">
                <p className="text-xs text-muted-foreground">Thời gian tích lũy</p>
                <p className="text-lg font-bold text-foreground mt-1">
                  {num(inputData.durationYears || inputData.years)} năm
                </p>
              </Card>
              <Card className="p-4 bg-muted/40 border-border">
                <p className="text-xs text-muted-foreground">Tổng tài sản đạt được</p>
                <p className="text-lg font-bold text-primary mt-1">
                  {formatCurrency(num(resultData.finalBalance))}
                </p>
              </Card>
            </div>
          </div>
        )}

        {/* CURRENCY CONVERTER SNAPSHOT */}
        {calculation.toolId === "currency-converter" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4 bg-muted/40 border-border">
                <p className="text-xs text-muted-foreground">Số tiền nguồn</p>
                <p className="text-lg font-bold text-foreground mt-1">
                  {formatNumber(num(inputData.amount))} {str(inputData.fromCurrency)}
                </p>
              </Card>
              <Card className="p-4 bg-muted/40 border-border">
                <p className="text-xs text-muted-foreground">Tỷ giá áp dụng</p>
                <p className="text-lg font-bold text-indigo-500 mt-1">
                  1 {str(inputData.fromCurrency)} = {formatNumber(num(resultData.rate))} {str(inputData.toCurrency)}
                </p>
              </Card>
              <Card className="p-4 bg-muted/40 border-border">
                <p className="text-xs text-muted-foreground">Quy đổi thành</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatNumber(num(resultData.result))} {str(inputData.toCurrency)}
                </p>
              </Card>
            </div>
          </div>
        )}

        {/* Raw Snapshot Details Card */}
        <Card className="border-border/80 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span>Chi Tiết Dữ Liệu Lưu Trữ (JSON Snapshot)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3.5 rounded-xl bg-muted/50 border border-border/60 text-xs font-mono overflow-x-auto max-h-60">
              <pre>{JSON.stringify({ inputData, resultData }, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom CTA */}
      <div className="text-center py-6">
        <Link href={toolSlug}>
          <Button size="lg" className="rounded-2xl gap-2 font-bold px-8 shadow-md shadow-primary/20">
            <span>Tiếp Tục Tính Toán Trong {toolName}</span>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

