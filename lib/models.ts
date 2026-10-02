/**
 * Model Catalog Adapter.
 *
 * For Phase 2, this module points to the Verified Model Registry in `lib/registry.ts`.
 * Kept for backwards compatibility with any Phase 1 consumers.
 */

import { VERIFIED_MODEL_REGISTRY } from "./registry";
import { ModelEntry } from "./types";

export const MODEL_CATALOG: ModelEntry[] = VERIFIED_MODEL_REGISTRY;
export { VERIFIED_MODEL_REGISTRY, REGISTRY_METADATA } from "./registry";
