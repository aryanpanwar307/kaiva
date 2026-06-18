import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
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
        <textarea
          id={inputId}
          className={cn(
            "flex min-h-[100px] w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground",
            "transition-colors duration-150 resize-none",
            "focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive",
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
Textarea.displayName = "Textarea";

export { Textarea };
