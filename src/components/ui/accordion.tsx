"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccordionItemProps {
  id?: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function AccordionItem({
  title,
  children,
  defaultOpen = false,
}: AccordionItemProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="border border-border/80 rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm transition-all duration-200 hover:border-border">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 text-left font-medium text-foreground transition-all hover:bg-muted/40"
        aria-expanded={isOpen}
      >
        <span className="text-sm md:text-base font-semibold">{title}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0 ml-2",
            isOpen && "rotate-180 text-primary"
          )}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-1 text-sm text-muted-foreground leading-relaxed animate-fade-in border-t border-border/40">
          {children}
        </div>
      )}
    </div>
  );
}

export function Accordion({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-3", className)}>{children}</div>;
}
