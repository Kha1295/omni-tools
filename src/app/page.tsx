"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Cpu,
  Lock,
  TrendingUp,
  Receipt,
  Coins,
  ArrowLeftRight,
  Code2,
  Calculator,
  FileText,
  CheckCircle2,
} from "lucide-react";
import {
  CATEGORIES,
  TOOLS_CONFIG,
  searchTools,
} from "@/config/tools.config";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ICON_MAP: Record<string, React.ReactNode> = {
  Coins: <Coins className="h-6 w-6 text-emerald-500" />,
  ArrowLeftRight: <ArrowLeftRight className="h-6 w-6 text-blue-500" />,
  Code2: <Code2 className="h-6 w-6 text-purple-500" />,
  Calculator: <Calculator className="h-6 w-6 text-amber-500" />,
  FileText: <FileText className="h-6 w-6 text-rose-500" />,
  TrendingUp: <TrendingUp className="h-6 w-6 text-emerald-500" />,
  Receipt: <Receipt className="h-6 w-6 text-teal-500" />,
};

export default function HomePage() {
  const [activeCategory, setActiveCategory] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const filteredTools = React.useMemo(() => {
    let tools = searchTools(searchQuery);
    if (activeCategory !== "all") {
      tools = tools.filter((t) => t.category === activeCategory);
    }
    return tools;
  }, [searchQuery, activeCategory]);

  return (
    <div className="space-y-16 py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="relative text-center pt-8 pb-4 space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary animate-fade-in shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Nền tảng công cụ tiện ích thế hệ mới</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground max-w-4xl mx-auto leading-[1.15]">
          Tính Toán Chuẩn Xác.{" "}
          <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Bảo Mật Tuyệt Đối.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Bộ công cụ tính lãi kép, chia hóa đơn, quy đổi tỷ giá và tiện ích lập trình xử lý 100% Client-side bằng Decimal.js — không lưu dữ liệu, không sai số dấu phẩy động.
        </p>

        {/* Hero Search Box */}
        <div className="max-w-2xl mx-auto pt-2">
          <div className="relative flex items-center shadow-lg rounded-2xl overflow-hidden border border-border bg-card/90 backdrop-blur-md transition-all focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
            <Search className="h-5 w-5 text-muted-foreground ml-4 shrink-0" />
            <input
              type="text"
              placeholder="Tìm kiếm công cụ: Lãi kép, Chia bill, Tỷ giá ngoại tệ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 w-full bg-transparent px-4 text-foreground placeholder:text-muted-foreground/60 focus:outline-none text-sm sm:text-base"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="mr-2 text-xs"
              >
                Xóa
              </Button>
            )}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-semibold text-muted-foreground">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            <span>Zero Server Footprint</span>
          </div>
          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
            <Cpu className="h-4 w-4" />
            <span>Decimal.js High Precision</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <Zap className="h-4 w-4" />
            <span>Next.js 15 Fast Rendering</span>
          </div>
        </div>
      </section>

      {/* Category Pills & Tool Directory */}
      <section className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border/80 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === "all"
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                  : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              Tất Cả ({TOOLS_CONFIG.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = TOOLS_CONFIG.filter((t) => t.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    activeCategory === cat.id
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                      : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] opacity-80">({count})</span>
                </button>
              );
            })}
          </div>

          <span className="text-xs text-muted-foreground font-medium">
            Hiển thị {filteredTools.length} công cụ
          </span>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.slug}
              className="group block focus:outline-none"
            >
              <Card className="h-full border-border/80 bg-card/60 backdrop-blur-sm hover:border-primary/50 hover:shadow-glow-sm transition-all duration-300 flex flex-col justify-between overflow-hidden">
                <div className="p-6 space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-background border border-border flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:border-primary/40 transition-all">
                      {ICON_MAP[tool.icon] || (
                        <Sparkles className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    {tool.badge && (
                      <Badge
                        variant={tool.badge === "Phổ biến" ? "accent" : "success"}
                        className="text-[11px]"
                      >
                        {tool.badge}
                      </Badge>
                    )}
                  </div>

                  {/* Title & Desc */}
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {tool.shortDesc}
                    </p>
                  </div>

                  {/* Feature Highlights */}
                  <div className="space-y-1 pt-1">
                    {tool.features.slice(0, 2).map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Footer Launch */}
                <div className="px-6 py-3.5 bg-muted/30 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-primary">
                  <span>Mở công cụ</span>
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1.5 transition-transform" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Feature / Architecture Highlight Section */}
      <section className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-card via-card/80 to-primary/10 border border-border/80 shadow-md">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <Lock className="h-4 w-4" />
            <span>Kiến Trúc Mở Rộng & Bảo Mật Chuẩn Doanh Nghiệp</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Thiết kế Plugin-based mở rộng không giới hạn
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Dự án phân tách độc lập giữa Metadata (`tools.config.ts`), Core Math logic (`lib/math/`) và Giao diện UI (`components/`). Mỗi công cụ là một module riêng biệt được hỗ trợ tính toán chính xác tuyệt đối và tự động tối ưu hóa SEO.
          </p>
        </div>
      </section>
    </div>
  );
}
