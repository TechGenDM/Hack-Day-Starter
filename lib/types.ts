/**
 * Core TypeScript types for the Hack Day Starter model recommendation system.
 *
 * Phase 2 enhancements:
 * - Upgraded to a Verified Model Registry schema.
 * - HardwareProfile includes free disk space.
 * - Authoritative memory guidance vs estimated memory comfort.
 * - Structured model capabilities (tools, vision, audio, thinking).
 * - Registry metadata and verification status.
 */

// ---------------------------------------------------------------------------
// Hardware profile — user's physical machine configuration
// ---------------------------------------------------------------------------

export type OperatingSystem = "macos" | "linux" | "windows";

export type GpuType = "apple-silicon" | "nvidia" | "none";

export type UseCase = "code" | "chat" | "summarization" | "general";

export interface HardwareProfile {
  /** System RAM in GB */
  ramGb: number;
  /** GPU capability category */
  gpu: GpuType;
  /** Host operating system */
  os: OperatingSystem;
  /**
   * Available free disk space in GB.
   * Total SSD size does not reflect space available to store models.
   */
  freeDiskSpaceGb: number;
  /** Primary intended task */
  useCase: UseCase;
}

// ---------------------------------------------------------------------------
// Model capabilities
// ---------------------------------------------------------------------------

export interface ModelCapabilities {
  /** Model natively supports structured tool / function calling */
  tools: boolean;
  /** Model supports multimodal image inputs */
  vision: boolean;
  /** Model supports direct audio inputs */
  audio: boolean;
  /** Model uses explicit chain-of-thought / reasoning tokens */
  thinking: boolean;
}

// ---------------------------------------------------------------------------
// Verification status
// ---------------------------------------------------------------------------

export type VerificationStatus = "verified" | "unverified" | "stale";

// ---------------------------------------------------------------------------
// Verified Model Registry Entry
// ---------------------------------------------------------------------------

export interface ModelEntry {
  /** Unique stable identifier e.g. "gemma-4-12b" */
  id: string;

  /** Architecture / model family e.g. "gemma4", "qwen3.5" */
  family: string;

  /** Clean display name e.g. "Gemma 4 12B" */
  displayName: string;

  /** Model creator or provider e.g. "Google", "Alibaba Qwen" */
  provider: string;

  /** Exact Ollama library tag used for `ollama pull <tag>` */
  ollamaTag: string;

  /** Primary source URL on official Ollama library */
  ollamaUrl: string;

  /** Secondary source: official provider model card or documentation */
  sourceUrl: string;

  /** Software / model license */
  license: string;

  /** Total parameter count formatted string e.g. "12B", "3.8B" */
  parameterCount: string;

  /** Active parameter count for MoE models (optional) e.g. "4B" */
  activeParameterCount?: string;

  /** Approximate artifact download / disk footprint in GB */
  artifactSizeGb: number;

  /** Context window token limit */
  contextWindow: number;

  /** Detailed capability flags */
  capabilities: ModelCapabilities;

  /** Whether this model variant can run entirely locally via Ollama */
  localSupport: boolean;

  /**
   * Official memory guidance from the manufacturer/provider (GB).
   * NULL if no authoritative guidance exists.
   * DO NOT INVENT official values.
   */
  officialMemoryGuidance: number | null;

  /** Source citation or URL for the official memory guidance */
  memoryGuidanceSource: string | null;

  /** ISO 8601 timestamp when this entry was verified against primary sources */
  verifiedAt: string;

  /** Verification state */
  verificationStatus: VerificationStatus;

  /** Strongest use cases */
  strengths: UseCase[];

  /** Whether the model benefits significantly from GPU acceleration */
  gpuBenefit: boolean;

  /** One-line summary for hack day builders */
  description: string;
}

// ---------------------------------------------------------------------------
// Registry metadata (single source of truth for catalog version & date)
// ---------------------------------------------------------------------------

export interface RegistryMetadata {
  version: string;
  verifiedDate: string; // ISO date "2026-10-02"
  verifiedDisplayDate: string; // "October 2, 2026"
  sourceUrl: string;
}

// ---------------------------------------------------------------------------
// Recommendation result
// ---------------------------------------------------------------------------

export type CompatibilityLevel = "excellent" | "good" | "marginal";

export interface Recommendation {
  model: ModelEntry;
  compatibilityLevel: CompatibilityLevel;
  explanation: string;
  /** Estimated memory comfort level in GB (clearly labeled as estimate if non-official) */
  estimatedMemoryComfort: number;
  /** Memory guidance source type */
  memoryGuidanceType: "official" | "estimated";
}

// ---------------------------------------------------------------------------
// Starter Project Types (for Phase 2 model selector)
// ---------------------------------------------------------------------------

export type StarterType = "chat" | "agent";
