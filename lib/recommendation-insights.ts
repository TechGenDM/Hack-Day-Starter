/**
 * Presentation helpers for the recommendation results UI (Phase 10C).
 *
 * IMPORTANT: this module is READ-ONLY with respect to the recommendation engine.
 * It never ranks, scores, filters or re-orders models. It only turns the
 * already-ranked `Recommendation[]` returned by `/api/recommend` (plus the
 * hardware profile the user submitted) into human-readable labels and
 * explanations. Every statement it produces is derived from real registry data
 * or from the same hardware factors the engine uses (memory baseline, use-case
 * strengths, tool capability, GPU/VRAM fit, free disk).
 *
 * It deliberately imports only pure helpers and types so it can be used in a
 * client component without pulling the model registry into the browser bundle.
 */

import { getModelApproxSizeGb, getModelMemoryReport } from "./memory-calculator";
import type {
  CompatibilityLevel,
  HardwareProfile,
  ModelEntry,
  Recommendation,
} from "./types";

// ---------------------------------------------------------------------------
// Small formatting utilities
// ---------------------------------------------------------------------------

/** 4 -> "4", 4.25 -> "4.3" (never "4.0"). */
export function formatGb(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
}

/** 131072 -> "128k". */
export function formatContext(tokens: number): string {
  return `${(tokens / 1024).toFixed(0)}k`;
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function effectiveParams(model: ModelEntry): { label: string; value: number } {
  const label = model.activeParameterCount ?? model.parameterCount;
  const value = parseFloat(label);
  return { label, value: Number.isNaN(value) ? 0 : value };
}

// ---------------------------------------------------------------------------
// Hardware profile summary
// ---------------------------------------------------------------------------

const USE_CASE_LABEL: Record<HardwareProfile["useCase"], string> = {
  code: "Code",
  chat: "Chat",
  summarization: "Summarization",
  general: "General",
};

export function describeProfile(profile: HardwareProfile): string {
  const gpu =
    profile.gpuType === "apple-silicon"
      ? `Apple Silicon${
          profile.appleSiliconGeneration
            ? ` ${profile.appleSiliconGeneration.toUpperCase()}`
            : ""
        }`
      : profile.gpuType === "nvidia"
      ? `NVIDIA GPU${profile.gpuVramGb ? ` (${formatGb(profile.gpuVramGb)} GB VRAM)` : ""}`
      : "CPU only";

  return [
    `${formatGb(profile.ramGb)} GB RAM`,
    gpu,
    `${formatGb(profile.freeDiskSpaceGb)} GB free disk`,
    `${USE_CASE_LABEL[profile.useCase]} use case`,
  ].join(" · ");
}

// ---------------------------------------------------------------------------
// Fit label (maps the engine's existing compatibility level; no recalculation)
// ---------------------------------------------------------------------------

export type FitLabel = "Comfortable" | "Fits" | "Tight";
export type FitTone = "comfortable" | "fits" | "tight";

export function getFitLabel(level: CompatibilityLevel): FitLabel {
  switch (level) {
    case "excellent":
      return "Comfortable";
    case "good":
      return "Fits";
    default:
      return "Tight";
  }
}

export interface FitSummary {
  label: FitLabel;
  tone: FitTone;
  /** One sentence explaining the label in terms of the user's memory. */
  detail: string;
}

/** Memory the engine uses as the fit baseline, with an honest basis label. */
export interface MemoryRequirement {
  gb: number;
  basis: "vendor" | "estimate";
  /** e.g. "16 GB (vendor guidance)" or "~11 GB (estimate)". */
  label: string;
}

export function getMemoryRequirement(model: ModelEntry): MemoryRequirement {
  const report = getModelMemoryReport(model);
  const basis = report.baselineType === "official-system" ? "vendor" : "estimate";
  const gb = report.recommendationBaselineGb;
  return {
    gb,
    basis,
    label:
      basis === "vendor"
        ? `${formatGb(gb)} GB (vendor guidance)`
        : `~${formatGb(gb)} GB (estimate)`,
  };
}

/** Spare memory = user RAM minus the same baseline the engine scores against. */
export function getMemoryHeadroomGb(model: ModelEntry, profile: HardwareProfile): number {
  return profile.ramGb - getModelMemoryReport(model).recommendationBaselineGb;
}

export function getFitSummary(rec: Recommendation, profile: HardwareProfile): FitSummary {
  const label = getFitLabel(rec.compatibilityLevel);
  const headroom = getMemoryHeadroomGb(rec.model, profile);

  if (label === "Tight") {
    const deficit = Math.max(0, -headroom);
    return {
      label,
      tone: "tight",
      detail:
        deficit > 0
          ? `About ${formatGb(deficit)} GB under the recommended memory. Close other applications before running.`
          : "Little memory to spare. Close other applications before running.",
    };
  }

  return {
    label,
    tone: label === "Comfortable" ? "comfortable" : "fits",
    detail:
      label === "Comfortable"
        ? `${formatGb(Math.max(0, headroom))} GB of memory to spare on your ${formatGb(profile.ramGb)} GB.`
        : `Runs within your ${formatGb(profile.ramGb)} GB with ${formatGb(Math.max(0, headroom))} GB to spare.`,
  };
}

// ---------------------------------------------------------------------------
// Verification status (honest: never claims runtime verification without data)
// ---------------------------------------------------------------------------

export type VerificationState =
  | "runtime-verified"
  | "source-verified-runtime-pending"
  | "source-verified"
  | "unverified";

export interface VerificationSummary {
  state: VerificationState;
  /** Full label for the top pick. */
  label: string;
  /** Short label for compact rows. */
  shortLabel: string;
  detail: string;
}

export function getVerificationSummary(model: ModelEntry): VerificationSummary {
  if (model.verificationStatus !== "verified") {
    return {
      state: "unverified",
      label: "Unverified",
      shortLabel: "Unverified",
      detail: "Facts for this model have not been confirmed against the Ollama library.",
    };
  }

  if (model.runtimeVerification === "runtime-verified") {
    return {
      state: "runtime-verified",
      label: "Runtime Verified",
      shortLabel: "Runtime Verified",
      detail:
        model.capabilities.tools === true
          ? "Run end-to-end through the Hack Day Starter Local Chat and Tool-calling Agent."
          : "Run end-to-end through the Hack Day Starter Local Chat.",
    };
  }

  if (model.runtimeVerification === "runtime-pending") {
    return {
      state: "source-verified-runtime-pending",
      label: "Source Verified · Runtime Pending",
      shortLabel: "Source Verified · Runtime Pending",
      detail:
        "Facts match the Ollama library listing. It has not yet been run through the starter's Chat or Agent.",
    };
  }

  return {
    state: "source-verified",
    label: "Source Verified",
    shortLabel: "Source Verified",
    detail: "Facts match the Ollama library listing.",
  };
}

// ---------------------------------------------------------------------------
// Capabilities
// ---------------------------------------------------------------------------

/** Only capabilities that are positively verified are listed. */
export function getCapabilityList(model: ModelEntry): string[] {
  const caps: string[] = [];
  if (model.capabilities.tools === true) caps.push("Tool calling");
  if (model.capabilities.vision === true) caps.push("Vision");
  if (model.capabilities.thinking === true) caps.push("Reasoning");
  return caps;
}

// ---------------------------------------------------------------------------
// Tool-calling Agent availability (derived from capability + status data only)
// ---------------------------------------------------------------------------

export interface AgentAvailability {
  available: boolean;
  /** "Available" | "Unavailable" */
  headline: string;
  reason: string;
  /** Actionable pointer to another recommended model, when one supports agents. */
  suggestion: string | null;
}

export function getAgentAvailability(
  model: ModelEntry,
  others: ReadonlyArray<{ rank: number; model: ModelEntry }> = []
): AgentAvailability {
  const tools = model.capabilities.tools;

  if (tools === true) {
    const runtime = model.runtimeVerification;
    return {
      available: true,
      headline: "Available",
      reason:
        runtime === "runtime-verified"
          ? "Native tool calling is listed on Ollama and the agent loop was run end-to-end in Hack Day Starter."
          : runtime === "runtime-pending"
          ? "Native tool calling is listed on Ollama. The agent loop has not been run end-to-end yet."
          : "Native tool calling is verified from the Ollama library listing.",
      suggestion: null,
    };
  }

  const alternative = others.find((o) => o.model.capabilities.tools === true);
  return {
    available: false,
    headline: "Unavailable",
    reason:
      tools === false
        ? `Ollama lists no native tool calling for ${model.displayName}, so the agent loop cannot run on it. Local Chat still works.`
        : `Tool-calling support for ${model.displayName} could not be verified, so the Agent starter is disabled. Local Chat still works.`,
    suggestion: alternative
      ? `Choose ${alternative.model.displayName} (#${alternative.rank}) to build an agent.`
      : null,
  };
}

// ---------------------------------------------------------------------------
// Recommendation Score Factors Breakdown (Phase 10D Transparency)
// ---------------------------------------------------------------------------

export interface ScoredFactor {
  id: "use-case" | "memory" | "capacity" | "gpu" | "tools" | "disk";
  title: string;
  points: number;
  maxPoints: number;
  awarded: boolean;
  explanation: string;
}

export interface ScoreReport {
  totalScore: number;
  factors: ScoredFactor[];
}

/**
 * Computes the exact score breakdown for a model against a hardware profile.
 * Every point awarded directly mirrors the deterministic scoring in lib/recommend.ts:
 * 1. Use-case relevance (+40)
 * 2. Memory headroom & comfort (0–30)
 * 3. Model capacity bonus (0–15, only for >=16 GB RAM and >=2 GB headroom)
 * 4. GPU & VRAM bonus (0 to 30)
 * 5. Tool-calling capability bonus (0 or 10)
 * 6. Free disk comfort bonus (0 or 5, for free disk >= 2.5x download size)
 */
export function getScoreBreakdown(model: ModelEntry, profile: HardwareProfile): ScoreReport {
  const artifactSizeGb = getModelApproxSizeGb(model);
  const memoryReport = getModelMemoryReport(model);
  const factors: ScoredFactor[] = [];

  // --- 1. Use-case Relevance (0 or 40 pts) ---
  const hasUseCase = model.strengths.includes(profile.useCase);
  const useCasePts = hasUseCase ? 40 : 0;
  factors.push({
    id: "use-case",
    title: "Use-Case Relevance",
    points: useCasePts,
    maxPoints: 40,
    awarded: hasUseCase,
    explanation: hasUseCase
      ? `Verified strength for ${profile.useCase} workflows (+40 pts).`
      : `General-purpose profile; not specifically listed for ${profile.useCase} (0/40 pts).`,
  });

  // --- 2. Memory Headroom & Comfort (0–30 pts) ---
  const headroom = profile.ramGb - memoryReport.recommendationBaselineGb;
  let memoryPts = 0;
  if (headroom >= 0) {
    memoryPts = Math.round((10 + Math.min(20, (headroom / 16) * 20)) * 10) / 10;
  } else {
    memoryPts = Math.round(Math.max(0, 8 + headroom * 2) * 10) / 10;
  }
  const memoryReq = getMemoryRequirement(model);
  factors.push({
    id: "memory",
    title: "Memory Headroom & Comfort",
    points: memoryPts,
    maxPoints: 30,
    awarded: headroom >= 0,
    explanation:
      headroom >= 0
        ? `${formatGb(headroom)} GB spare on your ${formatGb(profile.ramGb)} GB RAM beyond ${memoryReq.label} (+${formatGb(memoryPts)} pts).`
        : `Tight fit: ${formatGb(Math.abs(headroom))} GB under ${memoryReq.label} baseline (${formatGb(memoryPts)}/30 pts). Close background apps.`,
  });

  // --- 3. Model Capacity Bonus (0–15 pts) ---
  let capacityPts = 0;
  let capacityExplanation = "";
  const effectiveParamsStr = model.activeParameterCount ?? model.parameterCount;
  const effectiveParamNum = parseFloat(effectiveParamsStr);

  if (profile.ramGb >= 16 && headroom >= 2) {
    if (!isNaN(effectiveParamNum)) {
      capacityPts = Math.round(Math.min(15, (effectiveParamNum / 12) * 15) * 10) / 10;
    }
    capacityExplanation = `Awarded +${formatGb(capacityPts)} pts for ${effectiveParamsStr}${model.activeParameterCount ? " active" : ""} parameters on your ${formatGb(profile.ramGb)} GB RAM with ample headroom.`;
  } else {
    capacityExplanation = `Not applied (0/15 pts): engine reserves capacity bonus for machines with >= 16 GB RAM and >= 2 GB headroom.`;
  }
  factors.push({
    id: "capacity",
    title: "Model Capacity Bonus",
    points: capacityPts,
    maxPoints: 15,
    awarded: capacityPts > 0,
    explanation: capacityExplanation,
  });

  // --- 4. GPU & VRAM Bonus (0 to 30 pts) ---
  let gpuPts = 0;
  let gpuExplanation = "";
  if (model.gpuBenefit) {
    if (profile.gpuType === "nvidia") {
      gpuPts = 20;
      if (profile.gpuVramGb !== null && profile.gpuVramGb >= artifactSizeGb + 0.8) {
        gpuPts += 5;
        gpuExplanation = `NVIDIA CUDA acceleration (+20 pts) + discrete VRAM fit bonus (+5 pts) in your ${formatGb(profile.gpuVramGb)} GB VRAM with room for KV cache.`;
      } else {
        gpuExplanation = `NVIDIA CUDA acceleration (+20 pts) with partial CPU offloading.`;
      }
    } else if (profile.gpuType === "apple-silicon" && profile.os === "macos") {
      gpuPts = 30;
      gpuExplanation = `Apple Silicon unified memory acceleration (+20 GPU + 10 Metal unified memory = +30 pts).`;
    } else {
      gpuExplanation = `Model benefits from GPU acceleration, but CPU-only hardware selected (0/30 pts).`;
    }
  } else {
    gpuExplanation = `Model does not declare significant GPU acceleration benefit (0/30 pts).`;
  }
  factors.push({
    id: "gpu",
    title: "GPU & Hardware Acceleration",
    points: gpuPts,
    maxPoints: 30,
    awarded: gpuPts > 0,
    explanation: gpuExplanation,
  });

  // --- 5. Tool-calling Capability Bonus (0 or 10 pts) ---
  const hasTools = model.capabilities.tools === true;
  const toolPts = hasTools ? 10 : 0;
  factors.push({
    id: "tools",
    title: "Tool-Calling Capability",
    points: toolPts,
    maxPoints: 10,
    awarded: hasTools,
    explanation: hasTools
      ? `Verified native tool calling enabled (+10 pts), supports Tool-calling Agent starter.`
      : `No verified native tool calling (0/10 pts), limited to Local Chat starter.`,
  });

  // --- 6. Free Disk Headroom Bonus (0 or 5 pts) ---
  const diskComfort = profile.freeDiskSpaceGb >= artifactSizeGb * 2.5;
  const diskPts = diskComfort ? 5 : 0;
  const remainingDisk = Math.max(0, profile.freeDiskSpaceGb - artifactSizeGb);
  factors.push({
    id: "disk",
    title: "Free Disk Comfort Bonus",
    points: diskPts,
    maxPoints: 5,
    awarded: diskComfort,
    explanation: diskComfort
      ? `Free disk (${formatGb(profile.freeDiskSpaceGb)} GB) >= 2.5× download size (${formatGb(artifactSizeGb)} GB) leaving ${formatGb(remainingDisk)} GB free (preserving 1.5 GB safety buffer) (+5 pts).`
      : `Leaves ${formatGb(remainingDisk)} GB free (preserving 1.5 GB safety buffer), under 2.5× comfort threshold (0/5 pts).`,
  });

  const totalScore = Math.round(factors.reduce((acc, f) => acc + f.points, 0) * 10) / 10;
  return { totalScore, factors };
}

// ---------------------------------------------------------------------------
// "Why this model": 2-3 Grounded Score Factor Reasons (Phase 10D)
// ---------------------------------------------------------------------------

interface ReasonCandidate {
  text: string;
  differential: boolean;
  weight: number;
}

/**
 * Builds up to `max` user-friendly explanations for the top pick, grounded in
 * the exact recommendation score factors awarded by the engine.
 *
 * Reasons that differentiate the top pick from the other recommendations
 * are prioritized so the explanation shows why this model was chosen.
 */
export function getWhyReasons(
  top: Recommendation,
  alternatives: ReadonlyArray<Recommendation>,
  profile: HardwareProfile,
  max = 3
): string[] {
  const model = top.model;
  const alts = alternatives.map((a) => a.model);
  const altNames = (subset: ModelEntry[]) => joinNames(subset.map((m) => m.displayName));
  const verb = (subset: ModelEntry[]) => (subset.length === 1 ? "is" : "are");
  const candidates: ReasonCandidate[] = [];

  const topSize = getModelApproxSizeGb(model);
  const topHeadroom = getMemoryHeadroomGb(model, profile);
  const req = getMemoryRequirement(model);

  // Compute memory points
  const topMemPts =
    topHeadroom >= 0
      ? Math.round((10 + Math.min(20, (topHeadroom / 16) * 20)) * 10) / 10
      : Math.round(Math.max(0, 8 + topHeadroom * 2) * 10) / 10;

  // 1. Use-case Relevance (+40 pts)
  if (model.strengths.includes(profile.useCase)) {
    const notListed = alts.filter((m) => !m.strengths.includes(profile.useCase));
    if (notListed.length > 0) {
      candidates.push({
        text: `Use-case relevance (+40 pts): listed for ${profile.useCase} work. ${altNames(notListed)} ${verb(notListed)} not.`,
        differential: true,
        weight: 100,
      });
    } else {
      candidates.push({
        text: `Use-case relevance (+40 pts): matches your selected ${profile.useCase} use case.`,
        differential: false,
        weight: 35,
      });
    }
  }

  // 2. GPU & VRAM fit (+20 to +30 pts)
  if (model.gpuBenefit) {
    if (profile.gpuType === "apple-silicon" && profile.os === "macos") {
      const noGpuBenefit = alts.filter((m) => !m.gpuBenefit);
      candidates.push({
        text: "Apple Silicon acceleration (+30 pts): Metal-accelerated inference utilizing unified memory.",
        differential: noGpuBenefit.length > 0,
        weight: noGpuBenefit.length > 0 ? 95 : 40,
      });
    } else if (profile.gpuType === "nvidia" && profile.gpuVramGb !== null) {
      const fitsVram = (m: ModelEntry) => profile.gpuVramGb! >= getModelApproxSizeGb(m) + 0.8;
      if (fitsVram(model)) {
        const doesNotFit = alts.filter((m) => !fitsVram(m));
        candidates.push(
          doesNotFit.length > 0
            ? {
                text: `VRAM fit bonus (+25 pts): fits entirely in your ${formatGb(profile.gpuVramGb)} GB GPU VRAM. ${altNames(doesNotFit)} ${verb(doesNotFit)} too large for VRAM.`,
                differential: true,
                weight: 90,
              }
            : {
                text: `VRAM fit bonus (+25 pts): fits entirely in your ${formatGb(profile.gpuVramGb)} GB GPU VRAM with room for KV cache.`,
                differential: false,
                weight: 38,
              }
        );
      } else {
        candidates.push({
          text: "GPU acceleration (+20 pts): NVIDIA CUDA acceleration with CPU offloading.",
          differential: false,
          weight: 25,
        });
      }
    }
  }

  // 3. Memory Headroom (0–30 pts)
  if (alts.length > 0) {
    const bestAltHeadroom = Math.max(...alts.map((m) => getMemoryHeadroomGb(m, profile)));
    const closestAlt = alts.find((m) => getMemoryHeadroomGb(m, profile) === bestAltHeadroom) ?? alts[0];
    if (topHeadroom >= 0 && topHeadroom - bestAltHeadroom >= 1) {
      candidates.push({
        text: `Memory headroom (+${formatGb(topMemPts)} pts): ${formatGb(topHeadroom)} GB spare on your ${formatGb(
          profile.ramGb
        )} GB RAM (${req.label}), vs ${formatGb(Math.max(0, bestAltHeadroom))} GB for ${closestAlt.displayName}.`,
        differential: true,
        weight: 85,
      });
    }
  }
  if (topHeadroom >= 0) {
    candidates.push({
      text: `Memory headroom (+${formatGb(topMemPts)} pts): ${formatGb(topHeadroom)} GB spare on your ${formatGb(
        profile.ramGb
      )} GB RAM beyond the ${req.label} baseline.`,
      differential: false,
      weight: 30,
    });
  }

  // 4. Tool Calling Capability (+10 pts)
  if (model.capabilities.tools === true) {
    const noTools = alts.filter((m) => m.capabilities.tools !== true);
    if (noTools.length > 0) {
      candidates.push({
        text: `Tool-calling capability (+10 pts): verified native tools for the Tool-calling Agent starter. ${altNames(
          noTools
        )} ${noTools.length === 1 ? "does" : "do"} not offer it.`,
        differential: true,
        weight: 80,
      });
    } else {
      candidates.push({
        text: "Tool-calling capability (+10 pts): verified native tool calling supports the Tool-calling Agent starter.",
        differential: false,
        weight: 20,
      });
    }
  }

  // 5. Model Capacity Bonus (0–15 pts)
  if (profile.ramGb >= 16 && topHeadroom >= 2 && alts.length > 0) {
    const topParams = effectiveParams(model);
    const largestAlt = alts.map(effectiveParams).sort((a, b) => b.value - a.value)[0];
    const topCapPts = Math.round(Math.min(15, (topParams.value / 12) * 15) * 10) / 10;
    if (topParams.value > largestAlt.value && topCapPts > 0) {
      candidates.push({
        text: `Model capacity bonus (+${formatGb(topCapPts)} pts): largest active parameter count at ${topParams.label} (next is ${largestAlt.label}), supported by your >= 16 GB RAM.`,
        differential: true,
        weight: 70,
      });
    }
  }

  // 6. Free Disk Comfort Bonus (+5 pts)
  const comfortableDisk = (m: ModelEntry) =>
    profile.freeDiskSpaceGb >= getModelApproxSizeGb(m) * 2.5;
  if (comfortableDisk(model)) {
    const tighter = alts.filter((m) => !comfortableDisk(m));
    if (tighter.length > 0) {
      candidates.push({
        text: `Disk comfort bonus (+5 pts): download (${formatGb(topSize)} GB) leaves ${formatGb(
          profile.freeDiskSpaceGb - topSize
        )} GB free (> 2.5× model size, preserving 1.5 GB safety buffer). ${altNames(tighter)} ${verb(tighter)} below the 2.5× comfort threshold.`,
        differential: true,
        weight: 60,
      });
    } else {
      candidates.push({
        text: `Disk comfort bonus (+5 pts): download (${formatGb(topSize)} GB) leaves ${formatGb(
          profile.freeDiskSpaceGb - topSize
        )} GB free (> 2.5× model size, preserving 1.5 GB safety buffer).`,
        differential: false,
        weight: 18,
      });
    }
  }

  // Transparent disk space fallback (grounded in actual math, no generic filler)
  candidates.push({
    text: `Download is ${formatGb(topSize)} GB, leaving ${formatGb(
      Math.max(0, profile.freeDiskSpaceGb - topSize)
    )} GB free disk (preserving the recommended 1.5 GB safety buffer).`,
    differential: false,
    weight: 10,
  });

  return candidates
    .sort((a, b) => b.weight - a.weight)
    .slice(0, Math.max(2, Math.min(3, max)))
    .map((c) => c.text);
}

/**
 * Optional single trade-off line for the top pick (shown only when real).
 */
export function getTradeoff(
  top: Recommendation,
  alternatives: ReadonlyArray<Recommendation>
): string | null {
  const topSize = getModelApproxSizeGb(top.model);
  if (top.compatibilityLevel === "marginal") {
    return "Memory is tight on this machine. Expect slower responses if other apps are open.";
  }
  const lighter = alternatives
    .map((a) => ({ rec: a, size: getModelApproxSizeGb(a.model) }))
    .filter((a) => topSize - a.size >= 1 && topSize / a.size >= 1.25)
    .sort((a, b) => a.size - b.size)[0];
  if (lighter) {
    return `Larger download than ${lighter.rec.model.displayName}: ${formatGb(topSize)} GB versus ${formatGb(
      lighter.size
    )} GB.`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Alternatives: short differential notes relative to the top pick
// ---------------------------------------------------------------------------

export function getAlternativeNotes(
  alt: Recommendation,
  top: Recommendation,
  profile: HardwareProfile,
  max = 2
): string[] {
  const notes: string[] = [];
  const a = alt.model;
  const t = top.model;

  if (t.capabilities.tools === true && a.capabilities.tools !== true) {
    notes.push("No verified tool calling: Local Chat only.");
  } else if (a.capabilities.tools === true && t.capabilities.tools !== true) {
    notes.push("Supports the Tool-calling Agent starter (+10 pts tool bonus).");
  }

  if (t.strengths.includes(profile.useCase) && !a.strengths.includes(profile.useCase)) {
    notes.push(`General-purpose; not listed for ${profile.useCase} (no +40 use-case bonus).`);
  }

  const sizeDelta = getModelApproxSizeGb(t) - getModelApproxSizeGb(a);
  if (sizeDelta >= 0.5) {
    notes.push(`${formatGb(sizeDelta)} GB smaller download than the top pick.`);
  }

  const headroomDelta = getMemoryHeadroomGb(a, profile) - getMemoryHeadroomGb(t, profile);
  if (headroomDelta >= 1 && getMemoryHeadroomGb(a, profile) >= 0) {
    notes.push(`${formatGb(headroomDelta)} GB more memory to spare.`);
  }

  if (a.capabilities.vision === true && t.capabilities.vision !== true) {
    notes.push("Adds image input.");
  }

  if (alt.compatibilityLevel === "marginal") {
    notes.push("Tight fit on this hardware.");
  }

  return notes.slice(0, max);
}
