"use client";

import { useState } from "react";
import JSZip from "jszip";
import { REGISTRY_METADATA } from "@/lib/registry";
import { formatModelDisplaySize, getModelMemoryReport } from "@/lib/memory-calculator";
import { RECOMMENDED_DISK_BUFFER_GB } from "@/lib/recommend";
import type { StarterProjectResult } from "@/lib/starter/types";
import type {
  GpuType,
  OperatingSystem,
  UseCase,
  AppleSiliconGeneration,
  Recommendation,
  ModelEntry,
  StarterType,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Hardware options and presets
// ---------------------------------------------------------------------------

const GPU_OPTIONS: { value: GpuType; label: string }[] = [
  { value: "apple-silicon", label: "Apple Silicon (M1/M2/M3/M4)" },
  { value: "nvidia", label: "NVIDIA Discrete GPU" },
  { value: "none", label: "No GPU / Integrated Graphics" },
];

const APPLE_SILICON_GENS: { value: AppleSiliconGeneration; label: string }[] = [
  { value: "m4", label: "M4 Generation" },
  { value: "m3", label: "M3 Generation" },
  { value: "m2", label: "M2 Generation" },
  { value: "m1", label: "M1 Generation" },
];

const OS_OPTIONS: { value: OperatingSystem; label: string }[] = [
  { value: "macos", label: "macOS" },
  { value: "linux", label: "Linux" },
  { value: "windows", label: "Windows" },
];

const USE_CASE_OPTIONS: { value: UseCase; label: string; desc: string }[] = [
  {
    value: "code",
    label: "Code generation & assistance",
    desc: "Coding tasks, function synthesis, and debugging",
  },
  {
    value: "chat",
    label: "Chat & conversation",
    desc: "Interactive assistant and natural dialogue",
  },
  {
    value: "summarization",
    label: "Summarization & writing",
    desc: "Long-form reading, document condensing, and drafting",
  },
  {
    value: "general",
    label: "General purpose",
    desc: "Versatile reasoning across diverse hack day ideas",
  },
];

const RAM_PRESETS = [8, 16, 24, 32, 64];
const DISK_PRESETS = [10, 25, 50, 100];
const VRAM_PRESETS = [4, 8, 12, 16, 24];

const COMPAT_STYLES: Record<string, string> = {
  excellent: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
  good: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30",
  marginal: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
};

export default function HomePage() {
  // Form state
  const [ramGb, setRamGb] = useState<number>(24);
  const [gpuType, setGpuType] = useState<GpuType>("apple-silicon");
  const [appleGen, setAppleGen] = useState<AppleSiliconGeneration>("m3");
  const [gpuVramGb, setGpuVramGb] = useState<number>(8);
  const [os, setOs] = useState<OperatingSystem>("macos");
  const [freeDiskSpaceGb, setFreeDiskSpaceGb] = useState<number>(50);
  const [useCase, setUseCase] = useState<UseCase>("code");

  // Capability requirements (optional filter)
  const [requireTools, setRequireTools] = useState<boolean>(false);
  const [requireVision, setRequireVision] = useState<boolean>(false);

  // Results & Selection State
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelEntry | null>(null);
  const [selectedStarter, setSelectedStarter] = useState<StarterType | null>(null);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  // Phase 3 Starter Generation State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedProject, setGeneratedProject] = useState<StarterProjectResult | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    setSelectedModel(null);
    setSelectedStarter(null);
    setGeneratedProject(null);
    setGenerationError(null);

    try {
      const payload = {
        ramGb,
        freeDiskSpaceGb,
        os,
        gpuType,
        gpuVramGb: gpuType === "nvidia" ? gpuVramGb : null,
        appleSiliconGeneration: gpuType === "apple-silicon" ? appleGen : null,
        useCase,
        requiredCapabilities: {
          ...(requireTools && { tools: true }),
          ...(requireVision && { vision: true }),
        },
      };

      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to fetch recommendations");
      }

      const data = await res.json();
      setResults(data.recommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(tag: string) {
    navigator.clipboard.writeText(`ollama pull ${tag}`);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2000);
  }

  function handleSelectModel(model: ModelEntry) {
    setSelectedModel(model);
    setSelectedStarter(null);
    setGeneratedProject(null);
    setGenerationError(null);
    setTimeout(() => {
      document
        .getElementById("selected-model-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  async function handleGenerateStarter() {
    if (!selectedModel || !selectedStarter) return;
    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedProject(null);

    try {
      const selectedRec = results?.find((r) => r.model.id === selectedModel.id);
      const res = await fetch("/api/starter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: selectedModel.id,
          starterType: selectedStarter,
          explanation: selectedRec?.explanation,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate starter project");
      }

      setGeneratedProject(data.result);
    } catch (err: any) {
      setGenerationError(err.message || "An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDownloadZip() {
    if (!generatedProject) return;
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      for (const file of generatedProject.files) {
        zip.file(file.path, file.content);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${generatedProject.projectName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Failed to build ZIP file: " + (err.message || err));
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-10 sm:py-16 max-w-4xl mx-auto w-full">
      {/* ---------------------------------------------------------------- */}
      {/* Header with Catalog Verification Metadata */}
      {/* ---------------------------------------------------------------- */}
      <div className="text-center max-w-2xl mb-10">
        <div className="inline-flex flex-wrap items-center justify-center gap-2 mb-5 px-4 py-1.5 rounded-full bg-white/[0.05] ring-1 ring-white/10 text-xs text-neutral-300">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Catalog last verified:</span>
          <span className="font-semibold text-emerald-400">
            {REGISTRY_METADATA.verifiedDisplayDate}
          </span>
          <span className="text-neutral-500">•</span>
          <a
            href={REGISTRY_METADATA.sourceLibraryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-400 hover:text-neutral-200 underline decoration-neutral-600 underline-offset-2"
          >
            Official Ollama Library ↗
          </a>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight bg-gradient-to-br from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
          Hack Day Starter
        </h1>

        <p className="mt-4 text-base sm:text-lg text-neutral-400 leading-relaxed">
          Get realistic, vetted local model recommendations for{" "}
          <a
            href="https://ollama.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline font-medium"
          >
            Ollama
          </a>
          . Facts are source-backed; estimates are explicitly labeled.
        </p>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Hardware Input Form */}
      {/* ---------------------------------------------------------------- */}
      <form
        onSubmit={handleSubmit}
        className="w-full space-y-6 bg-white/[0.03] ring-1 ring-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-xl"
      >
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-lg font-semibold text-neutral-100">
            Your Hardware Specification
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Deterministic evaluation based on system RAM, discrete VRAM, GPU acceleration, and available free storage.
          </p>
        </div>

        {/* RAM Section */}
        <fieldset>
          <div className="flex items-baseline justify-between mb-2">
            <legend className="text-sm font-medium text-neutral-300">
              System RAM (GB)
            </legend>
            <span className="text-xs text-neutral-500">
              Selected: <strong className="text-neutral-300">{ramGb} GB</strong>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {RAM_PRESETS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setRamGb(val)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
                  ${
                    ramGb === val
                      ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50 shadow-sm"
                      : "bg-white/[0.04] text-neutral-400 ring-1 ring-white/10 hover:bg-white/[0.08]"
                  }`}
              >
                {val} GB
              </button>
            ))}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-xs text-neutral-500">Custom:</span>
              <input
                type="number"
                min={2}
                max={512}
                value={RAM_PRESETS.includes(ramGb) ? "" : ramGb}
                placeholder="GB"
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v > 0) setRamGb(v);
                }}
                className="w-20 px-3 py-1.5 rounded-lg text-sm bg-white/[0.04] text-neutral-200 ring-1 ring-white/10 placeholder:text-neutral-600 focus:outline-none focus:ring-emerald-500/50"
              />
            </div>
          </div>
        </fieldset>

        {/* Free Disk Space Section */}
        <fieldset>
          <div className="flex items-baseline justify-between mb-2">
            <legend className="text-sm font-medium text-neutral-300">
              Free Disk Space (GB)
            </legend>
            <span className="text-xs text-neutral-500">
              Selected: <strong className="text-neutral-300">{freeDiskSpaceGb} GB</strong> available
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {DISK_PRESETS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setFreeDiskSpaceGb(val)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
                  ${
                    freeDiskSpaceGb === val
                      ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50 shadow-sm"
                      : "bg-white/[0.04] text-neutral-400 ring-1 ring-white/10 hover:bg-white/[0.08]"
                  }`}
              >
                {val} GB
              </button>
            ))}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-xs text-neutral-500">Custom:</span>
              <input
                type="number"
                min={1}
                max={4000}
                value={DISK_PRESETS.includes(freeDiskSpaceGb) ? "" : freeDiskSpaceGb}
                placeholder="GB"
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v > 0) setFreeDiskSpaceGb(v);
                }}
                className="w-20 px-3 py-1.5 rounded-lg text-sm bg-white/[0.04] text-neutral-200 ring-1 ring-white/10 placeholder:text-neutral-600 focus:outline-none focus:ring-emerald-500/50"
              />
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-1.5">
            Measured against exact model download footprint plus a recommended {RECOMMENDED_DISK_BUFFER_GB} GB safety buffer (heuristic).
          </p>
        </fieldset>

        {/* Processor / GPU and OS Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="gpu-select"
              className="block text-sm font-medium text-neutral-300 mb-2"
            >
              Processor / GPU Architecture
            </label>
            <select
              id="gpu-select"
              value={gpuType}
              onChange={(e) => {
                const nextGpu = e.target.value as GpuType;
                setGpuType(nextGpu);
                if (nextGpu === "apple-silicon") setOs("macos");
              }}
              className="w-full px-4 py-2.5 rounded-lg bg-neutral-900/90 text-neutral-200 ring-1 ring-white/15 focus:outline-none focus:ring-emerald-500/50 cursor-pointer text-sm"
            >
              {GPU_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="os-select"
              className="block text-sm font-medium text-neutral-300 mb-2"
            >
              Operating System
            </label>
            <select
              id="os-select"
              value={os}
              onChange={(e) => setOs(e.target.value as OperatingSystem)}
              className="w-full px-4 py-2.5 rounded-lg bg-neutral-900/90 text-neutral-200 ring-1 ring-white/15 focus:outline-none focus:ring-emerald-500/50 cursor-pointer text-sm"
            >
              {OS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Context-Specific Sub-Options: Apple Silicon Generation or NVIDIA VRAM */}
        {gpuType === "apple-silicon" && (
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-neutral-400 font-medium">Apple Silicon Chip Generation:</span>
            <div className="flex gap-2">
              {APPLE_SILICON_GENS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setAppleGen(g.value)}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                    appleGen === g.value
                      ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
                      : "bg-white/[0.04] text-neutral-400 hover:bg-white/[0.08]"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {gpuType === "nvidia" && (
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400 font-medium">
                Discrete NVIDIA VRAM (GB) — <em>not inferred from system RAM</em>:
              </span>
              <strong className="text-neutral-200">{gpuVramGb} GB VRAM</strong>
            </div>
            <div className="flex flex-wrap gap-2">
              {VRAM_PRESETS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setGpuVramGb(val)}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    gpuVramGb === val
                      ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
                      : "bg-white/[0.04] text-neutral-400 hover:bg-white/[0.08]"
                  }`}
                >
                  {val} GB VRAM
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Use Case */}
        <div>
          <label
            htmlFor="usecase-select"
            className="block text-sm font-medium text-neutral-300 mb-2"
          >
            Primary Hack Day Use Case
          </label>
          <select
            id="usecase-select"
            value={useCase}
            onChange={(e) => setUseCase(e.target.value as UseCase)}
            className="w-full px-4 py-2.5 rounded-lg bg-neutral-900/90 text-neutral-200 ring-1 ring-white/15 focus:outline-none focus:ring-emerald-500/50 cursor-pointer text-sm"
          >
            {USE_CASE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label} — {o.desc}
              </option>
            ))}
          </select>
        </div>

        {/* Required Capabilities Filters */}
        <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-white/5 text-xs text-neutral-400">
          <span className="font-medium text-neutral-300">Mandatory filters:</span>
          <label className="flex items-center gap-2 cursor-pointer hover:text-neutral-200">
            <input
              type="checkbox"
              checked={requireTools}
              onChange={(e) => setRequireTools(e.target.checked)}
              className="rounded bg-neutral-900 border-white/20 text-emerald-500 focus:ring-0"
            />
            Require Tool-calling support
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:text-neutral-200">
            <input
              type="checkbox"
              checked={requireVision}
              onChange={(e) => setRequireVision(e.target.checked)}
              className="rounded bg-neutral-900 border-white/20 text-emerald-500 focus:ring-0"
            />
            Require Vision (multimodal image input)
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200
            bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/40
            hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-900/50
            active:scale-[0.99]
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Evaluating Verified Catalog…" : "Get Verified Model Recommendations"}
        </button>
      </form>

      {/* Error Display */}
      {error && (
        <div className="mt-8 w-full px-4 py-3 rounded-xl bg-red-500/10 ring-1 ring-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Recommendations Results List */}
      {/* ---------------------------------------------------------------- */}
      {results && results.length > 0 && (
        <section className="mt-12 w-full space-y-6">
          <div className="flex items-baseline justify-between border-b border-white/10 pb-3">
            <h2 className="text-xl font-bold text-neutral-100">
              Verified Model Recommendations ({results.length})
            </h2>
            <span className="text-xs text-neutral-400">
              Facts verified from primary Ollama library entries
            </span>
          </div>

          <div className="space-y-4">
            {results.map((rec, i) => {
              const memReport = getModelMemoryReport(rec.model);
              const isSelected = selectedModel?.id === rec.model.id;
              const formattedSize = rec.formattedArtifactSize;

              return (
                <article
                  key={rec.model.id}
                  className={`relative rounded-2xl p-6 transition-all duration-200 backdrop-blur-sm
                    ${
                      isSelected
                        ? "bg-emerald-950/25 ring-2 ring-emerald-500/60 shadow-xl"
                        : "bg-white/[0.03] ring-1 ring-white/10 hover:ring-white/20"
                    }`}
                >
                  {/* Rank badge */}
                  <span className="absolute -top-3 -left-3 w-7 h-7 flex items-center justify-center rounded-full bg-neutral-800 ring-1 ring-white/20 text-xs font-bold text-neutral-200 shadow">
                    #{i + 1}
                  </span>

                  {/* Header Row */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-neutral-100">
                          {rec.model.displayName}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded bg-white/[0.06] text-neutral-400 font-medium">
                          {rec.model.provider}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-white/5 font-mono">
                          {rec.model.quantization}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs text-neutral-300 font-mono bg-black/40 px-2 py-0.5 rounded border border-white/5">
                          ollama pull {rec.model.ollamaTag}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopy(rec.model.ollamaTag)}
                          className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
                          title="Copy command"
                        >
                          {copiedTag === rec.model.ollamaTag ? "✓ Copied" : "Copy"}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                          COMPAT_STYLES[rec.compatibilityLevel]
                        }`}
                      >
                        {rec.compatibilityLevel}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-neutral-300 leading-relaxed mt-3">
                    {rec.model.description}
                  </p>

                  {/* Verified Facts vs Estimated Heuristics Block */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                    {/* Left: Verified Facts */}
                    <div className="space-y-1.5 bg-black/25 rounded-xl p-3 border border-white/5">
                      <div className="text-[11px] uppercase tracking-wider font-semibold text-emerald-400 flex items-center gap-1">
                        <span>✓ Verified Fact</span>
                      </div>
                      <div className="text-neutral-300">
                        📦 <strong>{formattedSize}</strong>
                        {rec.model.exactManifestSizeBytes !== null && (
                          <span className="text-neutral-400"> ({rec.model.exactManifestSizeBytes.toLocaleString()} bytes)</span>
                        )}
                      </div>
                      <div className="text-neutral-300">
                        🧠 Context: <strong>{(rec.model.contextTokens / 1024).toFixed(0)}k tokens</strong> ({rec.model.contextTokens.toLocaleString()})
                      </div>
                      <div className="text-neutral-300">
                        📜 License: {rec.model.license} • Params: {rec.model.parameterCount}
                        {rec.model.activeParameterCount && ` (${rec.model.activeParameterCount} active)`}
                      </div>
                    </div>

                    {/* Right: Memory Guidance (Fact vs Heuristic) */}
                    <div className="space-y-1.5 bg-black/25 rounded-xl p-3 border border-white/5">
                      {memReport.hasOfficialSystemGuidance ? (
                        <>
                          <div className="text-[11px] uppercase tracking-wider font-semibold text-sky-400 flex items-center gap-1">
                            <span>✓ Verified Fact (Vendor Published)</span>
                          </div>
                          <div className="text-sky-200 font-medium">
                            Official system guidance: {memReport.officialSystemGuidanceGb} GB unified/system RAM
                          </div>
                          <p className="text-[11px] text-neutral-400 leading-relaxed">
                            Published in official provider model card.
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="text-[11px] uppercase tracking-wider font-semibold text-amber-400 flex items-center gap-1">
                            <span>ℹ️ Estimated Heuristic (Empirical)</span>
                          </div>
                          <div className="text-amber-200 font-medium">
                            Estimated memory comfort: ~{memReport.estimatedComfortGb} GB
                          </div>
                          <p className="text-[11px] text-neutral-400 leading-relaxed">
                            {memReport.estimatedMethodology}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Capabilities Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                    <span className="text-xs text-neutral-500 font-medium">Verified Capabilities:</span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        rec.model.capabilities.tools
                          ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                          : "bg-white/[0.04] text-neutral-500"
                      }`}
                    >
                      {rec.model.capabilities.tools ? "✓ Tool-calling" : "✕ No tool-calling"}
                    </span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        rec.model.capabilities.vision
                          ? "bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/30"
                          : "bg-white/[0.04] text-neutral-500"
                      }`}
                    >
                      {rec.model.capabilities.vision ? "✓ Multimodal Vision" : "✕ No vision"}
                    </span>
                    {rec.model.capabilities.thinking && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30">
                        🧠 Chain-of-thought Reasoning
                      </span>
                    )}
                  </div>

                  {/* Explanation Block */}
                  <div className="bg-black/30 rounded-xl p-3 border border-white/5 text-xs text-neutral-300 italic">
                    💡 {rec.explanation}
                  </div>

                  {/* Sources & Action */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-3 text-xs text-neutral-400">
                      <a
                        href={rec.model.ollamaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-neutral-200 underline decoration-neutral-600 underline-offset-2"
                      >
                        Ollama Library Page ↗
                      </a>
                      <a
                        href={rec.model.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-neutral-200 underline decoration-neutral-600 underline-offset-2"
                      >
                        Model Card ↗
                      </a>
                      <span className="text-[11px] text-neutral-500">
                        Verified {new Date(rec.model.verifiedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectModel(rec.model)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150
                        ${
                          isSelected
                            ? "bg-emerald-500 text-neutral-950 shadow-md font-bold"
                            : "bg-white/[0.08] text-neutral-200 hover:bg-emerald-500 hover:text-neutral-950"
                        }`}
                    >
                      {isSelected ? "✓ Selected Model" : "Select this model →"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Empty State */}
      {/* ---------------------------------------------------------------- */}
      {results && results.length === 0 && (
        <div className="mt-8 w-full px-4 py-8 rounded-2xl bg-white/[0.03] ring-1 ring-white/10 text-center text-neutral-400">
          <p className="text-xl mb-2">💾 No compatible models found</p>
          <p className="text-sm max-w-md mx-auto leading-relaxed">
            Your hardware constraints (RAM, GPU VRAM, or free disk space) are too tight for the models currently verified in our catalog. Try increasing free disk space or RAM.
          </p>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Model Selector & Starter Type (Steps 9 & 15) */}
      {/* ---------------------------------------------------------------- */}
      {selectedModel && (
        <section
          id="selected-model-section"
          className="mt-14 w-full bg-neutral-900/80 ring-2 ring-emerald-500/40 rounded-2xl p-6 sm:p-8 backdrop-blur-md space-y-6 shadow-2xl"
        >
          <div className="border-b border-white/10 pb-4">
            <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">
              Step 2 • Ready to Build
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-100 mt-1">
              Selected Model: {selectedModel.displayName}
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Verified on {new Date(selectedModel.verifiedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} • License: {selectedModel.license}
            </p>
          </div>

          {/* Model Summary Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-black/40 rounded-xl p-4 border border-white/5 text-xs">
            <div>
              <span className="text-neutral-500 block">Ollama Tag</span>
              <code className="text-neutral-200 font-mono font-semibold">
                {selectedModel.ollamaTag}
              </code>
            </div>
            <div>
              <span className="text-neutral-500 block">
                {selectedModel.exactManifestSizeBytes !== null ? "Manifest Size" : "Ollama Listed Size"}
              </span>
              <span className="text-neutral-200 font-semibold">
                {formatModelDisplaySize(selectedModel)}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block">Context Window</span>
              <span className="text-neutral-200 font-semibold">
                {(selectedModel.contextTokens / 1024).toFixed(0)}k tokens
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block">Quantization</span>
              <span className="text-neutral-200 font-semibold">
                {selectedModel.quantization}
              </span>
            </div>
          </div>

          {/* Starter Type Selection */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-semibold text-neutral-200">
              What are you building?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option A: Local Chat */}
              <button
                type="button"
                onClick={() => {
                  setSelectedStarter("chat");
                  setGeneratedProject(null);
                  setGenerationError(null);
                }}
                className={`p-5 rounded-xl text-left transition-all duration-150 relative border
                  ${
                    selectedStarter === "chat"
                      ? "bg-emerald-950/40 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500"
                      : "bg-white/[0.03] border-white/10 hover:border-white/20 text-neutral-300"
                  }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm">💬 Local Chat</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                    Universal
                  </span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Interactive Node.js/TypeScript CLI chat with stream handling, conversation history, and direct local Ollama connectivity.
                </p>
              </button>

              {/* Option B: Tool-calling Agent (Requires tools === true) */}
              {selectedModel.capabilities.tools === true ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStarter("agent");
                    setGeneratedProject(null);
                    setGenerationError(null);
                  }}
                  className={`p-5 rounded-xl text-left transition-all duration-150 relative border
                    ${
                      selectedStarter === "agent"
                        ? "bg-emerald-950/40 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500"
                        : "bg-white/[0.03] border-white/10 hover:border-white/20 text-neutral-300"
                    }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm">🛠️ Tool-calling Agent</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-medium">
                      Agentic Loop
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Autonomous agent with JSON schema tool definitions, safe local calculator execution, and real multi-step tool-calling loop.
                  </p>
                </button>
              ) : (
                <div className="p-5 rounded-xl text-left border border-white/5 bg-white/[0.01] opacity-60 cursor-not-allowed">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-neutral-400">
                      🛠️ Tool-calling Agent
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">
                      Unavailable
                    </span>
                  </div>
                  <p className="text-xs text-amber-300/80 leading-relaxed">
                    ⚠️ {selectedModel.displayName} does not have verified native tool-calling support. Select a model with verified tools (like Gemma 4, Qwen 3.5, or Phi-4 Mini) to build an agent.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Generation Error Banner */}
          {generationError && (
            <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/50 text-xs text-red-200">
              <span className="font-bold text-red-400">Generation Error: </span>
              {generationError}
            </div>
          )}

          {/* Action: Generate Starter Button */}
          {selectedStarter && !generatedProject && (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-xl bg-black/40 border border-white/10">
              <div>
                <h4 className="text-sm font-semibold text-neutral-100">
                  Ready to generate your {selectedStarter === "chat" ? "Local Chat" : "Tool-calling Agent"} starter?
                </h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Pre-configured deterministic project for{" "}
                  <code className="text-emerald-400 font-mono font-bold">{selectedModel.ollamaTag}</code>.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateStarter}
                disabled={isGenerating}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Generating starter...</span>
                  </>
                ) : (
                  <>
                    <span>⚡ Generate Starter</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Success: Generated Files and Download ZIP */}
          {generatedProject && (
            <div className="space-y-4 pt-2">
              <div className="p-6 rounded-2xl bg-emerald-950/25 border border-emerald-500/40 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                    <span>✓ Starter generated</span>
                    <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-normal border border-emerald-500/30">
                      {generatedProject.projectName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadZip}
                    disabled={isDownloading}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <span>Packaging ZIP...</span>
                    ) : (
                      <>
                        <span>📦 Download ZIP</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Generated Files Listing */}
                <div className="space-y-2 bg-black/40 p-4 rounded-xl border border-white/5">
                  <div className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Generated Files ({generatedProject.files.length})</span>
                    <span className="text-[11px] text-neutral-500 font-mono">Zero external runtime dependencies</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-neutral-300">
                    {generatedProject.files.map((file) => (
                      <div key={file.path} className="flex items-center gap-2 p-2 rounded bg-white/[0.03] border border-white/5">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span className="text-neutral-200">{file.path}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Setup Instructions */}
                <div className="space-y-2 text-xs text-neutral-300">
                  <div className="font-semibold text-neutral-200">Setup Instructions:</div>
                  <div className="bg-black/60 p-3.5 rounded-lg border border-white/10 font-mono text-neutral-200 space-y-1">
                    <div className="text-neutral-500"># 1. Unzip the project and open terminal inside:</div>
                    <div className="text-neutral-500"># 2. Pull the verified model:</div>
                    <div className="text-emerald-400 font-bold">ollama pull {selectedModel.ollamaTag}</div>
                    <div className="text-neutral-500"># 3. Install dev dependencies:</div>
                    <div className="text-neutral-200">npm install</div>
                    <div className="text-neutral-500"># 4. Launch your starter:</div>
                    <div className="text-emerald-300">npm run dev</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Footer */}
      <footer className="mt-16 text-xs text-neutral-500 text-center space-y-1">
        <p>Hack Day Starter • Built for Hacktoberfest 2026 — Weekend Challenge: Build for a Friend</p>
        <p>Verified Model Registry v{REGISTRY_METADATA.registryVersion} ({REGISTRY_METADATA.verifiedDisplayDate})</p>
      </footer>
    </main>
  );
}
