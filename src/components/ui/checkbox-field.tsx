import * as React from "react";
import { cn } from "@/lib/utils";

interface CheckboxFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: React.ReactNode;
  description?: React.ReactNode;
}

/** Checkbox nativa con label cliccabile e area di tocco ampia. */
const CheckboxField = React.forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ id, label, description, className, ...props }, ref) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;
    const descId = description ? `${inputId}-desc` : undefined;
    return (
      <div className={cn("flex items-start gap-3 rounded-lg py-2", className)}>
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          aria-describedby={descId}
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-input accent-[hsl(var(--primary))]"
          {...props}
        />
        <div>
          <label htmlFor={inputId} className="cursor-pointer text-sm font-medium leading-snug">
            {label}
          </label>
          {description && (
            <p id={descId} className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
    );
  },
);
CheckboxField.displayName = "CheckboxField";

export { CheckboxField };
