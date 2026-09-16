"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getCalculationBySlug } from "@/app/actions/calculations.action";
import { TOOLS_CONFIG } from "@/config/tools.config";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Loader2,
  Share2,
} from "lucide-react";
import { CopyButton } from "./CopyButton";
import { SharedLoanVisualizer } from "@/components/share/SharedLoanVisualizer";
import { SharedBillSplitVisualizer } from "@/components/share/SharedBillSplitVisualizer";
import { SharedInterestVisualizer } from "@/components/share/SharedInterestVisualizer";
import { SharedCurrencyVisualizer } from "@/components/share/SharedCurrencyVisualizer";

const ICON_MAP: Record<string, React.ReactNode> = {
  "loan-calculator": <Calculator className="h-6 w-6 text-indigo-500" />,
  "bill-split": <Receipt className="h-6 w-6 text-teal-500" />,
  "interest-rate": <TrendingUp className="h-6 w-6 text-emerald-500" />,
  "currency-converter": <ArrowLeftRight className="h-6 w-6 text-blue-500" />,
};

interface CalculationData {
  id: string;
  toolId: string;
  title: string;
  inputData: Record<string, unknown>;
  resultData: Record<string, unknown>;
  shareSlug: string;
  isStarred: boolean;
  viewCount: number;
  dataSizeBytes: number;
  createdAt: string;
  updatedAt: string;
}

function SharedCalculationContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") || searchParams.get("s") || "";
  const [calculation, setCalculation] = React.useState<CalculationData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (slug) {
      setLoading(true);
      getCalculationBySlug(slug)
        .then((data) => {
          setCalculation(data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-4 text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-sm text-muted-foreground">Đang tải snapshot tính toán...</p>
      </div>
    );
  }

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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Top Breadcrumb & Actions */}
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

      {/* Shared Calculation Notice Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-950 dark:text-indigo-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
            <Share2 className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-bold text-foreground">
              Bạn đang xem kết quả được chia sẻ từ một phiên tính toán
            </p>
            <p className="text-xs text-muted-foreground">
              Tất cả thông số đầu vào, biểu đồ và kết quả chi tiết đã được phục hồi đầy đủ. Bạn có thể mở công cụ để thử các kịch bản mới.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <Link href={toolSlug}>
            <Button size="sm" className="gap-1.5 text-xs font-semibold shadow-sm">
              <span>Thử kịch bản mới</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Header Card */}
      <Card className="border-border/80 bg-card/70 backdrop-blur-md shadow-md overflow-hidden">
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

      {/* Tool-Specific Visualizer */}
      <div className="space-y-6">
        {calculation.toolId === "loan-calculator" && (
          <SharedLoanVisualizer inputData={inputData} resultData={resultData} />
        )}

        {calculation.toolId === "bill-split" && (
          <SharedBillSplitVisualizer inputData={inputData} resultData={resultData} />
        )}

        {calculation.toolId === "interest-rate" && (
          <SharedInterestVisualizer inputData={inputData} resultData={resultData} />
        )}

        {calculation.toolId === "currency-converter" && (
          <SharedCurrencyVisualizer inputData={inputData} resultData={resultData} />
        )}
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

export default function SharedCalculationPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto py-24 px-4 text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Đang tải snapshot tính toán...</p>
        </div>
      }
    >
      <SharedCalculationContent />
    </Suspense>
  );
}
