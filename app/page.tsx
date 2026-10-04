"use client";

import { useState } from "react";
import JSZip from "jszip";
import { REGISTRY_METADATA } from "@/lib/registry";
import { formatModelDisplaySize, getModelMemoryReport } from "@/lib/memory-calculator";
import { HardwareForm } from "./components/HardwareForm";
import { Callout } from "./components/ui/Callout";
import {
  CheckIcon,
  XIcon,
  CpuIcon,
  HardDriveIcon,
  WrenchIcon,
  InfoIcon,
  AlertTriangleIcon,
  CopyIcon,
  SpinnerIcon,
} from "./components/ui/Icons";
import type { StarterProjectResult } from "@/lib/starter/types";
import type {
  HardwareProfile,
  Recommendation,
  ModelEntry,
  StarterType,
} from "@/lib/types";

const COMPAT_STYLES: Record<string, string> = {
  excellent: "bg-emerald-950/40 text-emerald-300 ring-1 ring-emerald-500/40 border border-emerald-500/20",
  good: "bg-sky-950/40 text-sky-300 ring-1 ring-sky-500/40 border border-sky-500/20",
  marginal: "bg-amber-950/40 text-amber-300 ring-1 ring-amber-500/40 border border-amber-500/20",
};

export default function HomePage() {
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

  async function handleHardwareSubmit(profile: HardwareProfile) {
    setLoading(true);
    setError(null);
    setResults(null);
    setSelectedModel(null);
    setSelectedStarter(null);
    setGeneratedProject(null);
    setGenerationError(null);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to fetch recommendations");
      }

      const data = await res.json();
      setResults(data.recommendations);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load recommendations. Check that the server is running."
      );
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setGenerationError(msg);
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert("Failed to build ZIP file: " + msg);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-8 sm:py-14 max-w-4xl mx-auto w-full">
      {/* ---------------------------------------------------------------- */}
      {/* Header with Catalog Verification Metadata */}
      {/* ---------------------------------------------------------------- */}
      <header className="text-center max-w-2xl mb-8 sm:mb-10">
        <div className="inline-flex flex-wrap items-center justify-center gap-2 mb-4 px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
          <span>Catalog verified:</span>
          <span className="font-semibold text-emerald-400">
            {REGISTRY_METADATA.verifiedDisplayDate}
          </span>
          <span className="text-neutral-600" aria-hidden="true">•</span>
          <a
            href={REGISTRY_METADATA.sourceLibraryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-400 hover:text-neutral-200 underline decoration-neutral-600 underline-offset-2 transition-colors"
          >
            Official Ollama Library ↗
          </a>
        </div>

        <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-neutral-100">
          Hack Day Starter
        </h1>

        <p className="mt-3 text-sm sm:text-base text-neutral-400 leading-relaxed max-w-xl mx-auto">
          Find the right local model for your computer, backed by verified Ollama benchmarks.
          Facts are source-backed; estimates are explicitly labeled.
        </p>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Hardware Input Form (Phase 10B) */}
      {/* ---------------------------------------------------------------- */}
      <HardwareForm onSubmit={handleHardwareSubmit} loading={loading} />

      {/* Error Display */}
      {error && (
        <div className="mt-6 w-full">
          <Callout variant="error" title="Could not load recommendations">
            {error}
          </Callout>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Recommendations Results List */}
      {/* ---------------------------------------------------------------- */}
      {results && results.length > 0 && (
        <section
          className="mt-10 sm:mt-12 w-full space-y-6"
          aria-live="polite"
          id="recommendations-section"
        >
          <div className="flex items-baseline justify-between border-b border-neutral-800 pb-3">
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-100">
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
                  className={`relative rounded-xl p-5 sm:p-6 transition-all duration-150 border
                    ${
                      isSelected
                        ? "bg-neutral-900/90 border-emerald-500/80 ring-1 ring-emerald-500/50 shadow-sm"
                        : "bg-neutral-900/40 border-neutral-800 hover:border-neutral-700"
                    }`}
                >
                  {/* Rank badge */}
                  <span className="absolute -top-3 -left-3 w-7 h-7 flex items-center justify-center rounded-full bg-neutral-800 border border-neutral-700 text-xs font-bold text-neutral-200 shadow-xs">
                    #{i + 1}
                  </span>

                  {/* Header Row */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-neutral-100">
                          {rec.model.displayName}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-medium border border-neutral-700/60">
                          {rec.model.provider}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-800 font-mono">
                          {rec.model.quantization}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <code className="text-xs text-neutral-300 font-mono bg-neutral-950 px-2.5 py-1 rounded border border-neutral-800">
                          ollama pull {rec.model.ollamaTag}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopy(rec.model.ollamaTag)}
                          className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-200 transition-colors py-1 px-2 rounded hover:bg-neutral-800"
                          title="Copy command"
                        >
                          {copiedTag === rec.model.ollamaTag ? (
                            <>
                              <CheckIcon className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                              <span className="text-emerald-400 font-medium">Copied</span>
                            </>
                          ) : (
                            <>
                              <CopyIcon className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`shrink-0 px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider ${
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
                    <div className="space-y-1.5 bg-neutral-950/60 rounded-lg p-3 border border-neutral-800/80">
                      <div className="text-[11px] uppercase tracking-wider font-semibold text-emerald-400 flex items-center gap-1.5">
                        <CheckIcon className="w-3 h-3 text-emerald-400 shrink-0" aria-hidden="true" />
                        <span>Verified Fact</span>
                      </div>
                      <div className="text-neutral-300 flex items-center gap-1.5">
                        <HardDriveIcon className="w-3.5 h-3.5 text-neutral-400 shrink-0" aria-hidden="true" />
                        <span>
                          <strong>{formattedSize}</strong>
                          {rec.model.exactManifestSizeBytes !== null && (
                            <span className="text-neutral-400">
                              {" "}
                              ({rec.model.exactManifestSizeBytes.toLocaleString()} bytes)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="text-neutral-300 flex items-center gap-1.5">
                        <CpuIcon className="w-3.5 h-3.5 text-neutral-400 shrink-0" aria-hidden="true" />
                        <span>
                          Context: <strong>{(rec.model.contextTokens / 1024).toFixed(0)}k tokens</strong> (
                          {rec.model.contextTokens.toLocaleString()})
                        </span>
                      </div>
                      <div className="text-neutral-300 flex items-center gap-1.5">
                        <WrenchIcon className="w-3.5 h-3.5 text-neutral-400 shrink-0" aria-hidden="true" />
                        <span>
                          License: {rec.model.license} • Params: {rec.model.parameterCount}
                          {rec.model.activeParameterCount && ` (${rec.model.activeParameterCount} active)`}
                        </span>
                      </div>
                    </div>

                    {/* Right: Memory Guidance */}
                    <div className="space-y-1.5 bg-neutral-950/60 rounded-lg p-3 border border-neutral-800/80">
                      {memReport.hasOfficialSystemGuidance ? (
                        <>
                          <div className="text-[11px] uppercase tracking-wider font-semibold text-sky-400 flex items-center gap-1.5">
                            <CheckIcon className="w-3 h-3 text-sky-400 shrink-0" aria-hidden="true" />
                            <span>Verified Fact (Vendor Published)</span>
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
                          <div className="text-[11px] uppercase tracking-wider font-semibold text-amber-400 flex items-center gap-1.5">
                            <InfoIcon className="w-3 h-3 text-amber-400 shrink-0" aria-hidden="true" />
                            <span>Estimated Heuristic (Empirical)</span>
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
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-800/60">
                    <span className="text-xs text-neutral-400 font-medium">Verified Capabilities:</span>
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-md font-medium border ${
                        rec.model.capabilities.tools
                          ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/50"
                          : "bg-neutral-900 text-neutral-500 border-neutral-800"
                      }`}
                    >
                      {rec.model.capabilities.tools ? "✓ Tool-calling" : "✕ No tool-calling"}
                    </span>
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-md font-medium border ${
                        rec.model.capabilities.vision
                          ? "bg-purple-950/40 text-purple-300 border-purple-800/50"
                          : "bg-neutral-900 text-neutral-500 border-neutral-800"
                      }`}
                    >
                      {rec.model.capabilities.vision ? "✓ Multimodal Vision" : "✕ No vision"}
                    </span>
                    {rec.model.capabilities.thinking && (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-md font-medium bg-neutral-900 text-indigo-300 border border-neutral-800">
                        Reasoning tokens
                      </span>
                    )}
                  </div>

                  {/* Explanation Block */}
                  <div className="bg-neutral-950/50 rounded-lg p-3 border border-neutral-800/80 text-xs text-neutral-300 italic flex items-start gap-2">
                    <InfoIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{rec.explanation}</span>
                  </div>

                  {/* Sources & Action */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-3 text-xs text-neutral-400">
                      <a
                        href={rec.model.ollamaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-neutral-200 underline decoration-neutral-600 underline-offset-2 transition-colors"
                      >
                        Ollama Library Page ↗
                      </a>
                      <a
                        href={rec.model.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-neutral-200 underline decoration-neutral-600 underline-offset-2 transition-colors"
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
                      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 min-h-[36px]
                        ${
                          isSelected
                            ? "bg-emerald-600 text-white font-bold"
                            : "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700"
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
        <div className="mt-8 w-full px-5 py-8 rounded-xl bg-neutral-900/40 border border-neutral-800 text-center text-neutral-400">
          <div className="flex justify-center mb-2">
            <HardDriveIcon className="w-6 h-6 text-neutral-400" aria-hidden="true" />
          </div>
          <p className="text-base sm:text-lg font-semibold text-neutral-200 mb-1">
            No compatible models found
          </p>
          <p className="text-xs sm:text-sm max-w-md mx-auto leading-relaxed text-neutral-400">
            Your hardware constraints (RAM, GPU VRAM, or free disk space) are too tight for the models
            currently verified in our catalog. Try increasing available free disk space or system memory.
          </p>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Model Selector & Starter Type */}
      {/* ---------------------------------------------------------------- */}
      {selectedModel && (
        <section
          id="selected-model-section"
          className="mt-12 w-full bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 sm:p-7 space-y-6 shadow-xs"
        >
          <div className="border-b border-neutral-800 pb-4">
            <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">
              Ready to Build
            </span>
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-100 mt-1">
              Selected Model: {selectedModel.displayName}
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Verified on{" "}
              {new Date(selectedModel.verifiedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}{" "}
              • License: {selectedModel.license}
            </p>
          </div>

          {/* Model Summary Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-950/60 rounded-lg p-3.5 border border-neutral-800/80 text-xs">
            <div>
              <span className="text-neutral-400 block">Ollama Tag</span>
              <code className="text-neutral-200 font-mono font-semibold">
                {selectedModel.ollamaTag}
              </code>
            </div>
            <div>
              <span className="text-neutral-400 block">
                {selectedModel.exactManifestSizeBytes !== null ? "Manifest Size" : "Ollama Listed Size"}
              </span>
              <span className="text-neutral-200 font-semibold">
                {formatModelDisplaySize(selectedModel)}
              </span>
            </div>
            <div>
              <span className="text-neutral-400 block">Context Window</span>
              <span className="text-neutral-200 font-semibold">
                {(selectedModel.contextTokens / 1024).toFixed(0)}k tokens
              </span>
            </div>
            <div>
              <span className="text-neutral-400 block">Quantization</span>
              <span className="text-neutral-200 font-semibold">
                {selectedModel.quantization}
              </span>
            </div>
          </div>

          {/* Starter Type Selection */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-semibold text-neutral-200">
              Select starter template:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Local Chat */}
              <button
                type="button"
                onClick={() => {
                  setSelectedStarter("chat");
                  setGeneratedProject(null);
                  setGenerationError(null);
                }}
                className={`p-4 rounded-lg text-left transition-all duration-150 relative border cursor-pointer
                  ${
                    selectedStarter === "chat"
                      ? "bg-neutral-800 border-neutral-600 ring-1 ring-emerald-500/40 text-neutral-100"
                      : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 text-neutral-300"
                  }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">Local Chat</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 font-medium">
                    Universal
                  </span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Interactive Node.js/TypeScript CLI chat with stream handling, conversation history, and direct local Ollama connectivity.
                </p>
              </button>

              {/* Option B: Tool-calling Agent */}
              {selectedModel.capabilities.tools === true ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStarter("agent");
                    setGeneratedProject(null);
                    setGenerationError(null);
                  }}
                  className={`p-4 rounded-lg text-left transition-all duration-150 relative border cursor-pointer
                    ${
                      selectedStarter === "agent"
                        ? "bg-neutral-800 border-neutral-600 ring-1 ring-emerald-500/40 text-neutral-100"
                        : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 text-neutral-300"
                    }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">Tool-calling Agent</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-800/40 font-medium">
                      Agentic Loop
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Autonomous agent with JSON schema tool definitions, safe local calculator execution, and real multi-step tool-calling loop.
                  </p>
                </button>
              ) : (
                <div className="p-4 rounded-lg text-left border border-neutral-800/50 bg-neutral-950/30 opacity-60 cursor-not-allowed">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-neutral-400">
                      Tool-calling Agent
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-medium">
                      Unavailable
                    </span>
                  </div>
                  <p className="text-xs text-amber-400/90 leading-relaxed flex items-start gap-1 mt-1">
                    <AlertTriangleIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      {selectedModel.displayName} does not have verified native tool-calling support.
                      Select a model with verified tools to build an agent.
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Generation Error Banner */}
          {generationError && (
            <Callout variant="error" title="Generation Error">
              {generationError}
            </Callout>
          )}

          {/* Action: Generate Starter Button */}
          {selectedStarter && !generatedProject && (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-lg bg-neutral-950/60 border border-neutral-800">
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
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {isGenerating ? (
                  <>
                    <SpinnerIcon className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Generating starter…</span>
                  </>
                ) : (
                  <span>Generate Starter</span>
                )}
              </button>
            </div>
          )}

          {/* Success: Generated Files and Download ZIP */}
          {generatedProject && (
            <div className="space-y-4 pt-2">
              <div className="p-5 sm:p-6 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm sm:text-base">
                    <CheckIcon className="w-4 h-4" aria-hidden="true" />
                    <span>Starter generated</span>
                    <span className="text-xs px-2.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono font-normal border border-neutral-700">
                      {generatedProject.projectName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadZip}
                    disabled={isDownloading}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {isDownloading ? (
                      <>
                        <SpinnerIcon className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span>Packaging ZIP…</span>
                      </>
                    ) : (
                      <>
                        <HardDriveIcon className="w-4 h-4" aria-hidden="true" />
                        <span>Download ZIP</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Generated Files Listing */}
                <div className="space-y-2 bg-neutral-900/60 p-3.5 sm:p-4 rounded-lg border border-neutral-800">
                  <div className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Generated Files ({generatedProject.files.length})</span>
                    <span className="text-[11px] text-neutral-400 font-mono">Zero external runtime dependencies</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-neutral-300">
                    {generatedProject.files.map((file) => (
                      <div key={file.path} className="flex items-center gap-2 p-2 rounded bg-neutral-950 border border-neutral-800">
                        <CheckIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                        <span className="text-neutral-200">{file.path}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Setup Instructions */}
                <div className="space-y-2 text-xs text-neutral-300">
                  <div className="font-semibold text-neutral-200">Setup Instructions:</div>
                  <div className="bg-neutral-950 p-3.5 rounded-lg border border-neutral-800 font-mono text-neutral-200 space-y-1">
                    <div className="text-neutral-400"># 1. Unzip the project and open terminal inside:</div>
                    <div className="text-neutral-400"># 2. Pull the verified model:</div>
                    <div className="text-emerald-400 font-bold">ollama pull {selectedModel.ollamaTag}</div>
                    <div className="text-neutral-400"># 3. Install dev dependencies:</div>
                    <div className="text-neutral-200">npm install</div>
                    <div className="text-neutral-400"># 4. Launch your starter:</div>
                    <div className="text-emerald-300">npm run dev</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Footer */}
      <footer className="mt-14 text-xs text-neutral-400 text-center space-y-1">
        <p>Hack Day Starter • Built for Hacktoberfest 2026 — Weekend Challenge: Build for a Friend</p>
        <p>
          Verified Model Registry v{REGISTRY_METADATA.registryVersion} ({REGISTRY_METADATA.verifiedDisplayDate})
        </p>
      </footer>
    </main>
  );
}
