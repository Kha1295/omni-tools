"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Sun, Moon, Sparkles, Menu, Zap } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  onOpenSearch: () => void;
  onToggleSidebar?: () => void;
}

export function Header({ onOpenSearch, onToggleSidebar }: HeaderProps) {
  const { isDark, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl border border-border bg-card/80 hover:bg-muted text-muted-foreground transition-all"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Zap className="h-5 w-5 fill-white/20" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
                  omni<span className="text-primary font-black">.tools</span>
                </span>
                <Badge variant="success" className="text-[10px] px-1.5 py-0 hidden sm:inline-flex">
                  Client-side
                </Badge>
              </div>
            </div>
          </Link>
        </div>

        {/* Center: Quick Search Trigger Button */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            id="search-modal-trigger"
            type="button"
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-muted-foreground bg-muted/60 hover:bg-muted/90 border border-border/80 rounded-xl transition-all shadow-sm"
          >
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              <span>Tìm kiếm công cụ...</span>
            </span>
            <kbd className="inline-flex items-center gap-0.5 rounded border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground font-mono">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Quick Actions & Theme Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSearch}
            className="md:hidden p-2 rounded-xl border border-border bg-card/80 hover:bg-muted text-muted-foreground transition-all"
            aria-label="Search tools"
          >
            <Search className="h-5 w-5" />
          </button>

          <Link
            href="/finance/interest-rate"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/15 border border-primary/20 px-3 py-2 rounded-xl transition-all"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Lãi kép</span>
          </Link>

          <Link
            href="/finance/bill-split"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted border border-border px-3 py-2 rounded-xl transition-all"
          >
            <span>Chia bill</span>
          </Link>

          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="p-2.5 rounded-xl border border-border bg-card/80 hover:bg-muted text-foreground transition-all"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-500" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
