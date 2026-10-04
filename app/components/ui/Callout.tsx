import React from "react";
import { InfoIcon, AlertTriangleIcon, AlertCircleIcon, CheckIcon, XIcon } from "./Icons";

export interface CalloutProps {
  variant?: "info" | "warning" | "error" | "neutral" | "success";
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
  id?: string;
}

export function Callout({
  variant = "info",
  title,
  children,
  onDismiss,
  className = "",
  id,
}: CalloutProps) {
  const role = variant === "error" || variant === "warning" ? "alert" : "status";

  const styles = {
    info: {
      container: "bg-sky-950/25 border-sky-800/40 text-sky-200",
      icon: <InfoIcon className="w-4 h-4 text-sky-400 shrink-0" aria-hidden="true" />,
      titleColor: "text-sky-200 font-medium",
    },
    warning: {
      container: "bg-amber-950/25 border-amber-700/50 text-amber-200",
      icon: <AlertTriangleIcon className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />,
      titleColor: "text-amber-200 font-medium",
    },
    error: {
      container: "bg-rose-950/25 border-rose-800/50 text-rose-200",
      icon: <AlertCircleIcon className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />,
      titleColor: "text-rose-200 font-medium",
    },
    neutral: {
      container: "bg-neutral-900 border-neutral-800 text-neutral-300",
      icon: <InfoIcon className="w-4 h-4 text-neutral-400 shrink-0" aria-hidden="true" />,
      titleColor: "text-neutral-200 font-medium",
    },
    success: {
      container: "bg-emerald-950/25 border-emerald-800/50 text-emerald-200",
      icon: <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />,
      titleColor: "text-emerald-200 font-medium",
    },
  };

  const current = styles[variant];

  return (
    <div
      id={id}
      role={role}
      className={`rounded-lg border p-3 sm:p-3.5 text-xs sm:text-sm flex items-start gap-2.5 leading-relaxed transition-all ${current.container} ${className}`}
    >
      <div className="mt-0.5">{current.icon}</div>
      <div className="flex-1 min-w-0">
        {title && <div className={`mb-0.5 ${current.titleColor}`}>{title}</div>}
        <div className="text-neutral-300 font-normal">{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-neutral-400 hover:text-neutral-200 p-1 -mr-1 -mt-1 rounded-md transition-colors hover:bg-white/5"
          aria-label="Dismiss notice"
        >
          <XIcon className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
