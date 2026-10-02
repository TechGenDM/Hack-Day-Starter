/**
 * Model Registry Live Synchronization & Audit Script.
 *
 * Architecture:
 *   LIVE ECOSYSTEM DISCOVERY
 *             ↓
 *   PRACTICAL CANDIDATE SELECTION
 *             ↓
 *   SOURCE VERIFICATION
 *             ↓
 *   RECOMMENDATION
 *
 * Note: The candidate models represent a curated practical set evaluated for
 * local laptop execution, not the entire unbounded Ollama library catalog.
 *
 * Usage:
 *   npm run sync-registry
 */

import { VERIFIED_MODEL_REGISTRY, REGISTRY_METADATA } from "../lib/registry";
import {
  fetchLiveOllamaTagObservation,
  REGRESSION_SOURCE_SNAPSHOT,
  detectSourceDiscrepancies,
  discoverCurrentModelFamilies,
} from "../lib/sources/ollama";
import { validateModelRegistry } from "../lib/registry-validator";
import { formatModelDisplaySize } from "../lib/memory-calculator";
import { RawOllamaObservation } from "../lib/types";

async function runSync(): Promise<void> {
  console.log("=================================================================");
  console.log("🚀 HACK DAY STARTER — MODEL REGISTRY SYNC & AUDIT");
  console.log("   LIVE ECOSYSTEM DISCOVERY → PRACTICAL CANDIDATE SELECTION");
  console.log("   → SOURCE VERIFICATION → RECOMMENDATION");
  console.log(`📅 Timestamp: ${new Date().toISOString()} (As of: October 2, 2026)`);
  console.log("=================================================================\n");

  // 1. Discover Current Families in Practical Candidate Set
  const currentFamilies = discoverCurrentModelFamilies();
  console.log(`🔍 Current Model Families in Practical Candidate Scope (${currentFamilies.length}):`);
  console.log(`   [${currentFamilies.join(", ")}]\n`);

  // 2. Query Live Ollama Library or Fall Back to Regression Fixture
  console.log("📡 Querying Live Official Ollama Library (https://ollama.com/library)...");

  const observations: Record<string, RawOllamaObservation> = {};
  let liveCount = 0;
  let fixtureCount = 0;

  for (const model of VERIFIED_MODEL_REGISTRY) {
    const parts = model.ollamaTag.split(":");
    const modelName = parts[0];
    const tagName = parts[1] || "latest";

    // Attempt live fetch from official Ollama web library
    const liveObs = await fetchLiveOllamaTagObservation(modelName, tagName, 5000);
    if (liveObs) {
      observations[model.ollamaTag] = liveObs;
      liveCount++;
    } else {
      // Fallback to regression fixture for offline or tests
      const fixture = REGRESSION_SOURCE_SNAPSHOT[model.ollamaTag];
      if (fixture) {
        observations[model.ollamaTag] = fixture;
        fixtureCount++;
      }
    }
  }

  const observationSource =
    liveCount > 0 && fixtureCount === 0
      ? "observed from live source"
      : liveCount > 0
      ? "hybrid (partially live source, partially fixture)"
      : "verified against source snapshot";

  console.log(`   • Live Observations Fetched: ${liveCount}`);
  console.log(`   • Regression Fixtures Used: ${fixtureCount}`);
  console.log(`   • Observation Mode: "${observationSource}"\n`);

  // 3. Print Raw Observations
  console.log("-----------------------------------------------------------------");
  console.log("📡 RAW SOURCE OBSERVATIONS (Primary: Ollama Library Pages):");
  console.log("-----------------------------------------------------------------");
  for (const [tag, obs] of Object.entries(observations)) {
    const sizeDisplay =
      obs.exactManifestSizeBytes !== null
        ? `Manifest size: ${(obs.exactManifestSizeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
        : `Ollama listed: ${obs.sourceDisplaySize}`;

    console.log(
      `• [${tag}] Size: ${sizeDisplay} | Context: ${obs.displayContext} (${obs.contextTokens.toLocaleString()} tokens) | Digest: ${obs.displayDigest || "none"} | Modalities: [${obs.inputs.join(", ")}] | Type: ${obs.sourceType}`
    );
  }
  console.log("");

  // 4. Detect Source Discrepancies
  console.log("-----------------------------------------------------------------");
  console.log("⚖️ DISCREPANCY AUDIT (Curated Registry vs Source Observations):");
  console.log("-----------------------------------------------------------------");

  const discrepanciesMap: Record<string, string[]> = {};
  let totalDiscrepancies = 0;

  for (const model of VERIFIED_MODEL_REGISTRY) {
    const obs = observations[model.ollamaTag];
    if (!obs) continue;

    const discrepancies = detectSourceDiscrepancies(model, obs);
    if (discrepancies.length > 0) {
      discrepanciesMap[model.ollamaTag] = discrepancies;
      totalDiscrepancies += discrepancies.length;
      model.verificationStatus = "source-discrepancy";
    }
  }

  if (totalDiscrepancies === 0) {
    console.log("✅ Zero discrepancies detected between curated registry and source observations!\n");
  } else {
    console.log(`⚠️ ${totalDiscrepancies} Discrepancies Found:`);
    for (const [tag, diffs] of Object.entries(discrepanciesMap)) {
      console.log(`   • [${tag}]:`);
      diffs.forEach((d) => console.log(`       - ${d}`));
    }
    console.log("");
  }

  // 5. Run Registry Integrity Validation
  const report = validateModelRegistry(VERIFIED_MODEL_REGISTRY);

  console.log("-----------------------------------------------------------------");
  console.log("📋 CURATED VERIFIED RECORDS:");
  console.log("-----------------------------------------------------------------");
  for (const model of VERIFIED_MODEL_REGISTRY) {
    const sizeDisplay = formatModelDisplaySize(model);
    const caps = [
      model.capabilities.tools === true ? "Tools" : null,
      model.capabilities.vision === true ? "Vision" : null,
      model.capabilities.thinking === true ? "Thinking" : null,
    ]
      .filter(Boolean)
      .join(", ") || "None";

    const officialSys = model.officialSystemMemoryGuidance
      ? `${model.officialSystemMemoryGuidance.valueGb} GB (Official)`
      : "None (Estimated comfort used)";

    console.log(`• [${model.ollamaTag}] — ${model.displayName} (${model.provider})`);
    console.log(`  Size: ${sizeDisplay} | Context: ${(model.contextTokens / 1024).toFixed(0)}k (${model.contextTokens.toLocaleString()}) | Digest: ${model.displayDigest || "none"}`);
    console.log(`  Capabilities: [${caps}] | Lifecycle: ${model.lifecycle} | Verification: ${model.verificationStatus}`);
    console.log(`  Memory Guidance: ${officialSys}`);
    console.log(`  Primary Source:   ${model.ollamaUrl}`);
    console.log(`  Secondary Source: ${model.sourceUrl}`);
    console.log("");
  }

  // 6. Report Unverified Fields Transparently
  console.log("-----------------------------------------------------------------");
  console.log(`⚠️ UNVERIFIED / OMITTED FIELDS AUDIT (${report.unverifiedFields.length} fields):`);
  console.log("   (Fields where vendor has NOT published official specs; marked null in registry)");
  for (const item of report.unverifiedFields) {
    console.log(`   • [${item.ollamaTag}] ${item.field}: ${item.reason}`);
  }

  console.log("\n=================================================================");
  console.log(`✅ Model Registry Sync & Validation Complete (Status: ${report.isValid ? "VALID" : "INVALID"}).`);
  console.log("=================================================================\n");
}

runSync().catch(console.error);
