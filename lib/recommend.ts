/**
 * Deterministic recommendation engine.
 *
 * Design decisions:
 * - NO closed AI API calls — the logic is a transparent scoring function.
 * - We filter first (hard constraints), then score (soft preferences), then
 *   pick the top N. This two-phase approach keeps the logic easy to debug
 *   and explain to the user.
 * - Scoring weights are intentionally simple; we can tune them later with
 *   real user feedback.
 */

import { MODEL_CATALOG } from "./models";
import {
  CompatibilityLevel,
  HardwareProfile,
  ModelEntry,
  Recommendation,
} from "./types";

/** How many recommendations to return */
const MAX_RESULTS = 3;

// ---------------------------------------------------------------------------
// Phase 1: Hard filter — can this model even run on the hardware?
// ---------------------------------------------------------------------------

function meetsMinimumRequirements(
  model: ModelEntry,
  profile: HardwareProfile
): boolean {
  return profile.ramGb >= model.minRamGb;
}

// ---------------------------------------------------------------------------
// Phase 2: Scoring — how *well* does the model fit?
// ---------------------------------------------------------------------------

/**
 * Score breakdown (higher = better):
 *
 * +40  use-case match
 * +30  RAM headroom  (scales 0–30 based on how much spare RAM remains)
 * +20  GPU bonus     (if the model benefits from GPU and the user has one)
 * +10  OS bonus      (Apple Silicon gets a bump for supported models)
 *
 * The weights are intentionally round numbers so it's easy to reason about
 * why one model ranked above another.
 */
function scoreModel(model: ModelEntry, profile: HardwareProfile): number {
  let score = 0;

  // --- Use-case relevance (0 or 40) ---
  if (model.strengths.includes(profile.useCase)) {
    score += 40;
  }

  // --- RAM headroom (0–30) ---
  // More spare RAM → faster inference (less pressure on swap / KV cache)
  const headroom = profile.ramGb - model.ramRequired;
  // Normalise: 0 GB spare → 0 pts, ≥16 GB spare → full 30 pts
  score += Math.min(30, Math.max(0, (headroom / 16) * 30));

  // --- GPU bonus (0 or 20) ---
  if (model.gpuBenefit && profile.gpu !== "none") {
    score += 20;
  }

  // --- Apple Silicon bonus (0 or 10) ---
  // Ollama's Metal backend makes Apple Silicon especially good for LLMs
  if (profile.gpu === "apple-silicon" && profile.os === "macos") {
    score += 10;
  }

  return score;
}

// ---------------------------------------------------------------------------
// Phase 3: Classify compatibility level
// ---------------------------------------------------------------------------

function classifyCompatibility(
  model: ModelEntry,
  profile: HardwareProfile
): CompatibilityLevel {
  const headroom = profile.ramGb - model.ramRequired;

  // Generous headroom + GPU → excellent
  if (headroom >= 8 && profile.gpu !== "none") return "excellent";
  if (headroom >= 4) return "good";
  return "marginal";
}

// ---------------------------------------------------------------------------
// Phase 4: Generate human-readable explanation
// ---------------------------------------------------------------------------

function buildExplanation(
  model: ModelEntry,
  profile: HardwareProfile,
  compatibility: CompatibilityLevel
): string {
  const parts: string[] = [];

  // Use-case fit
  if (model.strengths.includes(profile.useCase)) {
    parts.push(`Strong fit for ${profile.useCase}`);
  } else {
    parts.push(`Not specialised for ${profile.useCase}, but capable`);
  }

  // Size context
  parts.push(`${model.sizeGb} GB download`);

  // RAM context
  const headroom = profile.ramGb - model.ramRequired;
  if (headroom >= 8) {
    parts.push("plenty of RAM headroom");
  } else if (headroom >= 4) {
    parts.push("comfortable RAM fit");
  } else {
    parts.push("tight RAM fit — close other apps before running");
  }

  // GPU context
  if (model.gpuBenefit && profile.gpu === "apple-silicon") {
    parts.push("accelerated on Apple Silicon via Metal");
  } else if (model.gpuBenefit && profile.gpu === "nvidia") {
    parts.push("CUDA acceleration available");
  } else if (!model.gpuBenefit) {
    parts.push("runs well on CPU alone");
  }

  return `${parts.join(". ")}.`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function recommendModels(
  profile: HardwareProfile
): Recommendation[] {
  // 1. Filter
  const eligible = MODEL_CATALOG.filter((m) =>
    meetsMinimumRequirements(m, profile)
  );

  // 2. Score & sort (descending)
  const scored = eligible
    .map((model) => ({ model, score: scoreModel(model, profile) }))
    .sort((a, b) => b.score - a.score);

  // 3. Take top N and build full recommendation objects
  return scored.slice(0, MAX_RESULTS).map(({ model }) => {
    const compatibility = classifyCompatibility(model, profile);
    return {
      model,
      compatibilityLevel: compatibility,
      explanation: buildExplanation(model, profile, compatibility),
    };
  });
}
