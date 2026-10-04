import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckIcon,
  InfoIcon,
  WrenchIcon,
  CpuIcon,
  HardDriveIcon,
  AlertTriangleIcon,
} from "../components/ui/Icons";

export const metadata: Metadata = {
  title: "How It Works — Deterministic Sizing & Recommendation Engine",
  description:
    "Explore the deterministic scoring algorithm, hard safety gates, 1.5 GB buffer policy, and zero-hallucination architecture behind Hack Day Starter.",
  alternates: {
    canonical: "/how-it-works",
  },
  openGraph: {
    title: "How It Works — Deterministic Sizing & Recommendation Engine",
    description:
      "Why deterministic algorithms beat LLM hallucinations for AI hardware sizing: mathematical scoring, hard safety gates, and zero-dependency scaffolding.",
    url: "/how-it-works",
  },
};

export default function HowItWorksPage() {
  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-14 space-y-12">
      {/* ---------------------------------------------------------------- */}
      {/* Header */}
      {/* ---------------------------------------------------------------- */}
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
          <span>Architecture & Algorithm</span>
          <span className="text-neutral-600" aria-hidden="true">•</span>
          <span className="text-neutral-400">Deterministic Engine</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-neutral-100">
          How Hack Day Starter Works
        </h1>

        <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
          Why we use reproducible mathematical algorithms rather than probabilistic LLMs to size hardware, and how our recommendation weights are computed.
        </p>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Section 1: Deterministic vs. Probabilistic Recommenders */}
      {/* ---------------------------------------------------------------- */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-100">
          1. Deterministic Rules Beat LLM Hallucinations
        </h2>
        <div className="text-xs sm:text-sm text-neutral-300 leading-relaxed space-y-3">
          <p>
            When choosing an AI model for a weekend hackathon or production laptop, an AI chat prompt like <em>&quot;What model fits on my 16GB Mac?&quot;</em> often hallucinates nonexistent model variants, invents inaccurate parameter counts, or recommends 32B models that trigger instant kernel panics.
          </p>
          <p>
            Hack Day Starter uses a <strong>100% deterministic, test-backed engine</strong>. Given the same hardware inputs (RAM, GPU type, VRAM, and OS), the engine computes the exact same reproducible ranking every single time.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Section 2: The Two-Stage Evaluation Pipeline */}
      {/* ---------------------------------------------------------------- */}
      <section className="space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-100">
          2. The Two-Stage Pipeline: Safety Gates & Scoring
        </h2>

        {/* Stage 1: Hard Safety Gates */}
        <article className="p-5 sm:p-6 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-neutral-100">
            <span className="w-6 h-6 rounded-full bg-red-950 text-red-400 flex items-center justify-center text-xs font-bold border border-red-800/50">
              1
            </span>
            <span>Stage 1: Hard Safety Gates (Binary Elimination)</span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            Before any score is calculated, every model candidate must pass five non-negotiable safety criteria:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1">
              <span className="font-semibold text-neutral-200">1. Verification Status</span>
              <p className="text-neutral-400">Must be <code className="text-emerald-400">verified</code> against official primary sources. Discrepancies and stale models are blocked.</p>
            </div>
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1">
              <span className="font-semibold text-neutral-200">2. Active Lifecycle</span>
              <p className="text-neutral-400">Must not be <code className="text-red-400">retired</code> or deprecated from practical use.</p>
            </div>
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1">
              <span className="font-semibold text-neutral-200">3. Free Disk Space Buffer</span>
              <p className="text-neutral-400">Must satisfy: <code className="text-sky-300">Free Disk ≥ Model Size + 1.5 GB</code> to allow temporary blob unpacking.</p>
            </div>
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1">
              <span className="font-semibold text-neutral-200">4. Physical Memory Ceiling</span>
              <p className="text-neutral-400">Model weight plus runtime buffer cannot exceed physical RAM or available GPU VRAM.</p>
            </div>
          </div>
        </article>

        {/* Stage 2: Deterministic Scoring Weights */}
        <article className="p-5 sm:p-6 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-neutral-100">
            <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center text-xs font-bold border border-emerald-800/50">
              2
            </span>
            <span>Stage 2: Weighted Compatibility Scoring (Max 100 Pts)</span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            Models passing all hard gates are evaluated across four weighted dimensions:
          </p>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-start justify-between gap-4">
              <div>
                <span className="font-bold text-emerald-400 block text-sm">Use Case Alignment (Up to 40 Points)</span>
                <p className="text-neutral-400 mt-1">
                  Rewards models whose verified strengths match the user’s declared workload (code, chat, summarization, general reasoning).
                </p>
              </div>
              <span className="font-mono font-bold text-neutral-200 text-sm">40%</span>
            </div>

            <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-start justify-between gap-4">
              <div>
                <span className="font-bold text-sky-400 block text-sm">Memory Headroom Optimization (Up to 30 Points)</span>
                <p className="text-neutral-400 mt-1">
                  Calculates the sweet spot between running a model large enough to be intelligent, but leaving sufficient headroom to prevent system memory paging.
                </p>
              </div>
              <span className="font-mono font-bold text-neutral-200 text-sm">30%</span>
            </div>

            <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-start justify-between gap-4">
              <div>
                <span className="font-bold text-purple-400 block text-sm">Hardware Acceleration (Up to 20 Points)</span>
                <p className="text-neutral-400 mt-1">
                  Awards bonuses when models can be 100% offloaded to NVIDIA CUDA Tensor Cores or Apple Silicon Metal unified memory.
                </p>
              </div>
              <span className="font-mono font-bold text-neutral-200 text-sm">20%</span>
            </div>

            <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-start justify-between gap-4">
              <div>
                <span className="font-bold text-amber-400 block text-sm">Tool-Calling Capability Bonus (10 Points)</span>
                <p className="text-neutral-400 mt-1">
                  Awards additional weight when models possess verified native function calling, enabling agentic workflows.
                </p>
              </div>
              <span className="font-mono font-bold text-neutral-200 text-sm">10%</span>
            </div>
          </div>
        </article>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Section 3: The 1.5 GB Buffer Rationale */}
      {/* ---------------------------------------------------------------- */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-100">
          3. The 1.5 GB Safety Buffer Rationale
        </h2>
        <div className="text-xs sm:text-sm text-neutral-300 leading-relaxed space-y-3">
          <p>
            When Ollama pulls a model via <code className="text-neutral-200 font-mono">ollama pull &lt;tag&gt;</code>, it streams compressed tarballs from the registry and extracts the layer blobs to <code className="text-neutral-200 font-mono">~/.ollama/models/blobs</code>. If the target drive has zero remaining bytes during extraction, the download crashes and leaves orphaned temporary files.
          </p>
          <p>
            Similarly, operating systems (macOS WindowServer, Windows DWM, Linux systemd) require free RAM to handle display composition and background networking. Our mandatory <strong>1.5 GB buffer policy</strong> ensures neither disk writes nor active RAM allocations risk crashing the host environment.
          </p>
        </div>
      </section>

      {/* Navigation Footer */}
      <div className="pt-6 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <Link
          href="/"
          className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
        >
          ← Back to Hardware Profiler
        </Link>
        <Link
          href="/model-registry"
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
        >
          View Model Registry →
        </Link>
      </div>
    </main>
  );
}
