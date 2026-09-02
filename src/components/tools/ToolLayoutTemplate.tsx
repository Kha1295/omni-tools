"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronRight,
  Sparkles,
  HelpCircle,
  BookOpen,
  Share2,
  RotateCcw,
  Check,
  Coins,
  ArrowLeftRight,
  Code2,
  Calculator,
  FileText,
  TrendingUp,
  Receipt,
  ShieldCheck,
  Landmark,
} from "lucide-react";
import { ToolMetadata } from "@/config/tools.config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionItem } from "@/components/ui/accordion";

const ICON_MAP: Record<string, React.ReactNode> = {
  Coins: <Coins className="h-6 w-6 text-emerald-500" />,
  ArrowLeftRight: <ArrowLeftRight className="h-6 w-6 text-blue-500" />,
  Code2: <Code2 className="h-6 w-6 text-purple-500" />,
  Calculator: <Calculator className="h-6 w-6 text-amber-500" />,
  FileText: <FileText className="h-6 w-6 text-rose-500" />,
  TrendingUp: <TrendingUp className="h-6 w-6 text-emerald-500" />,
  Receipt: <Receipt className="h-6 w-6 text-teal-500" />,
  Landmark: <Landmark className="h-6 w-6 text-indigo-500" />,
};

interface ToolLayoutTemplateProps {
  tool: ToolMetadata;
  children: React.ReactNode; // Interactive Calculator Body
  onReset?: () => void;
}

export function ToolLayoutTemplate({
  tool,
  children,
  onReset,
}: ToolLayoutTemplateProps) {
  const [copied, setCopied] = React.useState(false);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Generate Schema.org JSON-LD for SoftwareApplication and FAQPage
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "name": tool.name,
        "operatingSystem": "All",
        "applicationCategory": "UtilitiesApplication",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "description": tool.seo.description,
      },
      {
        "@type": "FAQPage",
        "mainEntity": tool.faqs.map((faq) => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs text-muted-foreground"
      >
        <Link href="/" className="hover:text-foreground transition-colors">
          Trang chủ
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href={`/?category=${tool.category}`}
          className="hover:text-foreground transition-colors"
        >
          {tool.categoryName}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-foreground truncate">{tool.name}</span>
      </nav>

      {/* Tool Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-card via-card/80 to-primary/5 border border-border/80 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-background border border-border shadow-sm flex items-center justify-center shrink-0">
            {ICON_MAP[tool.icon] || <Sparkles className="h-7 w-7 text-primary" />}
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {tool.name}
              </h1>
              {tool.badge && (
                <Badge variant="accent" className="font-semibold">
                  {tool.badge}
                </Badge>
              )}
              <Badge variant="success" className="gap-1">
                <ShieldCheck className="h-3 w-3" />
                Chính xác 100%
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
              {tool.fullDesc}
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tool.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] bg-muted px-2.5 py-0.5 rounded-full text-muted-foreground font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Toolbar Actions */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          {onReset && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="gap-1.5 text-xs rounded-xl"
            >
              <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Đặt lại</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="gap-1.5 text-xs rounded-xl"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-500">Đã copy link!</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Chia sẻ</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Interactive Tool Body (Input + Result + Charts) */}
      <div className="min-h-[400px]">{children}</div>

      {/* Formula & How It Works Section */}
      {tool.formulaContent && (
        <Card className="border-border/80 bg-card/60 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-bold">
                {tool.formulaTitle || "Công Thức & Phương Pháp Tính"}
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Mô tả chi tiết giải thuật toán học được thực thi trên máy khách (Client-side)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="p-3.5 rounded-xl bg-muted/60 border border-border/60 font-mono text-xs sm:text-sm text-primary font-semibold overflow-x-auto">
              <code>{tool.formulaContent}</code>
            </div>
            {tool.formulaExample && (
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                💡 <strong className="text-foreground">Ví dụ minh họa:</strong> {tool.formulaExample}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* FAQ Section (SEO Optimized) */}
      {tool.faqs && tool.faqs.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              Câu Hỏi Thường Gặp (FAQ)
            </h2>
          </div>
          <Accordion>
            {tool.faqs.map((faq, idx) => (
              <AccordionItem
                key={idx}
                id={`faq-${idx}`}
                title={faq.question}
                defaultOpen={idx === 0}
              >
                {faq.answer}
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  );
}
