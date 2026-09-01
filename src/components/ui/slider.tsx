import * as React from "react";
import { cn } from "@/lib/utils";

export interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
  leftLabel?: string;
  rightLabel?: string;
  unit?: string;
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  className,
  leftLabel,
  rightLabel,
  unit,
}: SliderProps) {
  const percentage = Math.min(
    100,
    Math.max(0, ((value - min) / (max - min)) * 100)
  );

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      <div className="relative flex items-center select-none touch-none w-full">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${percentage}%, hsl(var(--secondary)) ${percentage}%, hsl(var(--secondary)) 100%)`,
          }}
        />
      </div>
      {(leftLabel || rightLabel || unit) && (
        <div className="flex justify-between text-xs text-muted-foreground font-medium">
          <span>{leftLabel ?? `${min}${unit || ""}`}</span>
          <span className="font-semibold text-foreground">
            {value}
            {unit || ""}
          </span>
          <span>{rightLabel ?? `${max}${unit || ""}`}</span>
        </div>
      )}
    </div>
  );
}
