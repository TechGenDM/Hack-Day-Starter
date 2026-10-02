/**
 * Static catalog of open-weight models suitable for local use with Ollama.
 *
 * Selection criteria for the MVP:
 * 1. Must be available via `ollama pull <tag>` with no extra setup.
 * 2. Must run on a 16 GB laptop in quantized form.
 * 3. Must cover the four use cases: code, chat, summarization, general.
 * 4. Prefer models with an active community and good GGUF quantizations.
 *
 * RAM estimates assume Q4_K_M quantization (the Ollama default for most models)
 * plus ~1–2 GB runtime overhead for KV cache and Ollama itself.
 *
 * These numbers are intentionally conservative so users don't hit swap.
 */

import { ModelEntry } from "./types";

export const MODEL_CATALOG: ModelEntry[] = [
  // ---- Tiny (≤ 2 B) -------------------------------------------------------
  {
    name: "Qwen 2.5 Coder 1.5B",
    ollamaTag: "qwen2.5-coder:1.5b",
    sizeGb: 1.0,
    ramRequired: 3,
    description:
      "Ultra-light code-focused model. Great for autocomplete and small code tasks on constrained hardware.",
    strengths: ["code"],
    minRamGb: 4,
    gpuBenefit: false, // so small it's fast on CPU
  },

  // ---- Small (3–4 B) -------------------------------------------------------
  {
    name: "Phi-4 Mini",
    ollamaTag: "phi4-mini",
    sizeGb: 2.4,
    ramRequired: 5,
    description:
      "Microsoft's compact reasoning model. Punches above its weight on code, math, and instruction-following.",
    strengths: ["code", "general", "chat"],
    minRamGb: 8,
    gpuBenefit: true,
  },
  {
    name: "Llama 3.2 3B",
    ollamaTag: "llama3.2:3b",
    sizeGb: 2.0,
    ramRequired: 4,
    description:
      "Meta's efficient small model. Solid all-rounder for chat and lightweight summarisation.",
    strengths: ["chat", "general", "summarization"],
    minRamGb: 8,
    gpuBenefit: true,
  },

  // ---- Medium (7–8 B) ------------------------------------------------------
  {
    name: "Llama 3.1 8B",
    ollamaTag: "llama3.1:8b",
    sizeGb: 4.7,
    ramRequired: 8,
    description:
      "The workhorse. Best quality-to-size ratio for general tasks, chat, and summarisation.",
    strengths: ["chat", "general", "summarization"],
    minRamGb: 12,
    gpuBenefit: true,
  },
  {
    name: "DeepSeek Coder V2 Lite",
    ollamaTag: "deepseek-coder-v2:lite",
    sizeGb: 8.9,
    ramRequired: 12,
    description:
      "Purpose-built for coding. Excellent at generation, explanation, and debugging across many languages.",
    strengths: ["code"],
    minRamGb: 16,
    gpuBenefit: true,
  },
  {
    name: "Gemma 3 12B",
    ollamaTag: "gemma3:12b",
    sizeGb: 8.1,
    ramRequired: 12,
    description:
      "Google's latest open model. Strong instruction-following and multi-turn conversation.",
    strengths: ["chat", "general", "summarization", "code"],
    minRamGb: 16,
    gpuBenefit: true,
  },
];
