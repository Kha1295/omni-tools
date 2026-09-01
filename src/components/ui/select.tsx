import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  badge?: string;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  leftIcon?: React.ReactNode;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, leftIcon, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3 text-muted-foreground pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}
        <select
          className={cn(
            "flex h-11 w-full appearance-none rounded-xl border border-border bg-background/80 backdrop-blur-sm px-3.5 py-2 text-sm ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all duration-150 cursor-pointer pr-10",
            leftIcon && "pl-10",
            className
          )}
          ref={ref}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-card text-foreground">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
