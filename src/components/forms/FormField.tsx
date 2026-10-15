"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { DataCategoryBadge } from "@/components/common/DataCategoryBadge";
import { SourceTooltip } from "@/components/common/SourceTooltip";
import type { GlossaryKey } from "@/lib/glossary";
import type { DataCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface FieldA11yProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-required"?: boolean;
}

interface FormFieldProps {
  id: string;
  label: string;
  category: DataCategory;
  term?: GlossaryKey;
  hint?: React.ReactNode;
  error?: string;
  warning?: string;
  required?: boolean;
  className?: string;
  tooltipExtra?: React.ReactNode;
  children: (a11y: FieldA11yProps) => React.ReactNode;
}

/**
 * Campo di form accessibile: label associata, icona informativa con definizione e origine,
 * categoria del dato, suggerimento ed errore annunciato agli screen reader.
 */
export function FormField({ id, label, category, term, hint, error, warning, required, className, tooltipExtra, children }: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const warnId = warning ? `${id}-warn` : undefined;
  const describedBy = [errorId, warnId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <label htmlFor={id} className="text-sm font-medium leading-snug">
          {label}
          {required && (
            <span className="text-muted-foreground" aria-hidden>
              {" "}
              *
            </span>
          )}
        </label>
        {term && <SourceTooltip term={term} extra={tooltipExtra} className="-my-1" />}
        <DataCategoryBadge category={category} compact className="ml-auto" />
      </div>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined, "aria-required": required || undefined })}
      {error && (
        <p id={errorId} role="alert" className="flex items-start gap-1.5 text-sm font-medium text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
      {warning && !error && (
        <p id={warnId} className="text-sm text-incerto">
          {warning}
        </p>
      )}
      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}
