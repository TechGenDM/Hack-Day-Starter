import type { Metadata } from "next";
import Link from "next/link";
import {
  VERIFIED_MODEL_REGISTRY,
  REGISTRY_METADATA,
  getEligibleLocalModels,
} from "@/lib/registry";
import { formatModelDisplaySize, getModelMemoryReport } from "@/lib/memory-calculator";
import {
  CheckIcon,
  AlertTriangleIcon,
  HardDriveIcon,
  CpuIcon,
  WrenchIcon,
  InfoIcon,
  ExternalLinkIcon,
} from "../components/ui/Icons";

export const metadata: Metadata = {
  title: "Verified Ollama Model Registry — Hardware Specs & Benchmarks",
  description:
    "Explore the verified model registry for Ollama. Exact manifest sizes in bytes, context token windows, verified capabilities, official vendor guidance, and empirical memory estimates.",
  alternates: {
    canonical: "/model-registry",
  },
  openGraph: {
    title: "Verified Ollama Model Registry — Hardware Specs & Benchmarks",
    description:
      "Precise source-observed data, vendor-published guidance, and empirical sizing heuristics for 17 tracked open-weight models.",
    url: "/model-registry",
  },
};

export default function ModelRegistryPage() {
  const allModels = VERIFIED_MODEL_REGISTRY;
  const eligibleModels = getEligibleLocalModels();

  const currentModels = allModels.filter((m) => m.lifecycle === "current");
  const legacyModels = allModels.filter((m) => m.lifecycle === "legacy");
  const retiredModels = allModels.filter((m) => m.lifecycle === "retired");
  const unverifiedOrStale = allModels.filter(
    (m) => m.verificationStatus !== "verified"
  );

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-14 space-y-12">
      {/* ---------------------------------------------------------------- */}
      {/* Header & Verification Provenance */}
      {/* ---------------------------------------------------------------- */}
      <header className="space-y-4">
        <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
          <span>Registry Version:</span>
          <span className="font-mono font-semibold text-neutral-200">
            v{REGISTRY_METADATA.registryVersion}
          </span>
          <span className="text-neutral-600" aria-hidden="true">•</span>
          <span>Verified:</span>
          <span className="text-emerald-400 font-medium">
            {REGISTRY_METADATA.verifiedDisplayDate}
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-neutral-100">
          Verified Ollama Model Registry
        </h1>

        <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-3xl">
          An authoritative reference catalog of open-weight models evaluated for local laptop and workstation execution. Every entry is source-verified against official Ollama library manifests, with explicit distinctions between observed source facts, vendor publications, and empirical heuristics.
        </p>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Reconciled Metrics Breakdown (Corrections 4 & 5) */}
      {/* ---------------------------------------------------------------- */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
          <div className="text-xs text-neutral-400 font-medium">Tracked Entries</div>
          <div className="text-2xl font-bold text-neutral-100 mt-1">{allModels.length}</div>
          <div className="text-[11px] text-neutral-500 mt-0.5">Total catalog records</div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
          <div className="text-xs text-neutral-400 font-medium">Current Generation</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{currentModels.length}</div>
          <div className="text-[11px] text-neutral-500 mt-0.5">Active primary candidates</div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
          <div className="text-xs text-neutral-400 font-medium">Verified Records</div>
          <div className="text-2xl font-bold text-sky-400 mt-1">
            {REGISTRY_METADATA.verifiedModelsCount}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">Primary source agreement</div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
          <div className="text-xs text-neutral-400 font-medium">Eligible Recommender</div>
          <div className="text-2xl font-bold text-purple-400 mt-1">{eligibleModels.length}</div>
          <div className="text-[11px] text-neutral-500 mt-0.5">Passes local safety gates</div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Taxonomy & Methodology Explanation */}
      {/* ---------------------------------------------------------------- */}
      <section className="p-5 sm:p-6 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
          Data Fidelity & Lifecycle Taxonomy
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1.5">
            <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckIcon className="w-3.5 h-3.5" />
              <span>1. Source-Observed Data</span>
            </span>
            <p className="text-neutral-400 leading-relaxed">
              Extracted directly from official Ollama library HTTP endpoints: exact manifest byte counts, short sha256 digests, quantization types, and context token ceilings.
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="font-semibold text-sky-400 flex items-center gap-1.5">
              <InfoIcon className="w-3.5 h-3.5" />
              <span>2. Officially Documented Values</span>
            </span>
            <p className="text-neutral-400 leading-relaxed">
              Minimum or recommended system RAM published in official foundation model documentation (e.g. Google DeepMind for Gemma, Alibaba for Qwen).
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="font-semibold text-amber-400 flex items-center gap-1.5">
              <WrenchIcon className="w-3.5 h-3.5" />
              <span>3. Hack Day Starter Estimates</span>
            </span>
            <p className="text-neutral-400 leading-relaxed">
              Empirical sizing calculations accounting for weight size, KV cache expansion, and a 1.5 GB OS safety margin to prevent swapping during live demonstrations.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Current Generation Models Table */}
      {/* ---------------------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-neutral-800 pb-3">
          <h2 className="text-lg sm:text-xl font-bold text-neutral-100">
            Current Generation Models ({currentModels.length})
          </h2>
          <span className="text-xs text-neutral-400">
            Active primary candidates evaluated for local deployment
          </span>
        </div>

        <div className="space-y-4">
          {currentModels.map((model) => {
            const mem = getModelMemoryReport(model);
            const isVerified = model.verificationStatus === "verified";

            return (
              <article
                key={model.id}
                className="p-5 rounded-xl bg-neutral-900/40 border border-neutral-800 hover:border-neutral-700 transition-all space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-neutral-100">
                        {model.displayName}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-medium">
                        {model.provider}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-800 font-mono">
                        {model.quantization}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-800/40 font-semibold">
                        Current
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5">
                      <code className="text-xs font-mono text-emerald-400 bg-neutral-950 px-2 py-1 rounded border border-neutral-800">
                        ollama pull {model.ollamaTag}
                      </code>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-neutral-400">License:</span>
                    <span className="font-medium text-neutral-300">{model.license}</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  {model.description}
                </p>

                {/* Sizing & Memory Specifications Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-neutral-950/60 p-3.5 rounded-lg border border-neutral-800/80">
                  <div>
                    <span className="text-neutral-400 block mb-0.5 font-medium">
                      Source Manifest Size
                    </span>
                    <span className="font-semibold text-neutral-200">
                      {formatModelDisplaySize(model)}
                    </span>
                    {model.exactManifestSizeBytes !== null && (
                      <span className="text-neutral-400 block text-[11px]">
                        ({model.exactManifestSizeBytes.toLocaleString()} bytes)
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-neutral-400 block mb-0.5 font-medium">
                      Context Token Window
                    </span>
                    <span className="font-semibold text-neutral-200">
                      {(model.contextTokens / 1024).toFixed(0)}k tokens
                    </span>
                    <span className="text-neutral-400 block text-[11px]">
                      ({model.contextTokens.toLocaleString()} tokens)
                    </span>
                  </div>

                  <div>
                    <span className="text-neutral-400 block mb-0.5 font-medium">
                      Memory Requirement
                    </span>
                    {mem.hasOfficialSystemGuidance ? (
                      <div>
                        <span className="font-semibold text-sky-300">
                          {mem.officialSystemGuidanceGb} GB System RAM
                        </span>
                        <span className="text-sky-400/80 block text-[11px]">
                          Official Vendor Guidance
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="font-semibold text-amber-300">
                          ~{mem.estimatedComfortGb} GB Comfort
                        </span>
                        <span className="text-amber-400/80 block text-[11px]">
                          Starter Empirical Estimate
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Capabilities and Sources */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-neutral-800/60">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-neutral-400">Verified Capabilities:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                        model.capabilities.tools
                          ? "bg-emerald-950/50 text-emerald-300 border-emerald-800/40"
                          : "bg-neutral-900 text-neutral-500 border-neutral-800"
                      }`}
                    >
                      {model.capabilities.tools ? "✓ Tool-calling" : "✕ No tools"}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                        model.capabilities.vision
                          ? "bg-purple-950/50 text-purple-300 border-purple-800/40"
                          : "bg-neutral-900 text-neutral-500 border-neutral-800"
                      }`}
                    >
                      {model.capabilities.vision ? "✓ Multimodal Vision" : "✕ Text only"}
                    </span>
                    {model.capabilities.thinking && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-950/50 text-indigo-300 border border-indigo-800/40">
                        Reasoning tokens
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <a
                      href={model.ollamaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-400 hover:text-neutral-200 underline decoration-neutral-600 underline-offset-2 transition-colors inline-flex items-center gap-1"
                    >
                      <span>Ollama Page</span>
                      <ExternalLinkIcon className="w-3 h-3" />
                    </a>
                    <a
                      href={model.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-400 hover:text-neutral-200 underline decoration-neutral-600 underline-offset-2 transition-colors inline-flex items-center gap-1"
                    >
                      <span>Model Card</span>
                      <ExternalLinkIcon className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Legacy Models Section */}
      {/* ---------------------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-neutral-800 pb-3">
          <h2 className="text-lg sm:text-xl font-bold text-neutral-100">
            Legacy Models ({legacyModels.length})
          </h2>
          <span className="text-xs text-neutral-400">
            Older model generations superseded by newer family revisions
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {legacyModels.map((model) => (
            <article
              key={model.id}
              className="p-5 rounded-xl bg-neutral-900/30 border border-neutral-800 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-neutral-200">{model.displayName}</h3>
                <span className="text-[11px] px-2 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-800/40 font-semibold">
                  Legacy
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {model.description}
              </p>
              <div className="text-xs font-mono text-neutral-400 bg-neutral-950 p-2 rounded border border-neutral-800">
                ollama pull {model.ollamaTag}
              </div>
              <div className="text-[11px] text-neutral-500">
                Superseded by newer architecture releases. Still functional in local Ollama runtimes.
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Retired & Unverified Candidates Section */}
      {/* ---------------------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-neutral-800 pb-3">
          <h2 className="text-lg sm:text-xl font-bold text-neutral-100">
            Retired & Unverified Candidates ({retiredModels.length + unverifiedOrStale.length})
          </h2>
          <span className="text-xs text-neutral-400">
            Tracked for catalog integrity; strictly barred from active recommendations
          </span>
        </div>

        <div className="space-y-3">
          {allModels
            .filter((m) => m.lifecycle === "retired" || m.verificationStatus !== "verified")
            .map((model) => (
              <div
                key={model.id}
                className="p-4 rounded-xl bg-neutral-900/20 border border-neutral-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-300">{model.displayName}</span>
                    <code className="text-[11px] text-neutral-400 font-mono">({model.ollamaTag})</code>
                    {model.lifecycle === "retired" && (
                      <span className="px-2 py-0.5 rounded bg-red-950/50 text-red-300 border border-red-800/40 text-[10px] font-semibold">
                        Retired
                      </span>
                    )}
                    {model.verificationStatus === "metadata-stale" && (
                      <span className="px-2 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-800/40 text-[10px] font-semibold">
                        Metadata Stale
                      </span>
                    )}
                    {model.verificationStatus === "unverified" && (
                      <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 text-[10px] font-semibold">
                        Unverified Candidate
                      </span>
                    )}
                  </div>
                  <p className="text-neutral-400 mt-1 text-[11px]">{model.description}</p>
                </div>

                <div className="shrink-0 text-neutral-500 text-[11px]">
                  Safety Gate: <span className="text-red-400">Excluded from recommendations</span>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* Back to Profiler Link */}
      <div className="pt-6 border-t border-neutral-800 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
        >
          <span>← Back to Hardware Profiler</span>
        </Link>
      </div>
    </main>
  );
}
