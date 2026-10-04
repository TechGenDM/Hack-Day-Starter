"use client";

import { useRef, useState } from "react";
import { getAgentAvailability, getFitLabel } from "@/lib/recommendation-insights";
import { HardwareForm } from "./HardwareForm";
import {
  RecommendationEmptyState,
  RecommendationError,
  RecommendationResults,
} from "./RecommendationResults";
import { StarterWorkbench } from "./StarterWorkbench";
import { SpinnerIcon } from "./ui/Icons";
import type {
  HardwareProfile,
  Recommendation,
  ModelEntry,
} from "@/lib/types";

export function HardwareWorkbench() {
  // Results & Selection State
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelEntry | null>(null);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  // Last submitted hardware profile: used for fit/why explanations and the retry action.
  const [profile, setProfile] = useState<HardwareProfile | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  async function handleHardwareSubmit(submittedProfile: HardwareProfile) {
    setProfile(submittedProfile);
    setLoading(true);
    setError(null);
    setResults(null);
    setSelectedModel(null);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submittedProfile),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to fetch recommendations");
      }

      const data = await res.json();
      setResults(data.recommendations);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load recommendations. Check that the server is running."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleRetry() {
    if (profile) void handleHardwareSubmit(profile);
  }

  /** Brings the hardware form back into view and moves keyboard focus into it. */
  function handleEditProfile() {
    const form = formRef.current;
    if (!form) return;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    form
      .querySelector<HTMLElement>("select, input, button")
      ?.focus({ preventScroll: true });
  }

  function handleCopy(tag: string) {
    navigator.clipboard.writeText(`ollama pull ${tag}`);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2000);
  }

  function handleSelectModel(model: ModelEntry) {
    setSelectedModel(model);
    setTimeout(() => {
      document
        .getElementById("selected-model-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  // Screen-reader summary for the persistent live region (errors use role="alert" instead).
  const announcement = loading
    ? "Finding verified models for your hardware."
    : results && results.length > 0
    ? `${results.length} ${
        results.length === 1 ? "recommendation" : "recommendations"
      } ready. Top pick: ${results[0].model.displayName}, fit ${getFitLabel(
        results[0].compatibilityLevel
      )}.`
    : results && results.length === 0
    ? "No verified models fit this hardware."
    : "";

  // Agent availability for the selected model, derived from its capability data.
  const selectedAgent = selectedModel
    ? getAgentAvailability(
        selectedModel,
        (results ?? [])
          .map((r, i) => ({ rank: i + 1, model: r.model }))
          .filter((r) => r.model.id !== selectedModel.id)
      )
    : null;

  return (
    <div className="w-full">
      {/* ---------------------------------------------------------------- */}
      {/* Hardware Input Form (Phase 10B) */}
      {/* ---------------------------------------------------------------- */}
      <div ref={formRef}>
        <HardwareForm onSubmit={handleHardwareSubmit} loading={loading} />
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Persistent live region (Phase 10C): announces result updates     */}
      {/* without re-reading the whole results list.                       */}
      {/* ---------------------------------------------------------------- */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Error State */}
      {error && (
        <RecommendationError
          message={error}
          canRetry={profile !== null}
          onRetry={handleRetry}
          onEditProfile={handleEditProfile}
        />
      )}

      {/* Loading placeholder */}
      {loading && (
        <div
          aria-busy="true"
          className="mt-10 sm:mt-12 flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/40 p-5 text-sm text-neutral-400"
        >
          <SpinnerIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Matching your hardware against the verified catalog…</span>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Recommendation Results: Top Pick + Alternatives (Phase 10C)      */}
      {/* ---------------------------------------------------------------- */}
      {results && results.length > 0 && profile && (
        <RecommendationResults
          results={results}
          profile={profile}
          selectedModelId={selectedModel?.id ?? null}
          copiedTag={copiedTag}
          onSelect={handleSelectModel}
          onCopy={handleCopy}
        />
      )}

      {/* Empty State */}
      {results && results.length === 0 && (
        <RecommendationEmptyState profile={profile} onEditProfile={handleEditProfile} />
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Starter Workbench (Phase 10E)                                    */}
      {/* ---------------------------------------------------------------- */}
      {selectedModel && (
        <StarterWorkbench
          selectedModel={selectedModel}
          selectedAgent={selectedAgent}
          explanation={
            results?.find((r) => r.model.id === selectedModel.id)?.explanation
          }
        />
      )}
    </div>
  );
}
