import React from "react";
import { ChevronDownIcon, AlertCircleIcon } from "./Icons";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  className?: string;
}

export function Select({
  id,
  label,
  options,
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  className = "",
  ...props
}: SelectProps) {
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;
  const describedBy = error ? errorId : helperText ? helperId : undefined;

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
        <select
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`
            w-full rounded-lg bg-neutral-900/90 text-neutral-100 border text-base sm:text-sm py-2.5 pl-3.5 pr-10
            min-h-[42px] cursor-pointer transition-colors appearance-none
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-950
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
              error
                ? "border-rose-500/70 focus:ring-rose-500 text-rose-100"
                : "border-neutral-700/80 focus:ring-emerald-500 focus:border-neutral-500"
            }
          `}
          {...props}
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
              className="bg-neutral-900 text-neutral-100 py-1"
            >
              {opt.label}
            </option>
          ))}
        </select>

        {/* Guaranteed single chevron indicator with pointer-events-none */}
        <div
          className="absolute right-3.5 pointer-events-none text-neutral-400"
          aria-hidden="true"
        >
          <ChevronDownIcon className="w-4 h-4" />
        </div>
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
