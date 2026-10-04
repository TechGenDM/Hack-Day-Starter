import React from "react";
import { AlertCircleIcon } from "./Icons";

export interface NumberFieldProps {
  id: string;
  label?: string;
  value: number | "";
  onChange: (val: number | "") => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  unit?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
  "aria-label"?: string;
}

export function NumberField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder = "",
  unit,
  error,
  helperText,
  disabled = false,
  className = "",
  autoFocus = false,
  "aria-label": ariaLabel,
}: NumberFieldProps) {
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  const describedBy = error ? errorId : helperText ? helperId : undefined;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.trim();
    if (raw === "") {
      onChange("");
      return;
    }
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  }

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-neutral-300 mb-1.5"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          aria-label={ariaLabel || label}
          className={`
            w-full rounded-lg bg-neutral-900/90 text-neutral-100 border text-base sm:text-sm py-2 px-3.5 transition-colors
            placeholder:text-neutral-500 min-h-[40px]
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-950
            disabled:opacity-50 disabled:cursor-not-allowed
            ${unit ? "pr-12" : ""}
            ${
              error
                ? "border-rose-500/70 focus:ring-rose-500/80 text-rose-100"
                : "border-neutral-700/80 focus:ring-emerald-500 focus:border-neutral-500"
            }
          `}
        />
        {unit && (
          <span
            className="absolute right-3.5 text-xs font-medium text-neutral-400 pointer-events-none select-none"
            aria-hidden="true"
          >
            {unit}
          </span>
        )}
      </div>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-xs text-rose-400 mt-1.5 flex items-center gap-1.5"
        >
          <AlertCircleIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
