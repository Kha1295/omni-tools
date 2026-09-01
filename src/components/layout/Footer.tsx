import * as React from "react";
import Link from "next/link";
import { Zap, ShieldCheck, Heart, Cpu } from "lucide-react";
import { CATEGORIES, TOOLS_CONFIG } from "@/config/tools.config";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/80 bg-card/40 backdrop-blur-sm mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand & Philosophy */}
          <div className="space-y-3 md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Zap className="h-4 w-4 fill-white/20" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-foreground">
                omni<span className="text-primary font-black">.tools</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              Nền tảng công cụ tiện ích web thế hệ mới. Xử lý thuật toán tài chính và chuyển đổi chính xác tuyệt đối trên client-side với Decimal.js, giao diện hiện đại và bảo mật dữ liệu tuyệt đối.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="h-4 w-4" />
                <span>Zero Server Footprint</span>
              </div>
              <div className="flex items-center gap-1 font-semibold">
                <Cpu className="h-4 w-4 text-primary" />
                <span>Next.js 15 App Router</span>
              </div>
            </div>
          </div>

          {/* Col 2: Popular Tools */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Công Cụ Phổ Biến
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {TOOLS_CONFIG.slice(0, 4).map((tool) => (
                <li key={tool.id}>
                  <Link
                    href={tool.slug}
                    className="hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    <span>{tool.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Danh Mục Tiện Ích
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/?category=${cat.id}`}
                    className="hover:text-primary transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} omni-tools. Nền tảng tiện ích mã nguồn mở & bảo mật tối đa.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1">
              Phát triển với <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" /> và TypeScript
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
