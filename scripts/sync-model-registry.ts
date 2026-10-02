/**
 * Model Registry Synchronization & Audit Script.
 *
 * Runs the model-registry sync/verification process:
 * 1. Discovers current model families from the official Ollama library.
 * 2. Compares active registry models against primary source snapshots.
 * 3. Audits all source URLs and memory citations.
 * 4. Outputs a validation report detailing verified entries and unverified fields.
 *
 * Usage:
 *   npx tsx scripts/sync-model-registry.ts
 */

import { VERIFIED_MODEL_REGISTRY, REGISTRY_METADATA } from "../lib/registry";
import { discoverCurrentModelFamilies } from "../lib/sources/ollama";
import { validateModelRegistry } from "../lib/registry-validator";
import { formatBytesToGb } from "../lib/memory-calculator";

function runSync(): void {
  console.log("=================================================================");
  console.log("🚀 HACK DAY STARTER — MODEL REGISTRY SYNC & AUDIT");
  console.log(`📅 Timestamp: ${new Date().toISOString()} (As of: October 2, 2026)`);
  console.log("=================================================================\n");

  // 1. Discover Current Families
  const currentFamilies = discoverCurrentModelFamilies();
  console.log(`🔍 Discovered ${currentFamilies.length} Current Model Families from Ollama:`);
  console.log(`   [${currentFamilies.join(", ")}]\n`);

  // 2. Validate Registry
  const report = validateModelRegistry(VERIFIED_MODEL_REGISTRY);

  console.log("📊 Registry Audit Summary:");
  console.log(`   • Total Records: ${report.totalModels}`);
  console.log(`   • Current Models: ${report.currentCount}`);
  console.log(`   • Legacy Models: ${report.legacyCount}`);
  console.log(`   • Retired Models: ${report.retiredCount}`);
  console.log(`   • Verified Records: ${report.verifiedCount}`);
  console.log(`   • Stale Metadata Records: ${report.staleCount}`);
  console.log(`   • Integrity Status: ${report.isValid ? "✅ VALID" : "❌ INVALID"}\n`);

  // 3. Display Detailed Model Verification Table
  console.log("📋 Verified Model Catalog (Primary: Ollama Library | Secondary: Provider):");
  console.log("-----------------------------------------------------------------");
  for (const model of VERIFIED_MODEL_REGISTRY) {
    const sizeStr = formatBytesToGb(model.artifactSizeBytes);
    const caps = [
      model.capabilities.tools ? "Tools" : null,
      model.capabilities.vision ? "Vision" : null,
      model.capabilities.thinking ? "Thinking" : null,
    ]
      .filter(Boolean)
      .join(", ") || "None";

    const officialSys = model.officialSystemMemoryGuidance
      ? `${model.officialSystemMemoryGuidance.valueGb} GB (Official)`
      : "None (Estimated)";

    console.log(`• [${model.ollamaTag}] — ${model.displayName} (${model.provider})`);
    console.log(`  Size: ${sizeStr} (${model.artifactSizeBytes} bytes) | Quant: ${model.quantization} | Context: ${model.contextTokens} tokens`);
    console.log(`  Capabilities: [${caps}] | Lifecycle: ${model.lifecycle} | Status: ${model.verificationStatus}`);
    console.log(`  Memory Guidance: ${officialSys}`);
    console.log(`  Primary Source:   ${model.ollamaUrl}`);
    console.log(`  Secondary Source: ${model.sourceUrl}`);
    console.log("");
  }

  // 4. Report Unverified Fields Transparently
  console.log("-----------------------------------------------------------------");
  console.log(`⚠️ Unverified / Omitted Fields Audit (${report.unverifiedFields.length} fields):`);
  console.log("   (Fields where vendor has NOT published official specs; marked null in registry)");
  for (const item of report.unverifiedFields) {
    console.log(`   • [${item.ollamaTag}] ${item.field}: ${item.reason}`);
  }
  console.log("\n=================================================================");
  console.log("✅ Model Registry Sync & Validation Complete.");
  console.log("=================================================================\n");
}

runSync();
