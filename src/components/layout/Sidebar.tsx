"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Coins,
  ArrowLeftRight,
  Code2,
  Calculator,
  FileText,
  TrendingUp,
  Receipt,
  LayoutGrid,
  Shield,
  Landmark,
} from "lucide-react";
import { CATEGORIES, TOOLS_CONFIG } from "@/config/tools.config";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ReactNode> = {
  Coins: <Coins className="h-4 w-4 text-emerald-500" />,
  ArrowLeftRight: <ArrowLeftRight className="h-4 w-4 text-blue-500" />,
  Code2: <Code2 className="h-4 w-4 text-purple-500" />,
  Calculator: <Calculator className="h-4 w-4 text-amber-500" />,
  FileText: <FileText className="h-4 w-4 text-rose-500" />,
  TrendingUp: <TrendingUp className="h-4 w-4 text-emerald-500" />,
  Receipt: <Receipt className="h-4 w-4 text-teal-500" />,
  Landmark: <Landmark className="h-4 w-4 text-indigo-500" />,
};

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-16 bottom-0 left-0 z-40 w-72 bg-card/60 backdrop-blur-md border-r border-border/80 flex flex-col transition-transform duration-300 lg:translate-x-0 overflow-y-auto",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-4 space-y-6 flex-1">
          {/* Main Navigation */}
          <div>
            <div className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-wider px-3 mb-2">
              Khám Phá
            </div>
            <Link
              href="/"
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all",
                pathname === "/"
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Tất cả công cụ</span>
              <Badge
                variant={pathname === "/" ? "secondary" : "outline"}
                className="ml-auto text-[11px] px-1.5 py-0"
              >
                {TOOLS_CONFIG.length}
              </Badge>
            </Link>
          </div>

          {/* Categories & Tools */}
          {CATEGORIES.map((cat) => {
            const categoryTools = TOOLS_CONFIG.filter((t) => t.category === cat.id);
            return (
              <div key={cat.id} className="space-y-1">
                <div className="flex items-center justify-between px-3 mb-1.5">
                  <span className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
                    {ICON_MAP[cat.icon]}
                    {cat.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {categoryTools.length}
                  </span>
                </div>

                {categoryTools.map((tool) => {
                  const isActive = pathname === tool.slug;
                  return (
                    <Link
                      key={tool.id}
                      href={tool.slug}
                      onClick={onClose}
                      className={cn(
                        "group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all",
                        isActive
                          ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      )}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="shrink-0">{ICON_MAP[tool.icon]}</span>
                        <span className="truncate">{tool.name}</span>
                      </div>
                      {tool.badge && (
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.2 rounded font-semibold shrink-0 ml-1",
                            tool.badge === "Phổ biến"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          )}
                        >
                          {tool.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Bottom Feature Card */}
        <div className="p-4 m-3 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold text-xs">
            <Shield className="h-4 w-4 text-emerald-500" />
            <span>100% Client-Side Privacy</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Mọi tính toán chạy trực tiếp trên máy của bạn. Không lưu trữ, không rò rỉ dữ liệu.
          </p>
        </div>
      </aside>
    </>
  );
}
