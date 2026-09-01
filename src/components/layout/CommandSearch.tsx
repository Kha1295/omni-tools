"use client";

import * as React from "react";
import Link from "next/link";
import { Search, X, ArrowRight, Sparkles, Coins, ArrowLeftRight, Code2, Calculator, FileText, TrendingUp, Receipt } from "lucide-react";
import { searchTools, ToolMetadata } from "@/config/tools.config";
import { Badge } from "@/components/ui/badge";

const ICON_MAP: Record<string, React.ReactNode> = {
  Coins: <Coins className="h-4 w-4 text-emerald-500" />,
  ArrowLeftRight: <ArrowLeftRight className="h-4 w-4 text-blue-500" />,
  Code2: <Code2 className="h-4 w-4 text-purple-500" />,
  Calculator: <Calculator className="h-4 w-4 text-amber-500" />,
  FileText: <FileText className="h-4 w-4 text-rose-500" />,
  TrendingUp: <TrendingUp className="h-4 w-4 text-emerald-500" />,
  Receipt: <Receipt className="h-4 w-4 text-teal-500" />,
};

interface CommandSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandSearch({ isOpen, onClose }: CommandSearchProps) {
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          const btn = document.getElementById("search-modal-trigger");
          btn?.click();
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const results: ToolMetadata[] = searchTools(query);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Box */}
        <div className="flex items-center px-4 border-b border-border/80 bg-muted/30">
          <Search className="h-5 w-5 text-muted-foreground shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Tìm kiếm công cụ, tính năng, từ khóa... (ví dụ: lãi kép, bill, đổi tiền)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-14 w-full bg-transparent text-foreground placeholder:text-muted-foreground/70 focus:outline-none text-base font-normal"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground mr-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-1.5">
          {results.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium text-foreground">Không tìm thấy công cụ phù hợp</p>
              <p className="text-xs text-muted-foreground mt-1">
                Thử tìm với từ khóa &ldquo;lãi suất&rdquo;, &ldquo;hóa đơn&rdquo; hoặc &ldquo;tiền tệ&rdquo;
              </p>
            </div>
          ) : (
            results.map((tool) => (
              <Link
                key={tool.id}
                href={tool.slug}
                onClick={onClose}
                className="group flex items-center justify-between p-3 rounded-xl hover:bg-accent/70 transition-all text-left"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-primary/40 transition-all shadow-sm">
                    {ICON_MAP[tool.icon] || <Sparkles className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                        {tool.name}
                      </span>
                      {tool.badge && (
                        <Badge variant="accent" className="text-[10px] px-1.5 py-0">
                          {tool.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {tool.shortDesc}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="hidden md:inline-block text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {tool.categoryName}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Search Footer */}
        <div className="p-3 bg-muted/40 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>{results.length} công cụ khả dụng</span>
          <span className="flex items-center gap-1.5">
            Duyệt nhanh với <kbd className="font-mono bg-card px-1.5 py-0.5 rounded border border-border">Enter</kbd>
          </span>
        </div>
      </div>
    </div>
  );
}
