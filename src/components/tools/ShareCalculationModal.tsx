"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveCalculationAction } from "@/app/actions/calculations.action";
import { Share2, Check, Copy, ExternalLink, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";

interface ShareCalculationModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolId: string;
  defaultTitle: string;
  inputData: Record<string, unknown>;
  resultData: Record<string, unknown>;
}

export function ShareCalculationModal({
  isOpen,
  onClose,
  toolId,
  defaultTitle,
  inputData,
  resultData,
}: ShareCalculationModalProps) {
  const [title, setTitle] = React.useState(defaultTitle);
  const [loading, setLoading] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setTitle(defaultTitle);
      setShareUrl(null);
      setError(null);
      setCopied(false);
    }
  }, [isOpen, defaultTitle]);

  const handleSaveAndShare = async () => {
    if (!title.trim()) {
      setError("Vui lòng nhập tên/tiêu đề cho bảng tính");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await saveCalculationAction({
        toolId,
        title: title.trim(),
        inputData,
        resultData,
      });

      if (res.success && res.shareUrl) {
        const fullUrl =
          typeof window !== "undefined"
            ? `${window.location.origin}${res.shareUrl}`
            : res.shareUrl;
        setShareUrl(fullUrl);
      } else {
        setError(res.error || "Không thể lưu kết quả tính toán");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi khi kết nối máy chủ";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (shareUrl && typeof window !== "undefined") {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`w-full max-w-lg bg-card border border-border/80 rounded-2xl p-6 shadow-2xl space-y-5 transform transition-all duration-200 ${
          isOpen ? "scale-100" : "scale-95"
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Lưu & Chia Sẻ Kết Quả Tính
              </h3>
              <p className="text-xs text-muted-foreground">
                Tạo liên kết cố định (Permalink) lưu trên PostgreSQL Supabase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm font-bold p-1 rounded-lg hover:bg-muted"
          >
            ✕
          </button>
        </div>

        {!shareUrl ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Đặt tên phương án / Ghi chú:
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Phương án vay 1 Tỷ - Dư nợ giảm dần 5 năm"
                className="text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Tên này sẽ hiển thị ở đầu trang kết quả khi người khác mở liên kết.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {error}
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Tính năng Snapshot:</span>
              </div>
              <p>
                Toàn bộ tham số đầu vào và kết quả chi tiết sẽ được lưu nguyên vẹn. Bất kỳ ai có liên kết đều có thể mở xem hoặc bấm để tiếp tục tính toán.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleSaveAndShare}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang lưu vào DB...</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    <span>Lưu & Lấy Link</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 space-y-1 text-xs">
              <p className="font-bold flex items-center gap-1.5">
                <Check className="h-4 w-4" />
                Đã lưu thành công vào Supabase!
              </p>
              <p>Liên kết chia sẻ của bạn đã sẵn sàng:</p>
            </div>

            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={shareUrl}
                className="font-mono text-xs select-all bg-muted/50"
              />
              <Button
                onClick={handleCopy}
                size="sm"
                variant={copied ? "default" : "outline"}
                className="shrink-0 gap-1.5 text-xs"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-white" />
                    <span>Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </Button>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Link
                href={shareUrl}
                target="_blank"
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>Xem trang chia sẻ</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
              <Button variant="outline" size="sm" onClick={onClose}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

