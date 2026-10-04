import Link from "next/link";
import { REGISTRY_METADATA, VERIFIED_MODEL_REGISTRY } from "@/lib/registry";
import { HardwareWorkbench } from "./components/HardwareWorkbench";
import {
  CpuIcon,
  HardDriveIcon,
  WrenchIcon,
  CheckIcon,
  InfoIcon,
  ArrowRightIcon,
  SparklesIcon,
} from "./components/ui/Icons";

export default function HomePage() {
  // Pull current active verified models for the reference matrix
  const currentVerified = VERIFIED_MODEL_REGISTRY.filter(
    (m) => m.lifecycle === "current" && m.verificationStatus === "verified"
  );

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
          Hardware-Aware Local AI Recommender
        </h1>

        <p className="mt-3 text-sm sm:text-base text-neutral-400 leading-relaxed max-w-xl mx-auto">
          Match your machine’s RAM, GPU/VRAM, and OS against verified open-weight models.
          Deterministic memory sizing and instant TypeScript starter generation for Ollama.
        </p>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Interactive Profiler & Starter Scaffolding Workbench */}
      {/* ---------------------------------------------------------------- */}
      <div className="w-full">
        <HardwareWorkbench />
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Server-Rendered Section 1: The Physics of Local LLM Sizing */}
      {/* ---------------------------------------------------------------- */}
      <section className="mt-16 sm:mt-20 w-full border-t border-neutral-800 pt-12 space-y-6">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">
            Hardware Engineering
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-100">
            The Physics of Local LLM Sizing: Why VRAM & Architecture Matter
          </h2>
          <p className="text-sm text-neutral-400 leading-relaxed max-w-3xl">
            A common failure mode at AI hackathons is attempting to run a local model that exceeds physical hardware capacity, leading to disk swapping, system lockups, or out-of-memory crashes. Running open-weight models locally requires understanding three distinct memory allocations.
          </p>
        </div>

        {/* Memory Formula Card */}
        <div className="p-5 sm:p-6 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Total Working Memory Formula
          </div>
          <div className="font-mono text-sm sm:text-base text-emerald-400 bg-neutral-950 p-3.5 rounded-lg border border-neutral-800 overflow-x-auto">
            Total Memory Required = Model Weights + KV Cache + Run-Time Context + OS Overhead
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            The downloaded GGUF file size represents only the compressed weights. Once loaded into active memory, the KV cache (which grows linearly with context length) and active runtime buffers demand substantial additional allocation.
          </p>
        </div>

        {/* Hardware Architecture Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-2">
            <div className="font-semibold text-neutral-200 flex items-center gap-1.5 text-sm">
              <SparklesIcon className="w-4 h-4 text-emerald-400" />
              <span>Apple Silicon (Metal)</span>
            </div>
            <p className="text-neutral-400 leading-relaxed">
              Unified memory allows GPU cores direct access to system RAM at up to 800 GB/s bandwidth without PCIe transfer penalties. However, macOS caps GPU allocation (typically 75% of total RAM via <code className="text-neutral-300">sysctl iogpu.wired_mem_limit</code>).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-2">
            <div className="font-semibold text-neutral-200 flex items-center gap-1.5 text-sm">
              <CpuIcon className="w-4 h-4 text-sky-400" />
              <span>NVIDIA Discrete (CUDA)</span>
            </div>
            <p className="text-neutral-400 leading-relaxed">
              Dedicated GDDR6/HBM memory offers ultra-fast bandwidth (&gt;900 GB/s on RTX 4090), but capacity is rigid. When a model exceeds VRAM, offloading layers to CPU RAM across the PCIe bus drops token generation from 40+ tok/s to &lt;5 tok/s.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-2">
            <div className="font-semibold text-neutral-200 flex items-center gap-1.5 text-sm">
              <HardDriveIcon className="w-4 h-4 text-amber-400" />
              <span>AMD & CPU Execution</span>
            </div>
            <p className="text-neutral-400 leading-relaxed">
              Without dedicated CUDA or unified Metal memory, inference runs across CPU cores via AVX-512/AMX instructions. Memory bandwidth (typically 50–90 GB/s) bottlenecks throughput to ~3–8 tok/s, making compact 3B–4B models optimal.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Server-Rendered Section 2: Quick Hardware Sizing Matrix */}
      {/* ---------------------------------------------------------------- */}
      <section className="mt-14 w-full space-y-6">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-wider text-sky-400 font-bold">
            Quick Reference
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-100">
            Hardware Tier Sizing Matrix
          </h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Baseline recommendations based on physical memory tiers and verified Ollama model weights.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900/30">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-900/80 text-neutral-300 font-semibold border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Hardware Tier</th>
                <th className="py-3 px-4">Typical Spec</th>
                <th className="py-3 px-4">Max Weight Size</th>
                <th className="py-3 px-4">Recommended Models</th>
                <th className="py-3 px-4">Expected Speed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-neutral-400">
              <tr className="hover:bg-neutral-900/50 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-neutral-200">8 GB Entry</td>
                <td className="py-3.5 px-4">M1/M2/M3 Air, Intel/AMD 8GB RAM</td>
                <td className="py-3.5 px-4 font-mono text-neutral-300">&lt; 3.5 GB</td>
                <td className="py-3.5 px-4 text-emerald-400">
                  Qwen 3.5 4B, Gemma 4 E4B, DeepSeek R1 1.5B
                </td>
                <td className="py-3.5 px-4">12–25 tok/s</td>
              </tr>
              <tr className="hover:bg-neutral-900/50 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-neutral-200">16 GB Balanced</td>
                <td className="py-3.5 px-4">MacBook 16GB, RTX 3060/4060 (8-12GB VRAM)</td>
                <td className="py-3.5 px-4 font-mono text-neutral-300">&lt; 6.5 GB</td>
                <td className="py-3.5 px-4 text-emerald-400">
                  Qwen 3.5 9B, Qwen 3 8B, Phi-4 Mini
                </td>
                <td className="py-3.5 px-4">25–45 tok/s</td>
              </tr>
              <tr className="hover:bg-neutral-900/50 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-neutral-200">24–36 GB Power</td>
                <td className="py-3.5 px-4">M-Series Pro/Max, RTX 4080 (16GB VRAM)</td>
                <td className="py-3.5 px-4 font-mono text-neutral-300">&lt; 14 GB</td>
                <td className="py-3.5 px-4 text-emerald-400">
                  Gemma 4 12B, GPT-OSS 20B (MoE)
                </td>
                <td className="py-3.5 px-4">35–60 tok/s</td>
              </tr>
              <tr className="hover:bg-neutral-900/50 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-neutral-200">64 GB+ Workstation</td>
                <td className="py-3.5 px-4">M-Series Max/Ultra, RTX 3090/4090 (24GB VRAM)</td>
                <td className="py-3.5 px-4 font-mono text-neutral-300">&lt; 28 GB</td>
                <td className="py-3.5 px-4 text-emerald-400">
                  Qwen 3.6 27B/35B, Qwen 3.8 27B
                </td>
                <td className="py-3.5 px-4">40–80 tok/s</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Server-Rendered Section 3: Verified Facts vs Estimates */}
      {/* ---------------------------------------------------------------- */}
      <section className="mt-14 w-full space-y-6">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-wider text-purple-400 font-bold">
            Data Integrity
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-100">
            Source-Observed Facts vs. Empirical Estimates
          </h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Hack Day Starter strictly separates primary source data from empirical sizing calculations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-2">
            <div className="font-semibold text-emerald-400 flex items-center gap-1.5 text-sm">
              <CheckIcon className="w-4 h-4" />
              <span>Source-Observed Data</span>
            </div>
            <p className="text-neutral-400 leading-relaxed">
              Extracted directly from official Ollama library manifests: exact byte sizes, sha256 layer digests, context window token caps, and input modalities (vision, audio).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-2">
            <div className="font-semibold text-sky-400 flex items-center gap-1.5 text-sm">
              <InfoIcon className="w-4 h-4" />
              <span>Vendor Guidance</span>
            </div>
            <p className="text-neutral-400 leading-relaxed">
              Officially published system memory guidance directly from foundation model creators (Google DeepMind, Alibaba Cloud, Mistral AI) in model cards.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-2">
            <div className="font-semibold text-amber-400 flex items-center gap-1.5 text-sm">
              <WrenchIcon className="w-4 h-4" />
              <span>Starter Estimates</span>
            </div>
            <p className="text-neutral-400 leading-relaxed">
              Empirical memory comfort calculations including KV cache overhead and a 1.5 GB safety buffer, clearly labeled as estimates to prevent developer surprises.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Server-Rendered Section 4: Deep Dive Technical Resources */}
      {/* ---------------------------------------------------------------- */}
      <section className="mt-14 w-full space-y-6">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">
            Explore Guides
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-100">
            Technical Architecture & Guides
          </h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            In-depth engineering documentation for running local AI models and building agents.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/model-registry"
            className="group p-5 rounded-xl bg-neutral-900/40 border border-neutral-800 hover:border-neutral-700 transition-all space-y-2"
          >
            <div className="flex items-center justify-between text-neutral-100 font-semibold text-sm">
              <span>Verified Model Registry</span>
              <ArrowRightIcon className="w-4 h-4 text-neutral-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Browse all 17 tracked entries with exact manifest byte sizes, context windows, lifecycle states, and verified capabilities.
            </p>
          </Link>

          <Link
            href="/ollama-hardware-guide"
            className="group p-5 rounded-xl bg-neutral-900/40 border border-neutral-800 hover:border-neutral-700 transition-all space-y-2"
          >
            <div className="flex items-center justify-between text-neutral-100 font-semibold text-sm">
              <span>Ollama Hardware Guide</span>
              <ArrowRightIcon className="w-4 h-4 text-neutral-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Learn how Apple Silicon Metal unified memory, discrete NVIDIA CUDA VRAM, and KV cache calculations impact performance.
            </p>
          </Link>

          <Link
            href="/ollama-tool-calling"
            className="group p-5 rounded-xl bg-neutral-900/40 border border-neutral-800 hover:border-neutral-700 transition-all space-y-2"
          >
            <div className="flex items-center justify-between text-neutral-100 font-semibold text-sm">
              <span>Local Tool Calling & Agents</span>
              <ArrowRightIcon className="w-4 h-4 text-neutral-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Build autonomous TypeScript agent loops with native Ollama function calling, AST-safe calculators, and zero heavy frameworks.
            </p>
          </Link>

          <Link
            href="/how-it-works"
            className="group p-5 rounded-xl bg-neutral-900/40 border border-neutral-800 hover:border-neutral-700 transition-all space-y-2"
          >
            <div className="flex items-center justify-between text-neutral-100 font-semibold text-sm">
              <span>Deterministic Sizing Logic</span>
              <ArrowRightIcon className="w-4 h-4 text-neutral-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Explore our mathematical recommendation formula, hard safety gates, 1.5 GB buffer policy, and zero-hallucination design.
            </p>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-14 text-xs text-neutral-500 text-center space-y-1">
        <p>Hack Day Starter • Built for Hacktoberfest 2026 — Weekend Challenge: Build for a Friend</p>
        <p>
          Verified Model Registry v{REGISTRY_METADATA.registryVersion} ({REGISTRY_METADATA.verifiedDisplayDate})
        </p>
      </footer>
    </main>
  );
}
