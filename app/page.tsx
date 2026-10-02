"use client";

import { useState } from "react";
import type {
  GpuType,
  OperatingSystem,
  UseCase,
  Recommendation,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Option definitions (used to render selects and labels)
// ---------------------------------------------------------------------------

const GPU_OPTIONS: { value: GpuType; label: string }[] = [
  { value: "apple-silicon", label: "Apple Silicon (M1/M2/M3/M4)" },
  { value: "nvidia", label: "NVIDIA GPU" },
  { value: "none", label: "No GPU / Integrated" },
];

const OS_OPTIONS: { value: OperatingSystem; label: string }[] = [
  { value: "macos", label: "macOS" },
  { value: "linux", label: "Linux" },
  { value: "windows", label: "Windows" },
];

const USE_CASE_OPTIONS: { value: UseCase; label: string }[] = [
  { value: "code", label: "Code generation & assistance" },
  { value: "chat", label: "Chat & conversation" },
  { value: "summarization", label: "Summarization & writing" },
  { value: "general", label: "General purpose" },
];

const RAM_PRESETS = [8, 16, 32, 64];

// ---------------------------------------------------------------------------
// Compatibility badge colour mapping
// ---------------------------------------------------------------------------

const COMPAT_STYLES: Record<string, string> = {
  excellent:
    "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
  good: "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30",
  marginal:
    "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HomePage() {
  // Form state
  const [ramGb, setRamGb] = useState<number>(16);
  const [gpu, setGpu] = useState<GpuType>("apple-silicon");
  const [os, setOs] = useState<OperatingSystem>("macos");
  const [useCase, setUseCase] = useState<UseCase>("code");

  // Results state
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ramGb, gpu, os, useCase }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Something went wrong");
      }

      const data = await res.json();
      setResults(data.recommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-12 sm:py-20">
      {/* ---------------------------------------------------------------- */}
      {/* Hero */}
      {/* ---------------------------------------------------------------- */}
      <div className="text-center max-w-2xl mb-12">
        <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-white/[0.06] ring-1 ring-white/10 text-sm text-neutral-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Hacktoberfest 2026
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-br from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent">
          Hack Day Starter
        </h1>

        <p className="mt-4 text-lg text-neutral-400 leading-relaxed">
          Stop wasting the first hours of your hack day. Tell us about your
          laptop and we&apos;ll recommend the best local open-weight model to
          run with{" "}
          <a
            href="https://ollama.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline"
          >
            Ollama
          </a>
          .
        </p>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Hardware Form */}
      {/* ---------------------------------------------------------------- */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl space-y-6 bg-white/[0.03] ring-1 ring-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm"
      >
        <h2 className="text-lg font-semibold text-neutral-200">
          Your hardware
        </h2>

        {/* RAM */}
        <fieldset>
          <legend className="text-sm font-medium text-neutral-400 mb-2">
            RAM (GB)
          </legend>
          <div className="flex flex-wrap gap-2">
            {RAM_PRESETS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setRamGb(val)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
                  ${
                    ramGb === val
                      ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40"
                      : "bg-white/[0.04] text-neutral-400 ring-1 ring-white/10 hover:bg-white/[0.08]"
                  }`}
              >
                {val} GB
              </button>
            ))}
            {/* Custom input for non-preset values */}
            <input
              type="number"
              min={1}
              max={512}
              value={RAM_PRESETS.includes(ramGb) ? "" : ramGb}
              placeholder="Other"
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v > 0) setRamGb(v);
              }}
              className="w-24 px-3 py-2 rounded-lg text-sm bg-white/[0.04] text-neutral-300 ring-1 ring-white/10 placeholder:text-neutral-600 focus:outline-none focus:ring-emerald-500/50"
            />
          </div>
        </fieldset>

        {/* GPU */}
        <div>
          <label
            htmlFor="gpu-select"
            className="block text-sm font-medium text-neutral-400 mb-2"
          >
            GPU
          </label>
          <select
            id="gpu-select"
            value={gpu}
            onChange={(e) => setGpu(e.target.value as GpuType)}
            className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] text-neutral-300 ring-1 ring-white/10 focus:outline-none focus:ring-emerald-500/50 appearance-none cursor-pointer"
          >
            {GPU_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* OS */}
        <div>
          <label
            htmlFor="os-select"
            className="block text-sm font-medium text-neutral-400 mb-2"
          >
            Operating System
          </label>
          <select
            id="os-select"
            value={os}
            onChange={(e) => setOs(e.target.value as OperatingSystem)}
            className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] text-neutral-300 ring-1 ring-white/10 focus:outline-none focus:ring-emerald-500/50 appearance-none cursor-pointer"
          >
            {OS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Use Case */}
        <div>
          <label
            htmlFor="usecase-select"
            className="block text-sm font-medium text-neutral-400 mb-2"
          >
            Primary use case
          </label>
          <select
            id="usecase-select"
            value={useCase}
            onChange={(e) => setUseCase(e.target.value as UseCase)}
            className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] text-neutral-300 ring-1 ring-white/10 focus:outline-none focus:ring-emerald-500/50 appearance-none cursor-pointer"
          >
            {USE_CASE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200
            bg-gradient-to-r from-emerald-600 to-teal-600 text-white
            hover:from-emerald-500 hover:to-teal-500
            active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Finding models…" : "Recommend models"}
        </button>
      </form>

      {/* ---------------------------------------------------------------- */}
      {/* Error */}
      {/* ---------------------------------------------------------------- */}
      {error && (
        <div className="mt-8 w-full max-w-xl px-4 py-3 rounded-xl bg-red-500/10 ring-1 ring-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Results */}
      {/* ---------------------------------------------------------------- */}
      {results && results.length > 0 && (
        <section className="mt-12 w-full max-w-xl space-y-4">
          <h2 className="text-lg font-semibold text-neutral-200">
            Recommended models
          </h2>

          {results.map((rec, i) => (
            <article
              key={rec.model.ollamaTag}
              className="relative bg-white/[0.03] ring-1 ring-white/10 rounded-2xl p-6 space-y-3 transition-all hover:ring-white/20"
            >
              {/* Rank badge */}
              <span className="absolute -top-3 -left-3 w-7 h-7 flex items-center justify-center rounded-full bg-neutral-800 ring-1 ring-white/10 text-xs font-bold text-neutral-300">
                {i + 1}
              </span>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-neutral-100">
                    {rec.model.name}
                  </h3>
                  <p className="text-sm text-neutral-500 font-mono mt-0.5">
                    ollama pull {rec.model.ollamaTag}
                  </p>
                </div>
                <span
                  className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    COMPAT_STYLES[rec.compatibilityLevel]
                  }`}
                >
                  {rec.compatibilityLevel}
                </span>
              </div>

              <p className="text-sm text-neutral-400 leading-relaxed">
                {rec.model.description}
              </p>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                <span>📦 ~{rec.model.sizeGb} GB</span>
                <span>🧠 ~{rec.model.ramRequired} GB RAM needed</span>
              </div>

              <p className="text-sm text-neutral-400 italic border-t border-white/5 pt-3">
                {rec.explanation}
              </p>
            </article>
          ))}

          {/* Quick-start hint */}
          <div className="mt-6 px-4 py-3 rounded-xl bg-white/[0.03] ring-1 ring-white/10 text-sm text-neutral-500">
            <span className="text-neutral-300 font-medium">Quick start:</span>{" "}
            Install{" "}
            <a
              href="https://ollama.com/download"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline"
            >
              Ollama
            </a>
            , then run the{" "}
            <code className="text-neutral-400 bg-white/[0.06] px-1.5 py-0.5 rounded">
              ollama pull
            </code>{" "}
            command above.
          </div>
        </section>
      )}

      {results && results.length === 0 && (
        <div className="mt-8 w-full max-w-xl px-4 py-6 rounded-xl bg-white/[0.03] ring-1 ring-white/10 text-center text-neutral-400">
          <p className="text-lg mb-1">😅 No compatible models found</p>
          <p className="text-sm">
            Your hardware might be too constrained for the models in our
            catalog. Try increasing RAM or consider a cloud option.
          </p>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 text-xs text-neutral-600">
        Built for Hacktoberfest 2026 — Weekend Challenge: Build for a Friend
      </footer>
    </main>
  );
}
