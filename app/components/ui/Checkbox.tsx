import React from "react";
import { CheckIcon } from "./Icons";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  id: string;
  label: string;
  description?: string;
}

export function Checkbox({
  id,
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className = "",
  ...props
}: CheckboxProps) {
  const descId = `${id}-desc`;

  return (
    <label
      htmlFor={id}
      className={`
        group flex items-start gap-3 cursor-pointer py-2 min-h-[44px] select-none
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
    >
      <div className="relative flex items-center justify-center shrink-0 mt-0.5">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          aria-describedby={description ? descId : undefined}
          className="peer sr-only"
          {...props}
        />
        {/* Custom styled box */}
        <div
          className={`
            w-5 h-5 rounded border flex items-center justify-center transition-colors
            peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-neutral-950
            ${
              checked
                ? "bg-emerald-600 border-emerald-500 text-white"
                : "bg-neutral-900 border-neutral-700/80 text-transparent group-hover:border-neutral-500"
            }
          `}
          aria-hidden="true"
        >
          <CheckIcon className={`w-3.5 h-3.5 ${checked ? "opacity-100" : "opacity-0"}`} />
        </div>
      </div>

      <div className="flex flex-col text-sm">
        <span
          className={`font-medium transition-colors ${
            checked
              ? "text-neutral-100"
              : "text-neutral-300 group-hover:text-neutral-200"
          }`}
        >
          {label}
        </span>
        {description && (
          <span id={descId} className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
            {description}
          </span>
        )}
      </div>
    </label>
  );
}
