"use client";

import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { FormField } from "./FormField";
import { CurrencyInput, NumberInput, PercentageInput } from "./NumberInput";
import type { GlossaryKey } from "@/lib/glossary";
import type { DataCategory } from "@/lib/types";

interface ControlledNumberFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  category: DataCategory;
  kind: "currency" | "percent" | "integer" | "number";
  term?: GlossaryKey;
  hint?: React.ReactNode;
  warning?: string;
  required?: boolean;
  placeholder?: string;
  suffix?: string;
  disabled?: boolean;
  className?: string;
  tooltipExtra?: React.ReactNode;
  onValueChange?: (value: number | undefined) => void;
}

/** Collega un campo numerico (euro, percentuale o intero) a React Hook Form con label, tooltip ed errori. */
export function ControlledNumberField<T extends FieldValues>({
  control,
  name,
  label,
  category,
  kind,
  term,
  hint,
  warning,
  required,
  placeholder,
  suffix,
  disabled,
  className,
  tooltipExtra,
  onValueChange,
}: ControlledNumberFieldProps<T>) {
  const id = `campo-${String(name).replace(/\./g, "-")}`;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormField
          id={id}
          label={label}
          category={category}
          term={term}
          hint={hint}
          warning={warning}
          error={fieldState.error?.message}
          required={required}
          className={className}
          tooltipExtra={tooltipExtra}
        >
          {(a11y) => {
            const common = {
              ...a11y,
              ref: field.ref,
              name: field.name,
              value: field.value as number | undefined,
              onBlur: field.onBlur,
              disabled,
              placeholder,
              onValueChange: (v: number | undefined) => {
                field.onChange(v);
                onValueChange?.(v);
              },
            };
            if (kind === "currency") return <CurrencyInput {...common} />;
            if (kind === "percent") return <PercentageInput {...common} />;
            if (kind === "integer") return <NumberInput {...common} integer suffix={suffix} />;
            return <NumberInput {...common} suffix={suffix} />;
          }}
        </FormField>
      )}
    />
  );
}
