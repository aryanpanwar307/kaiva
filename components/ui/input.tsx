import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-muted-foreground uppercase tracking-widest"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            "flex h-11 w-full rounded-lg border border-border bg-input px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground",
            "transition-colors duration-150",
            "focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus:border-destructive focus:ring-destructive/30",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
