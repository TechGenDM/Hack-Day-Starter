/**
 * Authoritative Deterministic Test Suite for Hack Day Starter (Phase 2 Rework).
 *
 * Validates registry data against source snapshots and tests policy execution:
 * A. Gemma 4 E4B metadata matches verified source snapshot
 * B. Gemma 4 12B metadata matches verified source snapshot
 * C. Qwen3.5 4B metadata matches verified source snapshot
 * D. Qwen3.5 9B metadata matches verified source snapshot
 * E. GPT-OSS 20B metadata matches verified source snapshot
 * F. Capability fields match source snapshot
 * G. Exact Ollama artifact sizes match source snapshot in bytes
 * H. Current model discovery finds newly added model families (including Qwen3.8)
 * I. Retired / unavailable models are never recommended
 * J. Stale metadata cannot be presented as "current"
 * K. 24 GB Apple Silicon recommends only models that pass current hardware policy
 * L. 8 GB CPU-only does not receive artificially inflated model-capacity bonuses
 * M. Tool-calling selection depends on verified capability data
 * N. Discrepancy detector flags discrepancies when curated registry disagrees with source observations
 */

import test from "node:test";
import assert from "node:assert/strict";

import { recommendModels, canModelRun, scoreModel } from "../lib/recommend";
import { getModelApproxSizeGb } from "../lib/memory-calculator";
import {
  VERIFIED_MODEL_REGISTRY,
  REGISTRY_METADATA,
  getEligibleLocalModels,
} from "../lib/registry";
import {
  REGRESSION_SOURCE_SNAPSHOT,
  detectSourceDiscrepancies,
  discoverCurrentModelFamilies,
} from "../lib/sources/ollama";
import { validateModelRegistry } from "../lib/registry-validator";
import { HardwareProfile, RawOllamaObservation } from "../lib/types";

// ---------------------------------------------------------------------------
// Tests A–E: Exact Metadata Matching Against Verified Source Snapshot
// ---------------------------------------------------------------------------

test("A: Gemma 4 E4B metadata matches verified source snapshot", () => {
  const model = VERIFIED_MODEL_REGISTRY.find((m) => m.ollamaTag === "gemma4:e4b");
  assert.ok(model, "gemma4:e4b must exist in registry");

  const expected = REGRESSION_SOURCE_SNAPSHOT["gemma4:e4b"];
  assert.strictEqual(model.sourceDisplaySize, expected.sourceDisplaySize);
  assert.strictEqual(model.normalizedApproxSizeGb, expected.normalizedApproxSizeGb);
  assert.strictEqual(model.exactManifestSizeBytes, null);
  assert.strictEqual(model.displayDigest, expected.displayDigest);
  assert.strictEqual(model.fullManifestDigest, null);
  assert.strictEqual(model.quantization, "Q4_K_M");
  assert.strictEqual(model.contextTokens, expected.contextTokens);
  assert.strictEqual(model.parameterCount, "4B");
  assert.strictEqual(model.license, "Gemma Terms of Use");
  assert.strictEqual(model.ollamaUrl, "https://ollama.com/library/gemma4");
  assert.strictEqual(model.sourceUrl, "https://ai.google.dev/gemma/docs/gemma-4");
  assert.strictEqual(model.officialSystemMemoryGuidance?.valueGb, 8);
  assert.strictEqual(model.officialInferenceMemory?.valueGb, 4.8);
});

test("B: Gemma 4 12B metadata matches verified source snapshot", () => {
  const model = VERIFIED_MODEL_REGISTRY.find((m) => m.ollamaTag === "gemma4:12b");
  assert.ok(model, "gemma4:12b must exist in registry");

  const expected = REGRESSION_SOURCE_SNAPSHOT["gemma4:12b"];
  assert.strictEqual(model.sourceDisplaySize, expected.sourceDisplaySize);
  assert.strictEqual(model.normalizedApproxSizeGb, expected.normalizedApproxSizeGb);
  assert.strictEqual(model.exactManifestSizeBytes, null);
  assert.strictEqual(model.displayDigest, expected.displayDigest);
  assert.strictEqual(model.fullManifestDigest, null);
  assert.strictEqual(model.quantization, "Q4_K_M");
  assert.strictEqual(model.contextTokens, 262144); // 256k verified from live Ollama
  assert.strictEqual(model.parameterCount, "12B");
  assert.strictEqual(model.officialSystemMemoryGuidance?.valueGb, 16);
  assert.strictEqual(model.officialInferenceMemory?.valueGb, 8.5);
});

test("C: Qwen 3.5 4B metadata matches verified source snapshot", () => {
  const model = VERIFIED_MODEL_REGISTRY.find((m) => m.ollamaTag === "qwen3.5:4b");
  assert.ok(model, "qwen3.5:4b must exist in registry");

  const expected = REGRESSION_SOURCE_SNAPSHOT["qwen3.5:4b"];
  assert.strictEqual(model.sourceDisplaySize, expected.sourceDisplaySize);
  assert.strictEqual(model.normalizedApproxSizeGb, expected.normalizedApproxSizeGb);
  assert.strictEqual(model.exactManifestSizeBytes, null);
  assert.strictEqual(model.displayDigest, expected.displayDigest);
  assert.strictEqual(model.fullManifestDigest, null);
  assert.strictEqual(model.quantization, "Q4_K_M");
  assert.strictEqual(model.contextTokens, 262144); // 256k verified from live Ollama
  assert.strictEqual(model.parameterCount, "4B");
  // Ensure unverified vendor RAM is null, not guessed
  assert.strictEqual(model.officialSystemMemoryGuidance, null);
  assert.strictEqual(model.officialInferenceMemory, null);
  assert.ok(model.estimatedSystemMemoryComfort !== null);
});

test("D: Qwen 3.5 9B metadata matches verified source snapshot", () => {
  const model = VERIFIED_MODEL_REGISTRY.find((m) => m.ollamaTag === "qwen3.5:9b");
  assert.ok(model, "qwen3.5:9b must exist in registry");

  const expected = REGRESSION_SOURCE_SNAPSHOT["qwen3.5:9b"];
  assert.strictEqual(model.sourceDisplaySize, expected.sourceDisplaySize);
  assert.strictEqual(model.normalizedApproxSizeGb, expected.normalizedApproxSizeGb);
  assert.strictEqual(model.exactManifestSizeBytes, null);
  assert.strictEqual(model.displayDigest, expected.displayDigest);
  assert.strictEqual(model.fullManifestDigest, null);
  assert.strictEqual(model.contextTokens, 262144); // 256k verified from live Ollama
  assert.strictEqual(model.officialSystemMemoryGuidance, null);
  assert.strictEqual(model.capabilities.tools, true);
  assert.strictEqual(model.capabilities.vision, true);
  assert.strictEqual(model.capabilities.thinking, true);
});

test("E: GPT-OSS 20B metadata matches verified source snapshot", () => {
  const model = VERIFIED_MODEL_REGISTRY.find((m) => m.ollamaTag === "gpt-oss:20b");
  assert.ok(model, "gpt-oss:20b must exist in registry");

  const expected = REGRESSION_SOURCE_SNAPSHOT["gpt-oss:20b"];
  assert.strictEqual(model.sourceDisplaySize, expected.sourceDisplaySize);
  assert.strictEqual(model.normalizedApproxSizeGb, expected.normalizedApproxSizeGb);
  assert.strictEqual(model.exactManifestSizeBytes, null);
  assert.strictEqual(model.displayDigest, expected.displayDigest);
  assert.strictEqual(model.fullManifestDigest, null);
  assert.strictEqual(model.parameterCount, "21B"); // 21B total parameters per OpenAI report
  assert.strictEqual(model.activeParameterCount, "3.6B"); // 3.6B active parameter validation
  assert.strictEqual(model.contextTokens, 131072); // 128k verified
  assert.strictEqual(model.capabilities.tools, true);
  assert.strictEqual(model.capabilities.thinking, true);
});

// ---------------------------------------------------------------------------
// Tests F & G: Capability Fields & Ollama Display Sizes
// ---------------------------------------------------------------------------

test("F: Capability fields match source snapshot", () => {
  for (const [tag, expected] of Object.entries(REGRESSION_SOURCE_SNAPSHOT)) {
    const model = VERIFIED_MODEL_REGISTRY.find((m) => m.ollamaTag === tag);
    if (!model) continue;
    const expectedVision = expected.inputs.includes("Image");
    assert.strictEqual(
      model.capabilities.vision,
      expectedVision,
      `Vision capability mismatch on ${tag}`
    );
  }
});

test("G: Ollama display sizes and short digests match source snapshot", () => {
  for (const [tag, expected] of Object.entries(REGRESSION_SOURCE_SNAPSHOT)) {
    const model = VERIFIED_MODEL_REGISTRY.find((m) => m.ollamaTag === tag);
    if (!model) continue;
    assert.strictEqual(
      model.sourceDisplaySize,
      expected.sourceDisplaySize,
      `Display size mismatch on ${tag}`
    );
    assert.strictEqual(
      model.normalizedApproxSizeGb,
      expected.normalizedApproxSizeGb,
      `Normalized approx size mismatch on ${tag}`
    );
    assert.strictEqual(
      model.displayDigest,
      expected.displayDigest,
      `Display digest mismatch on ${tag}`
    );
    assert.strictEqual(
      model.exactManifestSizeBytes,
      expected.exactManifestSizeBytes,
      `Manifest size mismatch on ${tag}`
    );
  }
});

// ---------------------------------------------------------------------------
// Tests H–J: Model Discovery, Lifecycle & Freshness Gating
// ---------------------------------------------------------------------------

test("H: Current model discovery finds newly added model families including Qwen 3.8", () => {
  const families = discoverCurrentModelFamilies();
  assert.ok(families.includes("gemma4"), "Must discover gemma4");
  assert.ok(families.includes("qwen3.5"), "Must discover qwen3.5");
  assert.ok(families.includes("qwen3.6"), "Must discover qwen3.6");
  assert.ok(families.includes("qwen3.8"), "Must discover qwen3.8 (August 2026 release)");
  assert.ok(families.includes("nemotron3"), "Must discover nemotron3");
  assert.ok(families.includes("gpt-oss"), "Must discover gpt-oss");
  assert.ok(families.includes("phi4"), "Must discover phi4");
});

test("I: Retired / unavailable models are never recommended", () => {
  const retiredModel = VERIFIED_MODEL_REGISTRY.find((m) => m.lifecycle === "retired");
  assert.ok(retiredModel, "Must have at least one retired model for testing (e.g. llama2:7b)");

  const profile: HardwareProfile = {
    ramGb: 64,
    freeDiskSpaceGb: 200,
    os: "linux",
    gpuType: "nvidia",
    gpuVramGb: 24,
    appleSiliconGeneration: null,
    useCase: "chat",
  };

  const gateResult = canModelRun(retiredModel, profile);
  assert.strictEqual(gateResult.eligible, false);
  assert.match(gateResult.reason ?? "", /retired/i);

  const results = recommendModels(profile);
  assert.ok(
    !results.some((r) => r.model.id === retiredModel.id),
    "Retired models must never be recommended"
  );
});

test("J: Stale metadata cannot be presented as 'current' or recommended", () => {
  const staleModel = VERIFIED_MODEL_REGISTRY.find(
    (m) => m.verificationStatus === "metadata-stale"
  );
  assert.ok(staleModel, "Must have a metadata-stale model for testing");

  const profile: HardwareProfile = {
    ramGb: 32,
    freeDiskSpaceGb: 100,
    os: "linux",
    gpuType: "none",
    gpuVramGb: null,
    appleSiliconGeneration: null,
    useCase: "general",
  };

  const gateResult = canModelRun(staleModel, profile);
  assert.strictEqual(gateResult.eligible, false);
  assert.match(gateResult.reason ?? "", /stale|unverified/i);

  const eligibleList = getEligibleLocalModels();
  assert.ok(
    !eligibleList.some((m) => m.id === staleModel.id),
    "Stale models must not be in eligible local models"
  );
});

// ---------------------------------------------------------------------------
// Tests K–M: Hardware Policy, Capacity Scaling & Tool Calling Selection
// ---------------------------------------------------------------------------

test("K: 24 GB Apple Silicon recommends only models that pass current hardware policy", () => {
  const profile: HardwareProfile = {
    ramGb: 24,
    freeDiskSpaceGb: 80,
    os: "macos",
    gpuType: "apple-silicon",
    gpuVramGb: null,
    appleSiliconGeneration: "m3",
    useCase: "code",
  };

  const results = recommendModels(profile);
  assert.ok(results.length >= 2);

  // Must recommend current models fitting 24 GB
  const tags = results.map((r) => r.model.ollamaTag);
  assert.ok(
    tags.includes("gemma4:12b") || tags.includes("qwen3.5:9b"),
    `Expected gemma4:12b or qwen3.5:9b, got: ${tags.join(", ")}`
  );

  // Must NOT include legacy Gemma 3 when current Gemma 4 is available
  assert.ok(!tags.includes("gemma3:12b"));
});

test("L: 8 GB CPU-only does not receive artificially inflated model-capacity bonuses", () => {
  const profile8Gb: HardwareProfile = {
    ramGb: 8,
    freeDiskSpaceGb: 40,
    os: "linux",
    gpuType: "none",
    gpuVramGb: null,
    appleSiliconGeneration: null,
    useCase: "chat",
  };

  const heavyModel = VERIFIED_MODEL_REGISTRY.find((m) => m.ollamaTag === "qwen3.6:35b");
  assert.ok(heavyModel);

  // Heavy model must not be eligible for 8GB
  const check = canModelRun(heavyModel, profile8Gb);
  assert.strictEqual(check.eligible, false);

  // Recommendations for 8 GB must be light models (<= 4 GB)
  const results = recommendModels(profile8Gb);
  for (const r of results) {
    const sizeGb = getModelApproxSizeGb(r.model);
    assert.ok(
      sizeGb <= 4.0,
      `Model ${r.model.ollamaTag} (${sizeGb.toFixed(1)} GB) is too large for 8GB machine`
    );
  }
});

test("M: Tool-calling selection depends on verified capability data", () => {
  // Test with verified model that has tools: false (DeepSeek R1 1.5B)
  const noToolModel = VERIFIED_MODEL_REGISTRY.find((m) => m.ollamaTag === "deepseek-r1:1.5b");
  assert.ok(noToolModel, "deepseek-r1:1.5b must exist");
  assert.strictEqual(
    noToolModel.capabilities.tools,
    false,
    "DeepSeek R1 in Ollama does not have tool calling"
  );

  // Required capabilities filtering test:
  const profileRequiringTools: HardwareProfile = {
    ramGb: 16,
    freeDiskSpaceGb: 50,
    os: "macos",
    gpuType: "apple-silicon",
    gpuVramGb: null,
    appleSiliconGeneration: "m2",
    useCase: "code",
    requiredCapabilities: { tools: true },
  };

  const toolCheck = canModelRun(noToolModel, profileRequiringTools);
  assert.strictEqual(toolCheck.eligible, false);
  assert.match(toolCheck.reason ?? "", /lacks required capability: tools/i);

  // Models with tools pass
  const gemmaModel = VERIFIED_MODEL_REGISTRY.find((m) => m.ollamaTag === "gemma4:e4b");
  assert.ok(gemmaModel);
  assert.strictEqual(gemmaModel.capabilities.tools, true);
  assert.strictEqual(canModelRun(gemmaModel, profileRequiringTools).eligible, true);
});

// ---------------------------------------------------------------------------
// Test N: Discrepancy Detection (Fails when curated registry disagrees with observations)
// ---------------------------------------------------------------------------

test("N: Discrepancy detector flags discrepancies when curated registry disagrees with observations", () => {
  // 1. All curated models in regression fixture must have 0 discrepancies
  for (const model of VERIFIED_MODEL_REGISTRY) {
    const fixture = REGRESSION_SOURCE_SNAPSHOT[model.ollamaTag];
    if (fixture) {
      const diffs = detectSourceDiscrepancies(model, fixture);
      assert.strictEqual(
        diffs.length,
        0,
        `Expected 0 discrepancies for ${model.ollamaTag}, found: ${diffs.join("; ")}`
      );
    }
  }

  // 2. Simulated discrepancy: altered context window
  const gemmaModel = VERIFIED_MODEL_REGISTRY.find((m) => m.ollamaTag === "gemma4:12b")!;
  const badContextObs: RawOllamaObservation = {
    ollamaTag: "gemma4:12b",
    displayDigest: "312246b09fab",
    fullManifestDigest: null,
    sourceDisplaySize: "7.7GB",
    normalizedApproxSizeGb: 7.7,
    exactManifestSizeBytes: null,
    displayContext: "128K",
    contextTokens: 131072, // Discrepancy: 128k vs curated 256k
    inputs: ["Text", "Image"],
    capabilityBadges: ["Text", "Image"],
    observedAt: new Date().toISOString(),
    sourceUrl: "https://ollama.com/library/gemma4/tags",
    sourceType: "regression-fixture",
  };
  const contextDiffs = detectSourceDiscrepancies(gemmaModel, badContextObs);
  assert.ok(contextDiffs.length > 0, "Must detect context window discrepancy");
  assert.match(contextDiffs[0], /context window discrepancy/i);

  // 3. Simulated discrepancy: altered artifact size
  const badSizeObs: RawOllamaObservation = {
    ...badContextObs,
    contextTokens: 262144,
    sourceDisplaySize: "2.8GB",
    normalizedApproxSizeGb: 2.8, // Discrepancy: 2.8 GB vs curated 7.7 GB
  };
  const sizeDiffs = detectSourceDiscrepancies(gemmaModel, badSizeObs);
  assert.ok(sizeDiffs.length > 0, "Must detect artifact size discrepancy");
  assert.match(sizeDiffs[0], /listed size discrepancy/i);

  // 4. Simulated discrepancy: altered digest
  const badDigestObs: RawOllamaObservation = {
    ...badContextObs,
    contextTokens: 262144,
    displayDigest: "ffffffffffff", // Discrepancy
  };
  const digestDiffs = detectSourceDiscrepancies(gemmaModel, badDigestObs);
  assert.ok(digestDiffs.length > 0, "Must detect digest discrepancy");
  assert.match(digestDiffs[0], /display digest discrepancy/i);
});
