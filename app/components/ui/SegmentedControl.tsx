import React from "react";

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
  sublabel?: string;
  badge?: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string | number> {
  name: string;
  label: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  id?: string;
  className?: string;
  size?: "sm" | "md";
}

export function SegmentedControl<T extends string | number>({
  name,
  label,
  options,
  value,
  onChange,
  id,
  className = "",
  size = "md",
}: SegmentedControlProps<T>) {
  const containerId = id || `segmented-${name}`;

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs min-h-[36px]",
    md: "px-3.5 py-2 text-sm min-h-[40px]",
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      id={containerId}
      className={`flex flex-wrap gap-2 ${className}`}
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        const optionId = `${containerId}-${String(option.value)}`;

        return (
          <label
            key={String(option.value)}
            htmlFor={optionId}
            className={`
              relative inline-flex items-center justify-center font-medium rounded-lg border cursor-pointer select-none transition-all
              ${sizeClasses[size]}
              has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-neutral-950
              ${
                option.disabled
                  ? "opacity-40 cursor-not-allowed border-neutral-800 bg-neutral-900/40 text-neutral-500"
                  : isSelected
                  ? "bg-neutral-800 text-neutral-100 border-neutral-600 ring-1 ring-emerald-500/40 shadow-xs"
                  : "bg-neutral-900/70 text-neutral-400 border-neutral-800/80 hover:bg-neutral-800/60 hover:text-neutral-200 hover:border-neutral-700"
              }
            `}
          >
            <input
              type="radio"
              id={optionId}
              name={name}
              value={String(option.value)}
              checked={isSelected}
              disabled={option.disabled}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span className="flex items-center gap-1.5">
              <span className={isSelected ? "text-neutral-100 font-semibold" : ""}>
                {option.label}
              </span>
              {option.sublabel && (
                <span className="text-[11px] text-neutral-500 font-normal">
                  {option.sublabel}
                </span>
              )}
              {option.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-700/60 text-neutral-300 font-mono">
                  {option.badge}
                </span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}
