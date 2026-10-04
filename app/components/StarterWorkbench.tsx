"use client";

import { useState } from "react";
import JSZip from "jszip";
import { formatModelDisplaySize } from "@/lib/memory-calculator";
import { formatContext } from "@/lib/recommendation-insights";
import type { AgentAvailability } from "@/lib/recommendation-insights";
import type { StarterProjectResult } from "@/lib/starter/types";
import type { ModelEntry, StarterType } from "@/lib/types";
import { Callout } from "./ui/Callout";
import {
  AlertTriangleIcon,
  CheckIcon,
  CopyIcon,
  HardDriveIcon,
  SpinnerIcon,
} from "./ui/Icons";

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400";
const BTN_PRIMARY = `inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${FOCUS}`;
const BTN_SECONDARY = `inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-md border border-neutral-700 bg-neutral-800 px-4 text-sm font-medium text-neutral-200 transition-colors hover:bg-neutral-700 cursor-pointer ${FOCUS}`;

interface CopyableCommandProps {
  command: string;
  label?: string;
  onCopied?: (cmd: string) => void;
}

function CopyableCommand({ command, label, onCopied }: CopyableCommandProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(command);
    setCopied(true);
    onCopied?.(command);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-stretch overflow-hidden rounded-md border border-neutral-800 bg-neutral-950">
      <code className="flex-1 min-w-0 break-all px-3 py-2.5 font-mono text-xs text-neutral-200 select-all">
        {command}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={label ? `Copy ${label}: ${command}` : `Copy command: ${command}`}
        className={`inline-flex shrink-0 items-center gap-1.5 border-l border-neutral-800 px-3 text-xs font-medium text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-neutral-100 cursor-pointer ${FOCUS}`}
      >
        {copied ? (
          <>
            <CheckIcon className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            <span className="text-emerald-400">Copied</span>
          </>
        ) : (
          <>
            <CopyIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Copy</span>
          </>
        )}
      </button>
    </div>
  );
}

export interface StarterWorkbenchProps {
  selectedModel: ModelEntry;
  selectedAgent: AgentAvailability | null;
  explanation?: string;
}

export function StarterWorkbench({
  selectedModel,
  selectedAgent,
  explanation,
}: StarterWorkbenchProps) {
  const [selectedStarter, setSelectedStarter] = useState<StarterType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedProject, setGeneratedProject] = useState<StarterProjectResult | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [announcement, setAnnouncement] = useState<string>("");

  function announce(msg: string) {
    setAnnouncement(msg);
  }

  async function handleGenerateStarter() {
    if (!selectedStarter) return;
    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedProject(null);
    announce("Generating starter project…");

    try {
      const res = await fetch("/api/starter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: selectedModel.id,
          starterType: selectedStarter,
          explanation,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate starter project");
      }

      setGeneratedProject(data.result);
      announce(
        `Starter project ${data.result.projectName} generated successfully with ${data.result.files.length} files.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setGenerationError(msg);
      announce(`Error generating starter: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDownloadZip() {
    if (!generatedProject) return;
    setIsDownloading(true);
    announce("Packaging ZIP file for download…");

    try {
      const zip = new JSZip();
      for (const file of generatedProject.files) {
        zip.file(file.path, file.content);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${generatedProject.projectName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      announce(`Downloaded ${generatedProject.projectName}.zip`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert("Failed to build ZIP file: " + msg);
      announce("Failed to package ZIP file");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <section
      id="selected-model-section"
      aria-labelledby="starter-workbench-heading"
      className="mt-12 w-full rounded-lg border border-neutral-800 bg-neutral-900/60 p-5 sm:p-7 space-y-6"
    >
      {/* Screen-reader live updates */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Header */}
      <header className="border-b border-neutral-800 pb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
          Ready to Build
        </span>
        <h3
          id="starter-workbench-heading"
          className="mt-1 break-words text-xl sm:text-2xl font-semibold tracking-tight text-neutral-50"
        >
          {selectedModel.displayName}
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-neutral-400">
          {selectedModel.provider} · {selectedModel.parameterCount}
          {selectedModel.activeParameterCount ? ` (${selectedModel.activeParameterCount} active)` : ""} ·{" "}
          {selectedModel.quantization} · Context: {formatContext(selectedModel.contextTokens)} tokens ·{" "}
          License: {selectedModel.license}
        </p>

        {/* Model Tag + Copy */}
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
          <span className="text-neutral-400 shrink-0">Exact Ollama tag:</span>
          <code className="font-mono text-emerald-400 font-semibold bg-neutral-950 px-2 py-1 rounded border border-neutral-800 self-start">
            {selectedModel.ollamaTag}
          </code>
          <span className="text-neutral-500 hidden sm:inline">·</span>
          <span className="text-neutral-400">
            Download: {formatModelDisplaySize(selectedModel)}
          </span>
        </div>
      </header>

      {/* Step 1: Starter Template Selection */}
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-semibold text-neutral-100">
            Choose starter template:
          </h4>
          <p className="mt-0.5 text-xs text-neutral-400">
            Select the architecture for your Node.js/TypeScript local AI starter project.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Option A: Local Chat */}
          <button
            type="button"
            onClick={() => {
              setSelectedStarter("chat");
              setGeneratedProject(null);
              setGenerationError(null);
              announce("Selected Local Chat starter template.");
            }}
            aria-pressed={selectedStarter === "chat"}
            className={`p-4 rounded-lg text-left transition-all border cursor-pointer min-h-11 ${FOCUS} ${
              selectedStarter === "chat"
                ? "bg-neutral-800/90 border-emerald-500/80 ring-1 ring-emerald-500/50 text-neutral-100"
                : "bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 text-neutral-300"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="font-semibold text-sm text-neutral-100">Local Chat</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-medium">
                Universal
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Interactive terminal chat with stream processing, conversation history, and direct local Ollama connectivity.
            </p>
          </button>

          {/* Option B: Tool-calling Agent */}
          {selectedModel.capabilities.tools === true ? (
            <button
              type="button"
              onClick={() => {
                setSelectedStarter("agent");
                setGeneratedProject(null);
                setGenerationError(null);
                announce("Selected Tool-calling Agent starter template.");
              }}
              aria-pressed={selectedStarter === "agent"}
              className={`p-4 rounded-lg text-left transition-all border cursor-pointer min-h-11 ${FOCUS} ${
                selectedStarter === "agent"
                  ? "bg-neutral-800/90 border-emerald-500/80 ring-1 ring-emerald-500/50 text-neutral-100"
                  : "bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 text-neutral-300"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-semibold text-sm text-neutral-100">Tool-calling Agent</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/60 font-medium">
                  Agentic Loop
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Autonomous agent with JSON schema function definitions, safe local calculator tool execution, and multi-step reasoning loop.
              </p>
            </button>
          ) : (
            <div className="p-4 rounded-lg text-left border border-neutral-800/80 bg-neutral-950/30">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-semibold text-sm text-neutral-300">Tool-calling Agent</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-amber-300 font-medium">
                  Unavailable
                </span>
              </div>
              <p className="text-xs text-amber-300/90 leading-relaxed flex items-start gap-1.5">
                <AlertTriangleIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  {selectedAgent?.reason}
                  {selectedAgent?.suggestion ? ` ${selectedAgent.suggestion}` : ""}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {generationError && (
        <Callout variant="error" title="Generation Error">
          <p>{generationError}</p>
          <button
            type="button"
            onClick={handleGenerateStarter}
            className={`${BTN_SECONDARY} mt-3 text-xs`}
          >
            Retry generation
          </button>
        </Callout>
      )}

      {/* Generate Action Bar */}
      {selectedStarter && !generatedProject && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-neutral-800 bg-neutral-950/80 p-4 sm:p-5">
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-neutral-100">
              Generate {selectedStarter === "chat" ? "Local Chat" : "Tool-calling Agent"} starter
            </h4>
            <p className="mt-0.5 text-xs text-neutral-400">
              Pre-configured project configured for{" "}
              <code className="text-emerald-400 font-mono font-medium">{selectedModel.ollamaTag}</code>.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateStarter}
            disabled={isGenerating}
            className={BTN_PRIMARY}
          >
            {isGenerating ? (
              <>
                <SpinnerIcon className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Generating project…</span>
              </>
            ) : (
              <span>Generate Starter</span>
            )}
          </button>
        </div>
      )}

      {/* Flattened Generated Project View */}
      {generatedProject && (
        <div className="space-y-6 border-t border-neutral-800 pt-6">
          {/* Success Banner + Download Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-emerald-900/60 bg-emerald-950/20 p-4 sm:p-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm sm:text-base">
                <CheckIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Starter Project Ready</span>
                <span className="text-xs px-2 py-0.5 rounded bg-neutral-900 text-neutral-200 font-mono font-normal border border-neutral-700">
                  {generatedProject.projectName}
                </span>
              </div>
              <p className="mt-1 text-xs text-neutral-400">
                Deterministic Node.js/TypeScript project generated with zero external runtime dependencies.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={isDownloading}
              className={BTN_PRIMARY}
            >
              {isDownloading ? (
                <>
                  <SpinnerIcon className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Packaging ZIP…</span>
                </>
              ) : (
                <>
                  <HardDriveIcon className="w-4 h-4" aria-hidden="true" />
                  <span>Download ZIP</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Files Listing */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <h4 className="font-semibold text-neutral-200 uppercase tracking-wider">
                Generated Files ({generatedProject.files.length})
              </h4>
              <span className="text-neutral-400 font-mono text-[11px]">
                Zero runtime dependencies
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              {generatedProject.files.map((file) => (
                <div
                  key={file.path}
                  className="flex items-center gap-2 p-2.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300"
                >
                  <CheckIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                  <span className="truncate">{file.path}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3-Step Setup Instructions */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-neutral-100">
              3-Step Setup Flow
            </h4>

            <ol className="space-y-3 text-xs">
              {/* Step 1: Download */}
              <li className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 font-medium text-neutral-200">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] font-bold">
                    1
                  </span>
                  <span>Download the starter archive</span>
                </div>
                <p className="text-neutral-400 pl-7">
                  Click the <span className="text-neutral-200 font-medium">&ldquo;Download ZIP&rdquo;</span> button above and save{" "}
                  <code className="text-neutral-200 font-mono">{generatedProject.projectName}.zip</code> to your computer.
                </p>
              </li>

              {/* Step 2: Extract & CD */}
              <li className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3.5 space-y-2">
                <div className="flex items-center gap-2 font-medium text-neutral-200">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] font-bold">
                    2
                  </span>
                  <span>Extract and open terminal inside folder</span>
                </div>
                <div className="pl-7 space-y-1.5">
                  <p className="text-neutral-400">
                    Extract the ZIP archive and change into the project directory:
                  </p>
                  <CopyableCommand
                    command={`cd ${generatedProject.projectName}`}
                    label="change directory command"
                    onCopied={() => announce("Copied cd command")}
                  />
                </div>
              </li>

              {/* Step 3: Prerequisites, Install, and Run */}
              <li className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3.5 space-y-2.5">
                <div className="flex items-center gap-2 font-medium text-neutral-200">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] font-bold">
                    3
                  </span>
                  <span>Pull model, install dependencies, and run</span>
                </div>
                <div className="pl-7 space-y-3">
                  <div>
                    <p className="text-neutral-400 mb-1">
                      Pull the verified model into your local Ollama daemon:
                    </p>
                    <CopyableCommand
                      command={`ollama pull ${selectedModel.ollamaTag}`}
                      label="pull model command"
                      onCopied={() => announce("Copied ollama pull command")}
                    />
                  </div>

                  <div>
                    <p className="text-neutral-400 mb-1">
                      Install TypeScript/Node.js dev dependencies:
                    </p>
                    <CopyableCommand
                      command="npm install"
                      label="npm install command"
                      onCopied={() => announce("Copied npm install command")}
                    />
                  </div>

                  <div>
                    <p className="text-neutral-400 mb-1">
                      Launch your local starter:
                    </p>
                    <CopyableCommand
                      command="npm run dev"
                      label="npm run dev command"
                      onCopied={() => announce("Copied npm run dev command")}
                    />
                  </div>
                </div>
              </li>
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}
