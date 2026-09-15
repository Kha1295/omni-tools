"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

export function CopyButton({ textToCopy }: { textToCopy?: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    const url = textToCopy || (typeof window !== "undefined" ? window.location.href : "");
    if (url && typeof window !== "undefined") {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="gap-1.5 text-xs rounded-xl"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-emerald-500 font-semibold">Đã copy link!</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Sao chép link</span>
        </>
      )}
    </Button>
  );
}

