/**
 * Core TypeScript types for the Hack Day Starter model recommendation system.
 *
 * These types define the contract between the UI, the model catalog, and the
 * recommendation engine. Keeping them in a single file makes it easy to evolve
 * the schema as we add features (e.g. project generation, benchmarks).
 */

// ---------------------------------------------------------------------------
// Hardware profile — what the user tells us about their machine
// ---------------------------------------------------------------------------

export type OperatingSystem = "macos" | "linux" | "windows";

/**
 * GPU capability tiers. We intentionally keep this coarse for the MVP:
 * - "apple-silicon": M1/M2/M3/M4 — unified memory, good for quantized LLMs
 * - "nvidia":         any discrete NVIDIA GPU with CUDA
 * - "none":           no usable GPU / integrated-only
 *
 * Future: add "amd" once ROCm + Ollama support stabilises.
 */
export type GpuType = "apple-silicon" | "nvidia" | "none";

export type UseCase = "code" | "chat" | "summarization" | "general";

export interface HardwareProfile {
  ramGb: number;
  gpu: GpuType;
  os: OperatingSystem;
  useCase: UseCase;
}

// ---------------------------------------------------------------------------
// Model catalog entry — static metadata for each model we know about
// ---------------------------------------------------------------------------

/**
 * How well we expect a model to run on a given hardware profile.
 * - "excellent": fast inference, fits comfortably in RAM
 * - "good":      runs well, maybe slightly slower
 * - "marginal":  will run but may be slow or require swap
 */
export type CompatibilityLevel = "excellent" | "good" | "marginal";

export interface ModelEntry {
  /** Human-readable name, e.g. "Phi-3 Mini" */
  name: string;

  /** Ollama pull tag, e.g. "phi3:mini" */
  ollamaTag: string;

  /** Approximate download / disk size in GB */
  sizeGb: number;

  /**
   * Rough RAM needed at inference time (GB).
   * For quantized GGUF models this is close to the file size + ~1-2 GB overhead.
   * We use this to filter out models that won't fit.
   */
  ramRequired: number;

  /** One-liner describing the model's sweet spot */
  description: string;

  /** Which use cases this model is strong at */
  strengths: UseCase[];

  /** Minimum RAM (GB) below which we won't even suggest it */
  minRamGb: number;

  /** Does this model benefit meaningfully from a GPU? */
  gpuBenefit: boolean;
}

// ---------------------------------------------------------------------------
// Recommendation result — what the engine returns to the UI
// ---------------------------------------------------------------------------

export interface Recommendation {
  model: ModelEntry;
  compatibilityLevel: CompatibilityLevel;
  explanation: string;
}
