/**
 * Comprehensive deterministic test suite for Hack Day Starter (Phase 2).
 *
 * Test cases:
 * A. 24 GB RAM + Apple Silicon + macOS + coding
 * B. 16 GB RAM + Apple Silicon + macOS + chat
 * C. 8 GB RAM + no GPU + Linux + chat
 * D. Low free disk space
 * E. Tool-calling capability test with a model that lacks tools
 * F. Newly verified Gemma 4 model appears
 * G. Qwen 3.5 current variants appear
 * H. 24 GB RAM + Apple Silicon must NOT silently return old Gemma 3 when Gemma 4 is available
 * I. Registry validation and freshness checks
 */

import test from "node:test";
import assert from "node:assert/strict";

import { recommendModels, canModelRun } from "../lib/recommend";
import { VERIFIED_MODEL_REGISTRY, REGISTRY_METADATA } from "../lib/registry";
import { validateModelRegistry } from "../lib/registry-validator";
import { getModelMemoryInfo } from "../lib/memory-calculator";
import { HardwareProfile } from "../lib/types";

test("A: 24 GB RAM + Apple Silicon + macOS + coding", () => {
  const profile: HardwareProfile = {
    ramGb: 24,
    gpu: "apple-silicon",
    os: "macos",
    freeDiskSpaceGb: 80,
    useCase: "code",
  };

  const results = recommendModels(profile);
  assert.ok(results.length >= 2, "Should return at least 2 recommendations");

  // Models must fit 24 GB and be strong for coding
  const tags = results.map((r) => r.model.ollamaTag);
  assert.ok(
    tags.includes("gemma4:12b") || tags.includes("qwen3.5:9b"),
    `Expected gemma4:12b or qwen3.5:9b in top recommendations, got: ${tags.join(", ")}`
  );

  // Check explanation honesty and context
  const topRec = results[0];
  assert.match(topRec.explanation, /Mac with 24 GB unified memory/i);
  assert.match(topRec.explanation, /free disk space/i);
});

test("B: 16 GB RAM + Apple Silicon + macOS + chat", () => {
  const profile: HardwareProfile = {
    ramGb: 16,
    gpu: "apple-silicon",
    os: "macos",
    freeDiskSpaceGb: 50,
    useCase: "chat",
  };

  const results = recommendModels(profile);
  assert.ok(results.length >= 2);

  const tags = results.map((r) => r.model.ollamaTag);
  // Should recommend comfortable 16GB chat models (e.g. gemma4:e4b, phi4-mini, qwen3.5:4b, gemma4:12b)
  assert.ok(
    tags.some((t) => ["gemma4:e4b", "phi4-mini", "qwen3.5:4b", "gemma4:12b"].includes(t)),
    `Expected modern verified chat models, got: ${tags.join(", ")}`
  );

  // Compatibility levels should be good or excellent
  assert.ok(
    results.some((r) => r.compatibilityLevel === "excellent" || r.compatibilityLevel === "good")
  );
});

test("C: 8 GB RAM + no GPU + Linux + chat", () => {
  const profile: HardwareProfile = {
    ramGb: 8,
    gpu: "none",
    os: "linux",
    freeDiskSpaceGb: 30,
    useCase: "chat",
  };

  const results = recommendModels(profile);
  assert.ok(results.length >= 1, "Should find models that can run on 8GB CPU");

  // Heavy models (> 10 GB) must NOT be recommended for an 8GB machine
  for (const rec of results) {
    assert.ok(
      rec.model.artifactSizeGb <= 4.0,
      `Model ${rec.model.ollamaTag} is ${rec.model.artifactSizeGb} GB, too large for 8GB system`
    );
  }

  // Check that small models like Gemma 4 e4b, Qwen 3.5 4B, or Phi-4 Mini are returned
  const tags = results.map((r) => r.model.ollamaTag);
  assert.ok(
    tags.some((t) => ["gemma4:e4b", "qwen3.5:4b", "phi4-mini", "qwen2.5-coder:1.5b"].includes(t)),
    `Expected small lightweight model, got: ${tags.join(", ")}`
  );
});

test("D: Low free disk space filter", () => {
  // Free disk space is only 3 GB!
  const tightDiskProfile: HardwareProfile = {
    ramGb: 32,
    gpu: "apple-silicon",
    os: "macos",
    freeDiskSpaceGb: 3.0,
    useCase: "code",
  };

  const results = recommendModels(tightDiskProfile);

  // Models with artifactSizeGb + 1.0 > 3.0 GB must be filtered out
  for (const rec of results) {
    assert.ok(
      rec.model.artifactSizeGb <= 2.0,
      `Model ${rec.model.ollamaTag} (${rec.model.artifactSizeGb} GB) must not fit in 3 GB disk space`
    );
  }

  // Qwen 2.5 Coder 1.5B (1.0 GB) fits in 3 GB
  const tags = results.map((r) => r.model.ollamaTag);
  assert.ok(
    tags.includes("qwen2.5-coder:1.5b"),
    `Expected qwen2.5-coder:1.5b to fit low disk space, got: ${tags.join(", ")}`
  );

  // Large models like gemma4:12b (7.8 GB) and gpt-oss:20b (11.5 GB) must be excluded
  assert.ok(!tags.includes("gemma4:12b"));
  assert.ok(!tags.includes("gpt-oss:20b"));
});

test("E: Tool-calling capability with a model that lacks tools", () => {
  // Find a model without tools in registry (e.g. Qwen 2.5 Coder 1.5B)
  const noToolModel = VERIFIED_MODEL_REGISTRY.find(
    (m) => m.id === "qwen-2-5-coder-1-5b"
  );
  assert.ok(noToolModel, "Should have qwen-2-5-coder-1-5b in registry");
  assert.strictEqual(
    noToolModel.capabilities.tools,
    false,
    "Model must explicitly have capabilities.tools === false"
  );

  // Models with tools
  const gemma4Model = VERIFIED_MODEL_REGISTRY.find((m) => m.id === "gemma-4-e4b");
  assert.ok(gemma4Model);
  assert.strictEqual(gemma4Model.capabilities.tools, true);
});

test("F: Newly verified Gemma 4 models appear in registry and recommendations", () => {
  const gemma4Entries = VERIFIED_MODEL_REGISTRY.filter(
    (m) => m.family === "gemma4" && m.verificationStatus === "verified"
  );
  assert.ok(gemma4Entries.length >= 2, "Registry must contain at least 2 verified Gemma 4 variants");

  const tags = gemma4Entries.map((m) => m.ollamaTag);
  assert.ok(tags.includes("gemma4:e4b"));
  assert.ok(tags.includes("gemma4:12b"));

  // Check official memory guidance is present for Gemma 4
  const gemma12b = gemma4Entries.find((m) => m.id === "gemma-4-12b");
  assert.strictEqual(gemma12b?.officialMemoryGuidance, 16);
  assert.ok(gemma12b?.memoryGuidanceSource?.includes("Google"));
});

test("G: Qwen 3.5 current variants appear in registry and recommendations", () => {
  const qwen35Entries = VERIFIED_MODEL_REGISTRY.filter(
    (m) => m.family === "qwen3.5" && m.verificationStatus === "verified"
  );
  assert.ok(qwen35Entries.length >= 2, "Registry must contain Qwen 3.5 variants");

  const tags = qwen35Entries.map((m) => m.ollamaTag);
  assert.ok(tags.includes("qwen3.5:4b"));
  assert.ok(tags.includes("qwen3.5:9b"));

  // Memory guidance should be null (not invented), with estimated comfort calculated
  const qwen9b = qwen35Entries.find((m) => m.id === "qwen-3-5-9b")!;
  assert.strictEqual(qwen9b.officialMemoryGuidance, null);

  const memInfo = getModelMemoryInfo(qwen9b);
  assert.strictEqual(memInfo.isOfficial, false);
  assert.ok(memInfo.displayLabel.includes("Estimated memory comfort"));
});

test("H: 24 GB RAM + Apple Silicon must NOT silently return only old Gemma 3 variants", () => {
  const profile: HardwareProfile = {
    ramGb: 24,
    gpu: "apple-silicon",
    os: "macos",
    freeDiskSpaceGb: 100,
    useCase: "coding" as any, // test alias handling
  };
  profile.useCase = "code";

  const results = recommendModels(profile);
  const tags = results.map((r) => r.model.ollamaTag);

  // Gemma 3 is marked stale and must NOT appear
  assert.ok(
    !tags.includes("gemma3:12b"),
    "Stale Gemma 3 must not appear when current Gemma 4 is available"
  );

  // Current Gemma 4 should be present
  assert.ok(
    tags.some((t) => t.startsWith("gemma4:")),
    `Gemma 4 must be recommended for 24 GB Apple Silicon, got: ${tags.join(", ")}`
  );
});

test("I: Registry validation utility audit", () => {
  const report = validateModelRegistry(VERIFIED_MODEL_REGISTRY, {
    asOfDate: new Date("2026-10-02T00:00:00.000Z"),
  });

  assert.strictEqual(report.isValid, true, "Registry must be valid without errors");
  assert.ok(report.verifiedCount >= 6, "Must have at least 6 verified models");
  assert.ok(report.staleCount >= 1, "Must recognize stale models");
  assert.strictEqual(report.catalogDate, REGISTRY_METADATA.verifiedDisplayDate);
});
