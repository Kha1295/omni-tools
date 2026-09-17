"use client";

import * as React from "react";
import { getToolBySlug } from "@/config/tools.config";
import { ToolLayoutTemplate } from "@/components/tools/ToolLayoutTemplate";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MediaVideoResult,
  MediaDownloadOption,
  detectPlatform,
} from "@/lib/services/mediaDownloader";
import { saveGuestHistoryItem } from "@/lib/guestHistory";
import {
  Download,
  Link as LinkIcon,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  Loader2,
  X,
  Clipboard,
  Play,
  Film,
  Globe,
} from "lucide-react";

const toolMetadata = getToolBySlug("/media/video-downloader")!;

type PlatformOption = "auto" | "facebook" | "twitter" | "threads";

export default function SocialVideoDownloaderPage() {
  const [selectedPlatform, setSelectedPlatform] = React.useState<PlatformOption>("auto");
  const [urlInput, setUrlInput] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<MediaVideoResult | null>(null);
  const [copiedUrl, setCopiedUrl] = React.useState<string | null>(null);
  const [downloadingUrl, setDownloadingUrl] = React.useState<string | null>(null);

  // Auto detect platform based on typed/pasted URL
  const detectedPlatform = React.useMemo(() => {
    if (!urlInput.trim()) return "unknown";
    return detectPlatform(urlInput);
  }, [urlInput]);

  const handlePasteClipboard = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrlInput(text.trim());
          setError(null);
        }
      }
    } catch {
      // Clipboard access denied
    }
  };

  const handleClear = () => {
    setUrlInput("");
    setResult(null);
    setError(null);
  };

  const handleFetchMedia = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setError("Vui lòng nhập hoặc dán đường dẫn (link) video bài viết.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/media/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: trimmed,
          platform: selectedPlatform !== "auto" ? selectedPlatform : undefined,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || "Không thể lấy link tải video.");
      }

      const mediaData: MediaVideoResult = json.data;
      setResult(mediaData);

      // Save to guest history for easy access
      saveGuestHistoryItem({
        toolId: "social-video-downloader",
        title: `Tải Video ${mediaData.platform === "facebook" ? "Facebook" : mediaData.platform === "twitter" ? "X / Twitter" : "Threads"}: ${(mediaData.title || "Video").substring(0, 50)}`,
        inputData: { url: trimmed, platform: selectedPlatform },
        resultData: {
          platform: mediaData.platform,
          id: mediaData.id,
          title: mediaData.title,
          downloadsCount: mediaData.downloads.length,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi khi lấy link tải.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async (downloadUrl: string) => {
    try {
      await navigator.clipboard.writeText(downloadUrl);
      setCopiedUrl(downloadUrl);
      setTimeout(() => setCopiedUrl(null), 2500);
    } catch {
      // ignore
    }
  };

  const handleDownload = (option: MediaDownloadOption) => {
    if (!result) return;
    setDownloadingUrl(option.url);

    const safeTitle = (result.title || "omni-tools-video")
      .slice(0, 40)
      .replace(/[^\w\s-]/gi, "")
      .trim()
      .replace(/\s+/g, "_");

    const extension = option.format || "mp4";
    const filename = `${result.platform}_${safeTitle}_${option.quality}.${extension}`;
    const streamUrl = `/api/media/stream?url=${encodeURIComponent(option.url)}&filename=${encodeURIComponent(filename)}`;

    // Trigger browser download
    const a = document.createElement("a");
    a.href = streamUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      setDownloadingUrl(null);
    }, 1500);
  };

  const getPlatformBadge = (p: string) => {
    switch (p) {
      case "facebook":
        return <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-medium">🔵 Facebook</Badge>;
      case "twitter":
        return <Badge className="bg-zinc-800 hover:bg-zinc-900 text-white font-medium">⚫ X (Twitter)</Badge>;
      case "threads":
        return <Badge className="bg-gradient-to-r from-pink-600 to-rose-600 text-white font-medium">🔴 Threads</Badge>;
      default:
        return null;
    }
  };

  return (
    <ToolLayoutTemplate
      tool={toolMetadata}
      onReset={handleClear}
      onShareData={
        result
          ? () => ({
              title: `Tải Video ${result.platform.toUpperCase()}: ${result.title.substring(0, 50)}`,
              inputData: { url: urlInput, platform: selectedPlatform },
              resultData: {
                platform: result.platform,
                title: result.title,
                downloads: result.downloads.map((d) => ({
                  quality: d.quality,
                  resolution: d.resolution,
                  format: d.format,
                })),
              },
            })
          : undefined
      }
    >
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Main Downloader Card */}
        <Card className="border-border/60 shadow-xl overflow-hidden bg-card/80 backdrop-blur-sm">
          <CardHeader className="border-b border-border/40 pb-6 bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <Film className="h-6 w-6 text-rose-500" />
                  Tải Video Trực Tuyến Nhanh Chóng
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  Hỗ trợ Facebook (Reels, Watch, Video), X (Twitter) và Threads chất lượng Full HD.
                </CardDescription>
              </div>

              {/* Platform Selector Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-muted/80 rounded-xl border border-border/60">
                <button
                  type="button"
                  onClick={() => setSelectedPlatform("auto")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    selectedPlatform === "auto"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  Tự Động
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlatform("facebook")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedPlatform === "facebook"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Facebook
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlatform("twitter")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedPlatform === "twitter"
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  X (Twitter)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlatform("threads")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedPlatform === "threads"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Threads
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 sm:p-8 space-y-6">
            <form onSubmit={handleFetchMedia} className="space-y-4">
              {/* Input Bar */}
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-muted-foreground pointer-events-none">
                  <LinkIcon className="h-5 w-5" />
                </div>
                <Input
                  type="url"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Dán liên kết video hoặc bài viết từ Facebook, X hoặc Threads vào đây..."
                  className="pl-11 pr-24 py-6 text-sm sm:text-base rounded-xl border-border focus-visible:ring-primary shadow-inner"
                  disabled={loading}
                  autoComplete="off"
                />

                {/* Right utility buttons inside input */}
                <div className="absolute right-2.5 flex items-center gap-1.5">
                  {urlInput ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClear}
                      className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handlePasteClipboard}
                      className="h-8 px-2.5 rounded-lg text-xs font-medium gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <Clipboard className="h-3.5 w-3.5" />
                      Dán
                    </Button>
                  )}
                </div>
              </div>

              {/* Detected Platform Tag */}
              {detectedPlatform !== "unknown" && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                  <span>Phát hiện nền tảng:</span>
                  {getPlatformBadge(detectedPlatform)}
                </div>
              )}

              {/* Action Button: Lấy Link Download */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={loading || !urlInput.trim()}
                  size="lg"
                  className="w-full sm:w-auto px-8 py-6 rounded-xl font-semibold gap-2 shadow-md bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white transition-all transform active:scale-95"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Đang Trích Xuất Link...
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5" />
                      Lấy Link Tải
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3 animate-in fade-in-50 duration-200">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Không thể lấy link tải video</p>
                  <p className="text-xs sm:text-sm text-destructive/90">{error}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Result Area */}
        {result && (
          <Card className="border-border/60 shadow-xl overflow-hidden bg-card animate-in fade-in-50 slide-in-from-bottom-4 duration-300">
            <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                  <CardTitle className="text-lg font-bold">Video Sẵn Sàng Tải Về</CardTitle>
                </div>
                <div>{getPlatformBadge(result.platform)}</div>
              </div>
            </CardHeader>

            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Media Preview & Info Header */}
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Thumbnail Preview */}
                <div className="relative w-full sm:w-56 aspect-video sm:aspect-square rounded-xl overflow-hidden bg-muted border border-border/60 flex-shrink-0 shadow-sm group">
                  {result.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={result.thumbnail}
                      alt={result.title || "Video thumbnail"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted/60">
                      <Film className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="h-10 w-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-primary">
                      <Play className="h-5 w-5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Author & Post Info */}
                <div className="flex-1 space-y-3">
                  {result.author && (
                    <div className="flex items-center gap-2.5">
                      {result.author.avatar && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={result.author.avatar}
                          alt={result.author.name}
                          className="h-8 w-8 rounded-full object-cover border border-border"
                        />
                      )}
                      <div>
                        <p className="text-sm font-semibold leading-none">{result.author.name}</p>
                        {result.author.username && (
                          <p className="text-xs text-muted-foreground mt-0.5">{result.author.username}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <h3 className="text-base font-semibold line-clamp-3 text-foreground leading-relaxed">
                    {result.title || "Không có tiêu đề bài viết"}
                  </h3>

                  <div className="pt-2 flex flex-wrap gap-2">
                    <a
                      href={result.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Xem bài đăng gốc
                    </a>
                  </div>
                </div>
              </div>

              {/* Download Options Table */}
              <div className="space-y-3 pt-4 border-t border-border/40">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Tùy Chọn Tải Xuống ({result.downloads.length} tùy chọn)
                </h4>

                <div className="divide-y divide-border/40 rounded-xl border border-border/60 overflow-hidden bg-background">
                  {result.downloads.map((opt, idx) => (
                    <div
                      key={idx}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                    >
                      {/* Left: Quality & details */}
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={opt.quality === "HD" ? "default" : "secondary"}
                          className={`px-3 py-1 font-bold text-xs uppercase tracking-wide ${
                            opt.quality === "HD"
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          {opt.quality}
                        </Badge>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {opt.resolution || `Video ${opt.format.toUpperCase()}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Định dạng: <span className="uppercase font-medium">{opt.format}</span>
                            {opt.size ? ` • Dung lượng: ${opt.size}` : ""}
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(opt.url)}
                          className="flex-1 sm:flex-initial text-xs gap-1.5"
                          title="Sao chép link tải trực tiếp"
                        >
                          {copiedUrl === opt.url ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                              Đã chép
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              Chép Link
                            </>
                          )}
                        </Button>

                        <a
                          href={opt.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hidden sm:inline-flex"
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs gap-1 text-muted-foreground hover:text-foreground"
                            title="Mở video trong tab mới"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Xem
                          </Button>
                        </a>

                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleDownload(opt)}
                          disabled={downloadingUrl === opt.url}
                          className="flex-1 sm:flex-initial text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                        >
                          {downloadingUrl === opt.url ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Đang tải...
                            </>
                          ) : (
                            <>
                              <Download className="h-3.5 w-3.5" />
                              Tải Video
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Instructions / Notice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
          <Card className="border-border/60 bg-muted/10 p-4">
            <div className="flex items-center gap-2 font-semibold text-foreground mb-1">
              <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
                1
              </span>
              Sao chép liên kết
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Mở Facebook, X hoặc Threads, chọn &apos;Chia sẻ&apos; và bấm &apos;Sao chép liên kết&apos; (Copy Link) của bài viết video.
            </p>
          </Card>

          <Card className="border-border/60 bg-muted/10 p-4">
            <div className="flex items-center gap-2 font-semibold text-foreground mb-1">
              <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
                2
              </span>
              Lấy link tải
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Dán liên kết vào ô nhập bên trên và bấm nút &apos;Lấy Link Tải&apos; để hệ thống tự động phân tích luồng video.
            </p>
          </Card>

          <Card className="border-border/60 bg-muted/10 p-4">
            <div className="flex items-center gap-2 font-semibold text-foreground mb-1">
              <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
                3
              </span>
              Tải video về máy
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Bấm nút &apos;Tải Video&apos; ở chất lượng HD hoặc SD để lưu file video MP4 trực tiếp vào bộ nhớ thiết bị của bạn.
            </p>
          </Card>
        </div>
      </div>
    </ToolLayoutTemplate>
  );
}
