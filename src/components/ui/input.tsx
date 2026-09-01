import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  suffix?: string;
  prefix?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftIcon, rightIcon, suffix, prefix, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3 text-muted-foreground pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}
        {prefix && (
          <span className="absolute left-3 text-sm text-muted-foreground font-medium pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-xl border border-border bg-background/80 backdrop-blur-sm px-3.5 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50",
            leftIcon && "pl-10",
            prefix && "pl-9",
            rightIcon && "pr-10",
            suffix && "pr-12",
            className
          )}
          ref={ref}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3.5 text-xs text-muted-foreground font-medium pointer-events-none bg-muted/60 px-1.5 py-0.5 rounded">
            {suffix}
          </span>
        )}
        {rightIcon && (
          <div className="absolute right-3 text-muted-foreground pointer-events-none flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
