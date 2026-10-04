import type { Metadata } from "next";
import Link from "next/link";
import {
  CpuIcon,
  HardDriveIcon,
  SparklesIcon,
  InfoIcon,
  AlertTriangleIcon,
  CheckIcon,
} from "../components/ui/Icons";

export const metadata: Metadata = {
  title: "Ollama Hardware Requirements Guide — RAM, VRAM & Architectures",
  description:
    "An engineering guide to running open-weight LLMs locally with Ollama. Explains Apple Silicon unified memory (Metal), discrete NVIDIA CUDA VRAM, CPU bottlenecks, and KV cache calculations.",
  alternates: {
    canonical: "/ollama-hardware-guide",
  },
  openGraph: {
    title: "Ollama Hardware Requirements Guide — RAM, VRAM & Architectures",
    description:
      "Understand the memory physics of local LLMs: unified memory, discrete VRAM limits, PCIe transfer penalties, and KV cache scaling.",
    url: "/ollama-hardware-guide",
  },
};

export default function HardwareGuidePage() {
  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-14 space-y-12">
      {/* ---------------------------------------------------------------- */}
      {/* Header */}
      {/* ---------------------------------------------------------------- */}
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
          <span className="w-2 h-2 rounded-full bg-sky-500" aria-hidden="true" />
          <span>Technical Whitepaper</span>
          <span className="text-neutral-600" aria-hidden="true">•</span>
          <span className="text-neutral-400">Hardware Engineering</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-neutral-100">
          Ollama Hardware Requirements Guide
        </h1>

        <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
          Running large language models locally is memory-bound rather than compute-bound. This guide covers how memory architectures, VRAM boundaries, and KV cache expansion dictate real-world performance.
        </p>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Section 1: The Core Law of Local LLM Inference */}
      {/* ---------------------------------------------------------------- */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-100">
          1. The Fundamental Law: Memory Bandwidth vs. Compute
        </h2>
        <div className="text-xs sm:text-sm text-neutral-300 leading-relaxed space-y-3">
          <p>
            During autoregressive token generation (the decoding phase), an LLM generates one token at a time. To generate a single token, the model must read <strong>every single weight parameter</strong> from memory into the processor cores once.
          </p>
          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Token Generation Throughput Formula
            </div>
            <div className="font-mono text-emerald-400 text-xs sm:text-sm bg-neutral-950 p-3 rounded-lg border border-neutral-800">
              Maximum Tokens/Second ≈ Memory Bandwidth (GB/s) ÷ Model Memory Footprint (GB)
            </div>
            <p className="text-xs text-neutral-400">
              For example, an 8B model quantized to Q4 (~5 GB) on an M-series Mac with 200 GB/s unified bandwidth has a theoretical ceiling of 200 ÷ 5 ≈ 40 tokens/second. On standard dual-channel DDR5 system RAM (~80 GB/s), that same model tops out around 16 tokens/second.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Section 2: Hardware Architectures Compared */}
      {/* ---------------------------------------------------------------- */}
      <section className="space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-100">
          2. Comparing Compute & Memory Architectures
        </h2>

        {/* Apple Silicon Card */}
        <article className="p-5 sm:p-6 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-neutral-100">
            <SparklesIcon className="w-5 h-5 text-emerald-400" />
            <span>Apple Silicon Unified Memory (Metal)</span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            Apple’s M-series architecture (M1 through M4) shares a single high-bandwidth memory pool between the CPU, GPU, and Neural Engine. Ollama uses the Metal API to execute matrix multiplications directly on GPU cores without copying weights across a PCIe bus.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
              <span className="font-semibold text-emerald-400 block mb-1">Key Strengths</span>
              <ul className="space-y-1 text-neutral-400 list-disc list-inside">
                <li>High memory bandwidth (100 to 800+ GB/s).</li>
                <li>Massive VRAM ceiling (up to 128 GB on Max/Ultra chips).</li>
                <li>Low idle power consumption (~5–15W).</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
              <span className="font-semibold text-amber-400 block mb-1">Key Constraints</span>
              <ul className="space-y-1 text-neutral-400 list-disc list-inside">
                <li>macOS caps GPU allocation (default ~75% of RAM).</li>
                <li>Memory is non-upgradeable post-purchase.</li>
                <li>M1/M2/M3 base chips have fewer GPU cores.</li>
              </ul>
            </div>
          </div>
        </article>

        {/* NVIDIA CUDA Card */}
        <article className="p-5 sm:p-6 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-neutral-100">
            <CpuIcon className="w-5 h-5 text-sky-400" />
            <span>NVIDIA Discrete GPUs (CUDA)</span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            Dedicated NVIDIA GeForce RTX and workstation GPUs feature GDDR6 and GDDR6X memory with industry-leading bandwidth (&gt;900 GB/s on RTX 4090). Tensor Cores provide unmatched raw FLOPs for prompt processing (prefill).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
              <span className="font-semibold text-emerald-400 block mb-1">Key Strengths</span>
              <ul className="space-y-1 text-neutral-400 list-disc list-inside">
                <li>Highest tokens/second generation speed.</li>
                <li>Near-instant prompt prefill via Tensor Cores.</li>
                <li>Full FP16 / BF16 hardware tensor support.</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
              <span className="font-semibold text-amber-400 block mb-1">The VRAM Cliff</span>
              <ul className="space-y-1 text-neutral-400 list-disc list-inside">
                <li>Strict hardware VRAM ceiling (8 GB, 12 GB, 16 GB, 24 GB).</li>
                <li>Offloading layers to CPU RAM across PCIe causes severe latency.</li>
                <li>Higher thermal dissipation and electrical power draw.</li>
              </ul>
            </div>
          </div>
        </article>

        {/* CPU & AMD Card */}
        <article className="p-5 sm:p-6 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-neutral-100">
            <HardDriveIcon className="w-5 h-5 text-amber-400" />
            <span>AMD ROCm & Pure CPU Execution</span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            When dedicated VRAM or Metal acceleration is unavailable, Ollama falls back to vectorized CPU instructions (AVX2, AVX-512, AMX). While completely stable, throughput is limited by system RAM bandwidth.
          </p>
          <div className="text-xs bg-neutral-950 p-3.5 rounded-lg border border-neutral-800 text-neutral-400 space-y-1.5">
            <div className="font-semibold text-neutral-200">CPU Optimization Rules:</div>
            <div>• Set thread count equal to <strong>physical cores</strong>, not logical hyperthreads.</div>
            <div>• Dual-channel or quad-channel RAM configurations significantly improve tokens/sec.</div>
            <div>• Keep models under 4B–7B parameters to maintain acceptable interactive speeds (~4–10 tok/s).</div>
          </div>
        </article>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Section 3: KV Cache Overhead */}
      {/* ---------------------------------------------------------------- */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-100">
          3. The Hidden Memory Multiplier: KV Cache
        </h2>
        <div className="text-xs sm:text-sm text-neutral-300 leading-relaxed space-y-3">
          <p>
            Many developers calculate memory needs purely based on the downloaded model file size. This causes catastrophic OOM crashes during long conversations because the <strong>Key-Value (KV) Cache</strong> grows linearly with every token in the conversation history.
          </p>

          <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900/30">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-900/80 text-neutral-300 font-semibold border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Context Length</th>
                  <th className="py-3 px-4">KV Cache Overhead (8B Model)</th>
                  <th className="py-3 px-4">KV Cache Overhead (14B Model)</th>
                  <th className="py-3 px-4">Practical Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-neutral-400">
                <tr>
                  <td className="py-3 px-4 font-mono text-neutral-200">2,048 tokens</td>
                  <td className="py-3 px-4 font-mono">~0.25 GB</td>
                  <td className="py-3 px-4 font-mono">~0.45 GB</td>
                  <td className="py-3 px-4 text-emerald-400">Negligible; fits comfortably</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-neutral-200">8,192 tokens</td>
                  <td className="py-3 px-4 font-mono">~1.0 GB</td>
                  <td className="py-3 px-4 font-mono">~1.8 GB</td>
                  <td className="py-3 px-4 text-sky-400">Noticeable allocation chunk</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-neutral-200">32,768 tokens</td>
                  <td className="py-3 px-4 font-mono">~4.0 GB</td>
                  <td className="py-3 px-4 font-mono">~7.2 GB</td>
                  <td className="py-3 px-4 text-amber-400">May exceed 8GB/16GB VRAM bounds</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-neutral-200">131,072 tokens</td>
                  <td className="py-3 px-4 font-mono">~16.0 GB</td>
                  <td className="py-3 px-4 font-mono">~28.8 GB</td>
                  <td className="py-3 px-4 text-red-400">Requires 32GB+ dedicated unified memory</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-xs text-neutral-400">
            * Calculations based on standard FP16 KV cache representations across 32 transformer layers. FlashAttention and Q8_0 KV cache quantization reduce these numbers by approximately 50%.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Section 4: Sizing Guidelines Checklist */}
      {/* ---------------------------------------------------------------- */}
      <section className="p-5 sm:p-6 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
          <CheckIcon className="w-4 h-4" />
          <span>Hack Day Sizing Rules of Thumb</span>
        </h2>
        <div className="space-y-2 text-xs text-neutral-300">
          <div>
            <strong>1. Keep a 1.5 GB safety buffer:</strong> Always leave at least 1.5 GB of free disk space and system memory unallocated for OS background services.
          </div>
          <div>
            <strong>2. Don’t push beyond 75% RAM on macOS:</strong> Metal will refuse to allocate the remaining 25% to GPU operations without manual kernel sysctl flags.
          </div>
          <div>
            <strong>3. Avoid layer splitting across PCIe:</strong> If a model doesn’t fit 100% inside your NVIDIA VRAM, pick the next smaller quantization or parameter tier. Partial offloading kills throughput.
          </div>
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
          Browse Verified Model Registry →
        </Link>
      </div>
    </main>
  );
}
