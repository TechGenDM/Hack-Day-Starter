import type { ReactNode } from "react";
import { getModelMemoryReport } from "@/lib/memory-calculator";
import {
  describeProfile,
  formatContext,
  formatGb,
  getAgentAvailability,
  getAlternativeNotes,
  getCapabilityList,
  getFitSummary,
  getMemoryRequirement,
  getScoreBreakdown,
  getTradeoff,
  getVerificationSummary,
  getWhyReasons,
  type FitTone,
} from "@/lib/recommendation-insights";
import type { HardwareProfile, ModelEntry, Recommendation } from "@/lib/types";
import { Callout } from "./ui/Callout";
import {
  AlertTriangleIcon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  ExternalLinkIcon,
  InfoIcon,
} from "./ui/Icons";

/**
 * Phase 10C - Recommendation results.
 *
 * Purely presentational. Receives the already-ranked recommendations (order is
 * decided server-side by lib/recommend.ts and is never changed here) and renders
 * one dominant Top Pick plus compact alternatives.
 */

// ---------------------------------------------------------------------------
// Shared style tokens
// ---------------------------------------------------------------------------

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400";

const BTN_PRIMARY = `inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 active:bg-emerald-700 cursor-pointer ${FOCUS}`;
const BTN_PRIMARY_SELECTED = `inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-md border border-emerald-700 bg-emerald-950 px-5 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-900 cursor-pointer ${FOCUS}`;
const BTN_SECONDARY = `inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-md border border-neutral-700 px-4 text-sm font-medium text-neutral-200 transition-colors hover:bg-neutral-800 cursor-pointer ${FOCUS}`;
const LINK = `inline-flex items-center gap-1 rounded text-neutral-300 underline decoration-neutral-600 underline-offset-2 transition-colors hover:text-neutral-100 ${FOCUS}`;

const FIT_TEXT: Record<FitTone, string> = {
  comfortable: "text-emerald-400",
  fits: "text-sky-300",
  tight: "text-amber-300",
};

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function Spec({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-neutral-500">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-medium text-neutral-100">{children}</dd>
    </div>
  );
}

function CopyCommand({
  tag,
  copied,
  onCopy,
}: {
  tag: string;
  copied: boolean;
  onCopy: (tag: string) => void;
}) {
  return (
    <div className="flex min-w-0 items-stretch overflow-hidden rounded-md border border-neutral-800 bg-neutral-950">
      <code className="min-w-0 flex-1 break-all px-3 py-2.5 font-mono text-xs text-neutral-300">
        ollama pull {tag}
      </code>
      <button
        type="button"
        onClick={() => onCopy(tag)}
        aria-label={`Copy command: ollama pull ${tag}`}
        className={`inline-flex shrink-0 items-center gap-1.5 border-l border-neutral-800 px-3 text-xs text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-neutral-100 cursor-pointer ${FOCUS}`}
      >
        {copied ? (
          <CheckIcon className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
        ) : (
          <CopyIcon className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={LINK}>
      {children}
      <ExternalLinkIcon className="h-3 w-3" aria-hidden="true" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/** Collapsed-by-default detail block: keeps every fact reachable without a metadata wall. */
function ModelDetails({
  rec,
  profile,
  label,
}: {
  rec: Recommendation;
  profile?: HardwareProfile;
  label: string;
}) {
  const model = rec.model;
  const mem = getModelMemoryReport(model);
  const scoreReport = profile ? getScoreBreakdown(model, profile) : null;

  return (
    <details className="group mt-4 border-t border-neutral-800 pt-3">
      <summary
        className={`inline-flex cursor-pointer list-none items-center gap-1.5 rounded text-sm text-neutral-400 transition-colors hover:text-neutral-200 [&::-webkit-details-marker]:hidden ${FOCUS}`}
      >
        <ChevronDownIcon
          className="h-4 w-4 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
        {label}
      </summary>

      <div className="mt-3 space-y-4 text-sm text-neutral-300">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          <Spec label="Quantization">{model.quantization}</Spec>
          <Spec label="License">{model.license}</Spec>
          <Spec label="Parameters">
            {model.parameterCount}
            {model.activeParameterCount ? ` (${model.activeParameterCount} active)` : ""}
          </Spec>
          <Spec label="Ollama listed size">
            {model.sourceDisplaySize}
            {model.exactManifestSizeBytes !== null
              ? ` (${model.exactManifestSizeBytes.toLocaleString()} bytes)`
              : ""}
          </Spec>
          <Spec label="Context window">
            {formatContext(model.contextTokens)} tokens ({model.contextTokens.toLocaleString()})
          </Spec>
          <Spec label="Source verified">
            {new Date(model.verifiedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </Spec>
        </dl>

        <div className="space-y-1 text-xs leading-relaxed text-neutral-400">
          {mem.hasOfficialSystemGuidance ? (
            <p>
              <span className="font-medium text-neutral-300">Memory:</span> the model provider
              publishes {mem.officialSystemGuidanceGb} GB of unified/system RAM as guidance.
            </p>
          ) : (
            <p>
              <span className="font-medium text-neutral-300">Memory:</span> ~
              {mem.estimatedComfortGb} GB is a Hack Day Starter estimate, not a vendor
              requirement. {mem.estimatedMethodology}
            </p>
          )}
          {mem.hasOfficialInferenceSpec && (
            <p>
              <span className="font-medium text-neutral-300">Vendor inference spec:</span>{" "}
              {mem.officialInferenceGb} GB at {mem.officialInferencePrecision} on{" "}
              {mem.officialInferenceHardware}.
            </p>
          )}
        </div>

        <p className="text-xs leading-relaxed text-neutral-400">
          <span className="font-medium text-neutral-300">Recommendation note:</span>{" "}
          {rec.explanation}
        </p>

        {/* Recommendation Score Breakdown (Phase 10D Transparency) */}
        {scoreReport && (
          <div className="space-y-2 border-t border-neutral-800 pt-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Score Factor Breakdown
              </h5>
              <span className="text-xs font-mono font-semibold text-emerald-400">
                Total Score: {scoreReport.totalScore} pts
              </span>
            </div>
            <div className="divide-y divide-neutral-800/60 rounded border border-neutral-800 bg-neutral-950/60 text-xs">
              {scoreReport.factors.map((f) => (
                <div key={f.id} className="flex items-start justify-between gap-3 p-2.5">
                  <div className="min-w-0">
                    <span className="font-medium text-neutral-200">{f.title}: </span>
                    <span className="text-neutral-400">{f.explanation}</span>
                  </div>
                  <span
                    className={`shrink-0 font-mono font-medium ${
                      f.points > 0 ? "text-emerald-400" : "text-neutral-500"
                    }`}
                  >
                    {f.points > 0 ? `+${f.points}` : "0"} / {f.maxPoints} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
          <ExternalLink href={model.ollamaUrl}>Ollama library page</ExternalLink>
          <ExternalLink href={model.sourceUrl}>Model card</ExternalLink>
        </div>
      </div>
    </details>
  );
}

// ---------------------------------------------------------------------------
// Top Pick
// ---------------------------------------------------------------------------

interface TopPickProps {
  rec: Recommendation;
  alternatives: Recommendation[];
  profile: HardwareProfile;
  isSelected: boolean;
  copiedTag: string | null;
  onSelect: (model: ModelEntry) => void;
  onCopy: (tag: string) => void;
}

function TopPick({ rec, alternatives, profile, isSelected, copiedTag, onSelect, onCopy }: TopPickProps) {
  const model = rec.model;
  const fit = getFitSummary(rec, profile);
  const verification = getVerificationSummary(model);
  const memory = getMemoryRequirement(model);
  const reasons = getWhyReasons(rec, alternatives, profile);
  const tradeoff = getTradeoff(rec, alternatives);
  const capabilities = getCapabilityList(model);
  const agent = getAgentAvailability(
    model,
    alternatives.map((a, i) => ({ rank: i + 2, model: a.model }))
  );

  return (
    <article
      aria-labelledby="top-pick-heading"
      className={`rounded-lg border p-5 sm:p-7 ${
        isSelected ? "border-emerald-600/70 bg-neutral-900" : "border-neutral-600 bg-neutral-900"
      }`}
    >
      {/* Identity + fit */}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Top pick
          </p>
          <h3
            id="top-pick-heading"
            className="mt-1 break-words text-2xl font-semibold tracking-tight text-neutral-50 sm:text-3xl"
          >
            {model.displayName}
          </h3>
          <p className="mt-1 text-sm text-neutral-400">
            {model.provider} · {model.parameterCount}
            {model.activeParameterCount ? ` (${model.activeParameterCount} active)` : ""} ·{" "}
            {model.quantization}
          </p>
        </div>

        <div className="shrink-0">
          <p className="text-xs text-neutral-500">Fit</p>
          <p
            className={`mt-0.5 inline-flex items-center gap-1.5 text-lg font-semibold ${FIT_TEXT[fit.tone]}`}
          >
            {fit.tone === "tight" && <AlertTriangleIcon className="h-4 w-4" aria-hidden="true" />}
            {fit.label}
          </p>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-neutral-300">{model.description}</p>
      <p className="mt-1 text-sm leading-relaxed text-neutral-400">{fit.detail}</p>

      {/* Why this model */}
      <div className="mt-6 border-t border-neutral-800 pt-5">
        <h4 className="text-sm font-semibold text-neutral-100">Why this model</h4>
        <ul className="mt-3 space-y-2.5">
          {reasons.map((reason) => (
            <li key={reason} className="flex items-start gap-2.5 text-sm leading-relaxed text-neutral-300">
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
              <span className="min-w-0">{reason}</span>
            </li>
          ))}
        </ul>
        {tradeoff && (
          <p className="mt-3 flex items-start gap-2.5 text-sm leading-relaxed text-neutral-400">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" aria-hidden="true" />
            <span className="min-w-0">
              <span className="font-medium text-neutral-300">Trade-off:</span> {tradeoff}
            </span>
          </p>
        )}
      </div>

      {/* Key facts */}
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-neutral-800 pt-5 sm:grid-cols-3">
        <Spec label={model.exactManifestSizeBytes !== null ? "Download" : "Download (Ollama listed)"}>
          {model.exactManifestSizeBytes !== null
            ? `${formatGb(model.exactManifestSizeBytes / (1024 * 1024 * 1024))} GB`
            : model.sourceDisplaySize}
        </Spec>
        <Spec label="Memory needed">{memory.label}</Spec>
        <Spec label="Context window">{formatContext(model.contextTokens)} tokens</Spec>
      </dl>

      {/* Capabilities + verification */}
      <div className="mt-6 space-y-3 border-t border-neutral-800 pt-5">
        <p className="text-sm text-neutral-300">
          <span className="text-neutral-500">Capabilities: </span>
          {capabilities.length > 0 ? capabilities.join(" · ") : "Text generation"}
        </p>
        <div className="flex items-start gap-2.5">
          {verification.state === "runtime-verified" ? (
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
          ) : (
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" aria-hidden="true" />
          )}
          <div className="min-w-0">
            <p
              className={`text-sm font-medium ${
                verification.state === "runtime-verified" ? "text-emerald-400" : "text-neutral-200"
              }`}
            >
              {verification.label}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-neutral-400">{verification.detail}</p>
          </div>
        </div>
      </div>

      {/* Starter availability */}
      <div className="mt-6 border-t border-neutral-800 pt-5">
        <h4 className="text-sm font-semibold text-neutral-100">Starter templates</h4>
        <ul className="mt-3 divide-y divide-neutral-800 rounded-md border border-neutral-800">
          <li className="flex flex-col gap-1 p-3 sm:flex-row sm:gap-4">
            <span className="w-40 shrink-0 text-sm font-medium text-neutral-200">Local Chat</span>
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
                Available
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-neutral-400">
                Streaming CLI chat against your local Ollama.
              </p>
            </div>
          </li>
          <li className="flex flex-col gap-1 p-3 sm:flex-row sm:gap-4">
            <span className="w-40 shrink-0 text-sm font-medium text-neutral-200">
              Tool-calling Agent
            </span>
            <div className="min-w-0">
              <p
                className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                  agent.available ? "text-emerald-400" : "text-amber-300"
                }`}
              >
                {agent.available ? (
                  <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <AlertTriangleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {agent.headline}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-neutral-400">{agent.reason}</p>
              {agent.suggestion && (
                <p className="mt-1 text-xs font-medium leading-relaxed text-neutral-300">
                  {agent.suggestion}
                </p>
              )}
            </div>
          </li>
        </ul>
      </div>

      {/* Action */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => onSelect(model)}
          aria-label={
            isSelected
              ? `Selected: ${model.displayName}. Continue to starter options`
              : `Use this model: ${model.displayName}`
          }
          className={isSelected ? BTN_PRIMARY_SELECTED : BTN_PRIMARY}
        >
          {isSelected ? (
            <>
              <CheckIcon className="h-4 w-4" aria-hidden="true" />
              Selected
            </>
          ) : (
            "Use this model"
          )}
        </button>
        <div className="min-w-0 sm:flex-1">
          <CopyCommand tag={model.ollamaTag} copied={copiedTag === model.ollamaTag} onCopy={onCopy} />
        </div>
      </div>

      <ModelDetails rec={rec} profile={profile} label="Details and sources" />
    </article>
  );
}

// ---------------------------------------------------------------------------
// Alternatives
// ---------------------------------------------------------------------------

interface AlternativeRowProps {
  rec: Recommendation;
  rank: number;
  top: Recommendation;
  profile: HardwareProfile;
  isSelected: boolean;
  onSelect: (model: ModelEntry) => void;
}

function AlternativeRow({ rec, rank, top, profile, isSelected, onSelect }: AlternativeRowProps) {
  const model = rec.model;
  const fit = getFitSummary(rec, profile);
  const verification = getVerificationSummary(model);
  const memory = getMemoryRequirement(model);
  const notes = getAlternativeNotes(rec, top, profile);
  const agentAvailable = model.capabilities.tools === true;
  const headingId = `alt-heading-${model.id}`;

  return (
    <li className="p-4 sm:p-5" aria-labelledby={headingId}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span className="text-xs tabular-nums text-neutral-500">#{rank}</span>
            <h4
              id={headingId}
              className="min-w-0 break-words text-base font-semibold text-neutral-100"
            >
              {model.displayName}
            </h4>
            <span className="text-sm text-neutral-500">{model.provider}</span>
          </div>

          <p className="mt-1.5 text-sm text-neutral-400">
            {model.exactManifestSizeBytes !== null
              ? `${formatGb(model.exactManifestSizeBytes / (1024 * 1024 * 1024))} GB download`
              : `${model.sourceDisplaySize} download`}{" "}
            · Needs {memory.label} · {formatContext(model.contextTokens)} context
          </p>

          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className={`font-medium ${FIT_TEXT[fit.tone]}`}>Fit: {fit.label}</span>
            <span className={agentAvailable ? "text-neutral-300" : "text-amber-300"}>
              Agent starter: {agentAvailable ? "Yes" : "No"}
            </span>
            <span
              className={
                verification.state === "runtime-verified" ? "text-emerald-400" : "text-neutral-400"
              }
            >
              {verification.shortLabel}
            </span>
          </p>

          {notes.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-xs leading-relaxed text-neutral-400">
              {notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={() => onSelect(model)}
          aria-label={
            isSelected
              ? `Selected: ${model.displayName}. Continue to starter options`
              : `Use this model: ${model.displayName}`
          }
          className={`${isSelected ? BTN_PRIMARY_SELECTED : BTN_SECONDARY} sm:shrink-0`}
        >
          {isSelected ? (
            <>
              <CheckIcon className="h-4 w-4" aria-hidden="true" />
              Selected
            </>
          ) : (
            "Use this model"
          )}
        </button>
      </div>

      <ModelDetails rec={rec} profile={profile} label="Details" />
    </li>
  );
}

// ---------------------------------------------------------------------------
// Results (Top pick + Alternatives)
// ---------------------------------------------------------------------------

export interface RecommendationResultsProps {
  results: Recommendation[];
  profile: HardwareProfile;
  selectedModelId: string | null;
  copiedTag: string | null;
  onSelect: (model: ModelEntry) => void;
  onCopy: (tag: string) => void;
}

export function RecommendationResults({
  results,
  profile,
  selectedModelId,
  copiedTag,
  onSelect,
  onCopy,
}: RecommendationResultsProps) {
  const [top, ...alternatives] = results;
  if (!top) return null;

  return (
    <section
      id="recommendations-section"
      aria-labelledby="results-heading"
      className="mt-10 w-full space-y-8 sm:mt-12"
    >
      <header className="border-b border-neutral-800 pb-4">
        <h2 id="results-heading" className="text-lg font-semibold text-neutral-100 sm:text-xl">
          Recommended for your machine
        </h2>
        <p className="mt-1 text-sm text-neutral-400">{describeProfile(profile)}</p>
      </header>

      <TopPick
        rec={top}
        alternatives={alternatives}
        profile={profile}
        isSelected={selectedModelId === top.model.id}
        copiedTag={copiedTag}
        onSelect={onSelect}
        onCopy={onCopy}
      />

      {alternatives.length > 0 && (
        <section aria-labelledby="alternatives-heading">
          <div className="mb-3">
            <h3 id="alternatives-heading" className="text-base font-semibold text-neutral-100">
              Alternatives
            </h3>
            <p className="mt-0.5 text-sm text-neutral-400">
              Other verified models that also fit this hardware, compared with the top pick.
            </p>
          </div>
          <ul className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
            {alternatives.map((rec, i) => (
              <AlternativeRow
                key={rec.model.id}
                rec={rec}
                rank={i + 2}
                top={top}
                profile={profile}
                isSelected={selectedModelId === rec.model.id}
                onSelect={onSelect}
              />
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs leading-relaxed text-neutral-500">
        Ranked by hardware fit, use case and verified capabilities. Memory figures marked
        &ldquo;estimate&rdquo; are Hack Day Starter heuristics, not vendor requirements.
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

export function RecommendationEmptyState({
  profile,
  onEditProfile,
}: {
  profile: HardwareProfile | null;
  onEditProfile: () => void;
}) {
  return (
    <section
      aria-labelledby="empty-heading"
      className="mt-10 w-full rounded-lg border border-neutral-800 bg-neutral-900/60 p-5 sm:mt-12 sm:p-7"
    >
      <h2 id="empty-heading" className="text-lg font-semibold text-neutral-100">
        No verified model fits this hardware
      </h2>
      {profile && <p className="mt-1 text-sm text-neutral-400">{describeProfile(profile)}</p>}

      <p className="mt-4 text-sm leading-relaxed text-neutral-300">
        None of the verified models pass the memory, disk and capability checks for this profile.
        Change one of these and search again:
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-neutral-300">
        <li>
          <span className="font-medium text-neutral-100">Free disk space.</span> A model needs its
          full download plus a safety buffer
          {profile ? `; you entered ${formatGb(profile.freeDiskSpaceGb)} GB.` : "."}
        </li>
        <li>
          <span className="font-medium text-neutral-100">Available memory.</span> Close
          memory-heavy apps, or enter the RAM you can actually use
          {profile ? `; you entered ${formatGb(profile.ramGb)} GB.` : "."}
        </li>
        {profile?.requiredCapabilities?.tools && (
          <li>
            <span className="font-medium text-neutral-100">Tool-calling filter.</span> Turn it off
            to include models without verified tool calling. You can still build a Local Chat
            starter with them.
          </li>
        )}
      </ul>

      <button type="button" onClick={onEditProfile} className={`${BTN_SECONDARY} mt-5`}>
        Edit hardware profile
      </button>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

export function RecommendationError({
  message,
  canRetry,
  onRetry,
  onEditProfile,
}: {
  message: string;
  canRetry: boolean;
  onRetry: () => void;
  onEditProfile: () => void;
}) {
  return (
    <div className="mt-6 w-full">
      <Callout variant="error" title="Could not load recommendations">
        <p>{message}</p>
        <p className="mt-1 text-xs text-neutral-400">
          Your hardware details are kept. Check your connection and try again.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          {canRetry && (
            <button type="button" onClick={onRetry} className={BTN_SECONDARY}>
              Try again
            </button>
          )}
          <button type="button" onClick={onEditProfile} className={BTN_SECONDARY}>
            Edit hardware profile
          </button>
        </div>
      </Callout>
    </div>
  );
}
