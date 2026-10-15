"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Interpreta un numero scritto all'italiana o all'inglese:
 * "1.234,56" → 1234.56 · "1234,5" → 1234.5 · "1.000" → 1000 · "4.5" → 4.5
 */
export function parseLocaleNumber(text: string): number | undefined {
  let t = text.trim().replace(/\s|€|%/g, "");
  if (t === "" || t === "-" || t === ",") return undefined;
  const hasComma = t.includes(",");
  const hasDot = t.includes(".");
  if (hasComma && hasDot) {
    t = t.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    t = t.replace(",", ".");
  } else if (hasDot && /^-?\d{1,3}(\.\d{3})+$/.test(t)) {
    t = t.replace(/\./g, "");
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

function formatForEdit(value: number | undefined, decimals: number): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return "";
  return new Intl.NumberFormat("it-IT", { maximumFractionDigits: decimals, useGrouping: false }).format(value);
}

function formatForDisplay(value: number | undefined, decimals: number): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return "";
  return new Intl.NumberFormat("it-IT", { maximumFractionDigits: decimals }).format(value);
}

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "prefix"> {
  value: number | undefined;
  onValueChange: (value: number | undefined) => void;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  integer?: boolean;
}

/** Campo numerico accessibile che accetta virgola o punto, con prefisso/suffisso visivi. */
export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onValueChange, suffix, prefix, decimals = 2, integer = false, className, onBlur, onFocus, ...props }, ref) => {
    const dec = integer ? 0 : decimals;
    const [text, setText] = React.useState(() => formatForDisplay(value, dec));
    const [focused, setFocused] = React.useState(false);

    // Allinea il testo quando il valore cambia dall'esterno
    React.useEffect(() => {
      if (!focused) setText(formatForDisplay(value, dec));
    }, [value, focused, dec]);

    return (
      <div className="relative flex items-center">
        {prefix && (
          <span className="pointer-events-none absolute left-3 text-muted-foreground" aria-hidden>
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          type="text"
          inputMode={integer ? "numeric" : "decimal"}
          autoComplete="off"
          value={text}
          onFocus={(e) => {
            setFocused(true);
            setText(formatForEdit(value, dec));
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            setText(formatForDisplay(value, dec));
            onBlur?.(e);
          }}
          onChange={(e) => {
            setText(e.target.value);
            const parsed = parseLocaleNumber(e.target.value);
            onValueChange(parsed === undefined ? undefined : integer ? Math.round(parsed) : parsed);
          }}
          className={cn(
            "flex min-h-11 w-full rounded-lg border border-input bg-background/60 py-2 text-base tabular text-foreground placeholder:text-muted-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-red-400",
            prefix ? "pl-8" : "pl-3",
            suffix ? "pr-14" : "pr-3",
            className,
          )}
          {...props}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 text-sm text-muted-foreground" aria-hidden>
            {suffix}
          </span>
        )}
      </div>
    );
  },
);
NumberInput.displayName = "NumberInput";

/** Importo in euro. */
export const CurrencyInput = React.forwardRef<HTMLInputElement, Omit<NumberInputProps, "suffix" | "prefix">>((props, ref) => (
  <NumberInput ref={ref} suffix="€" decimals={2} {...props} />
));
CurrencyInput.displayName = "CurrencyInput";

/** Percentuale espressa in punti (4 = 4%). */
export const PercentageInput = React.forwardRef<HTMLInputElement, Omit<NumberInputProps, "suffix" | "prefix">>((props, ref) => (
  <NumberInput ref={ref} suffix="%" decimals={3} {...props} />
));
PercentageInput.displayName = "PercentageInput";
