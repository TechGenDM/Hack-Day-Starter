"use client";

import React, { useState } from "react";
import { Button } from "./ui/Button";
import { SegmentedControl } from "./ui/SegmentedControl";
import { NumberField } from "./ui/NumberField";
import { Select } from "./ui/Select";
import { Checkbox } from "./ui/Checkbox";
import { Callout } from "./ui/Callout";
import type {
  OperatingSystem,
  AppleSiliconGeneration,
  UseCase,
  HardwareProfile,
} from "@/lib/types";

export type UiHardwareType = "apple-silicon" | "nvidia" | "amd" | "cpu";

export interface HardwareFormProps {
  onSubmit: (profile: HardwareProfile) => void;
  loading: boolean;
}

const OS_OPTIONS = [
  { value: "macos" as OperatingSystem, label: "macOS" },
  { value: "windows" as OperatingSystem, label: "Windows" },
  { value: "linux" as OperatingSystem, label: "Linux" },
];

const MAC_HARDWARE_OPTIONS = [
  { value: "apple-silicon" as UiHardwareType, label: "Apple silicon Mac" },
  { value: "cpu" as UiHardwareType, label: "CPU / Integrated graphics" },
];

const PC_HARDWARE_OPTIONS = [
  { value: "nvidia" as UiHardwareType, label: "NVIDIA GPU" },
  { value: "amd" as UiHardwareType, label: "AMD GPU" },
  { value: "cpu" as UiHardwareType, label: "CPU / Integrated graphics" },
];

const APPLE_GEN_OPTIONS: { value: AppleSiliconGeneration; label: string }[] = [
  { value: "m1", label: "M1" },
  { value: "m2", label: "M2" },
  { value: "m3", label: "M3" },
  { value: "m4", label: "M4" },
  { value: "m5", label: "M5" },
  { value: "m6", label: "M6" },
];

const RAM_PRESETS = [8, 16, 24, 32, 64];
const DISK_PRESETS = [10, 25, 50, 100];
const VRAM_PRESETS = [4, 8, 12, 16, 24];

const USE_CASE_OPTIONS = [
  {
    value: "code",
    label: "Code generation & assistance",
    description: "Coding tasks, function synthesis, and debugging",
  },
  {
    value: "chat",
    label: "Chat & conversation",
    description: "Interactive assistant and natural dialogue",
  },
  {
    value: "summarization",
    label: "Summarization & writing",
    description: "Long-form reading, document condensing, and drafting",
  },
  {
    value: "general",
    label: "General purpose",
    description: "Versatile reasoning across diverse hack day ideas",
  },
];

export function HardwareForm({ onSubmit, loading }: HardwareFormProps) {
  // 1. Operating System
  const [os, setOs] = useState<OperatingSystem>("macos");

  // 2. Hardware Type
  const [hardwareType, setHardwareType] = useState<UiHardwareType>("apple-silicon");

  // OS change reset notice
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  // 3. Relevant Hardware Details
  const [appleGen, setAppleGen] = useState<AppleSiliconGeneration>("m3");

  // NVIDIA VRAM
  const [vramChoice, setVramChoice] = useState<number | "custom">(8);
  const [customVram, setCustomVram] = useState<number | "">("");

  // 4. Memory (Unified or System RAM)
  const [ramChoice, setRamChoice] = useState<number | "custom">(24);
  const [customRam, setCustomRam] = useState<number | "">("");

  // 5. Free Disk Space
  const [diskChoice, setDiskChoice] = useState<number | "custom">(50);
  const [customDisk, setCustomDisk] = useState<number | "">("");

  // 6. Use Case
  const [useCase, setUseCase] = useState<UseCase>("code");

  // 7. Capability Filters
  const [requireTools, setRequireTools] = useState<boolean>(false);
  const [requireVision, setRequireVision] = useState<boolean>(false);

  // -------------------------------------------------------------------------
  // Invalidation & OS switching logic
  // -------------------------------------------------------------------------
  function handleOsChange(nextOs: OperatingSystem) {
    if (nextOs === os) return;
    setOs(nextOs);

    if (nextOs === "macos") {
      // macOS only allows apple-silicon or cpu
      if (hardwareType === "nvidia") {
        setHardwareType("apple-silicon");
        setResetNotice(
          "NVIDIA GPUs are not supported on macOS. Reset hardware to Apple silicon Mac."
        );
      } else if (hardwareType === "amd") {
        setHardwareType("apple-silicon");
        setResetNotice(
          "AMD GPUs are not supported by Ollama on macOS. Reset hardware to Apple silicon Mac."
        );
      } else {
        setResetNotice(null);
      }
    } else {
      // Windows or Linux: apple-silicon is impossible
      if (hardwareType === "apple-silicon") {
        setHardwareType("nvidia");
        setResetNotice(
          `Apple silicon is only available on macOS. Reset hardware to NVIDIA GPU on ${
            nextOs === "windows" ? "Windows" : "Linux"
          }.`
        );
      } else {
        setResetNotice(null);
      }
    }
  }

  function handleHardwareChange(nextHw: UiHardwareType) {
    setHardwareType(nextHw);
    setResetNotice(null);
  }

  // -------------------------------------------------------------------------
  // Validation calculations
  // -------------------------------------------------------------------------
  let ramError: string | undefined;
  let resolvedRam = typeof ramChoice === "number" ? ramChoice : 0;
  if (ramChoice === "custom") {
    if (customRam === "") {
      ramError = "Please enter your memory size in GB.";
    } else if (customRam < 1 || customRam > 1024) {
      ramError = "Memory size must be between 1 and 1024 GB.";
    } else {
      resolvedRam = customRam;
    }
  }

  let diskError: string | undefined;
  let resolvedDisk = typeof diskChoice === "number" ? diskChoice : 0;
  if (diskChoice === "custom") {
    if (customDisk === "") {
      diskError = "Please enter your free disk space in GB.";
    } else if (customDisk < 1 || customDisk > 100000) {
      diskError = "Free disk space must be between 1 and 100,000 GB.";
    } else {
      resolvedDisk = customDisk;
    }
  }

  let vramError: string | undefined;
  let resolvedVram: number | null = null;
  if (hardwareType === "nvidia") {
    if (vramChoice === "custom") {
      if (customVram === "") {
        vramError = "Please enter GPU VRAM in GB.";
      } else if (customVram < 1 || customVram > 192) {
        vramError = "GPU VRAM must be between 1 and 192 GB.";
      } else {
        resolvedVram = customVram;
      }
    } else {
      resolvedVram = vramChoice;
    }
  }

  const hasValidationError = Boolean(
    ramError || diskError || (hardwareType === "nvidia" && vramError)
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (hasValidationError || loading) return;

    let gpuTypeToSend: "apple-silicon" | "nvidia" | "none";
    if (hardwareType === "apple-silicon") {
      gpuTypeToSend = "apple-silicon";
    } else if (hardwareType === "nvidia") {
      gpuTypeToSend = "nvidia";
    } else {
      // AMD and CPU both use conservative CPU-only execution in the engine
      gpuTypeToSend = "none";
    }

    const profile: HardwareProfile = {
      ramGb: resolvedRam,
      freeDiskSpaceGb: resolvedDisk,
      os,
      gpuType: gpuTypeToSend,
      gpuVramGb: resolvedVram,
      appleSiliconGeneration: hardwareType === "apple-silicon" ? appleGen : null,
      useCase,
      requiredCapabilities: {
        ...(requireTools && { tools: true }),
        ...(requireVision && { vision: true }),
      },
    };

    onSubmit(profile);
  }

  const memoryLabel =
    hardwareType === "apple-silicon" ? "Unified memory" : "System memory";

  const hardwareOptions =
    os === "macos" ? MAC_HARDWARE_OPTIONS : PC_HARDWARE_OPTIONS;

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full space-y-6 sm:space-y-7 rounded-xl bg-neutral-900/40 border border-neutral-800 p-5 sm:p-7 shadow-xs"
      noValidate
    >
      {/* Header */}
      <div className="border-b border-neutral-800 pb-4">
        <h2 className="text-base sm:text-lg font-semibold text-neutral-100">
          Your computer
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1">
          Configure your operating system and hardware to evaluate model compatibility.
        </p>
      </div>

      {/* Inline OS change reset notification */}
      {resetNotice && (
        <Callout
          variant="warning"
          title="Hardware reset"
          onDismiss={() => setResetNotice(null)}
        >
          {resetNotice}
        </Callout>
      )}

      {/* 1. Operating System */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-neutral-200">
          1. Operating system
        </legend>
        <SegmentedControl
          name="operating-system"
          label="Operating system"
          options={OS_OPTIONS}
          value={os}
          onChange={handleOsChange}
        />
      </fieldset>

      {/* 2. Hardware Type */}
      <fieldset className="space-y-2">
        <div className="flex items-baseline justify-between">
          <legend className="text-sm font-medium text-neutral-200">
            2. Hardware type
          </legend>
          <span className="text-xs text-neutral-400">
            Available on {os === "macos" ? "macOS" : os === "windows" ? "Windows" : "Linux"}
          </span>
        </div>
        <SegmentedControl
          name="hardware-type"
          label="Hardware type"
          options={hardwareOptions}
          value={hardwareType}
          onChange={handleHardwareChange}
        />
      </fieldset>

      {/* 3. Relevant Hardware Details */}
      {hardwareType === "apple-silicon" && (
        <fieldset className="space-y-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/80 p-3.5 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
            <legend className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Apple silicon generation
            </legend>
            <span className="text-[11px] text-neutral-400">
              M1 through M6 architecture
            </span>
          </div>

          <div
            role="radiogroup"
            aria-label="Apple silicon generation"
            className="grid grid-cols-3 sm:grid-cols-6 gap-2 w-full"
          >
            {APPLE_GEN_OPTIONS.map((g) => {
              const isSelected = appleGen === g.value;
              const inputId = `apple-gen-${g.value}`;
              return (
                <label
                  key={g.value}
                  htmlFor={inputId}
                  className={`
                    relative flex items-center justify-center py-2 px-2 rounded-lg border text-sm font-medium cursor-pointer select-none transition-all min-h-[40px]
                    has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-neutral-950
                    ${
                      isSelected
                        ? "bg-neutral-800 text-neutral-100 border-neutral-600 ring-1 ring-emerald-500/40 font-semibold"
                        : "bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:bg-neutral-800/60 hover:text-neutral-200 hover:border-neutral-700"
                    }
                  `}
                >
                  <input
                    type="radio"
                    id={inputId}
                    name="apple-silicon-gen"
                    value={g.value}
                    checked={isSelected}
                    onChange={() => setAppleGen(g.value)}
                    className="sr-only"
                  />
                  <span>{g.label}</span>
                </label>
              );
            })}
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed">
            Note: All Apple silicon generations share the unified memory architecture.
            Model fit is determined by available unified memory.
          </p>
        </fieldset>
      )}

      {hardwareType === "nvidia" && (
        <fieldset className="space-y-3 rounded-lg bg-neutral-950/60 border border-neutral-800/80 p-3.5 sm:p-4">
          <div className="flex items-baseline justify-between">
            <legend className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              GPU memory (VRAM)
            </legend>
            <span className="text-xs text-neutral-400">
              Selected:{" "}
              <strong className="text-neutral-200">
                {typeof vramChoice === "number" ? `${vramChoice} GB` : "Custom"}
              </strong>
            </span>
          </div>

          <div
            role="radiogroup"
            aria-label="GPU memory (VRAM) preset"
            className="flex flex-wrap gap-2"
          >
            {VRAM_PRESETS.map((val) => {
              const isSelected = vramChoice === val;
              const inputId = `vram-preset-${val}`;
              return (
                <label
                  key={val}
                  htmlFor={inputId}
                  className={`
                    inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg border text-xs sm:text-sm font-medium cursor-pointer select-none transition-all min-h-[38px]
                    has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-neutral-950
                    ${
                      isSelected
                        ? "bg-neutral-800 text-neutral-100 border-neutral-600 ring-1 ring-emerald-500/40 font-semibold"
                        : "bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:bg-neutral-800/60 hover:text-neutral-200"
                    }
                  `}
                >
                  <input
                    type="radio"
                    id={inputId}
                    name="vram-preset"
                    value={val}
                    checked={isSelected}
                    onChange={() => {
                      setVramChoice(val);
                      setCustomVram("");
                    }}
                    className="sr-only"
                  />
                  <span>{val} GB</span>
                </label>
              );
            })}

            <label
              htmlFor="vram-preset-custom"
              className={`
                inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg border text-xs sm:text-sm font-medium cursor-pointer select-none transition-all min-h-[38px]
                has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-neutral-950
                ${
                  vramChoice === "custom"
                    ? "bg-neutral-800 text-neutral-100 border-neutral-600 ring-1 ring-emerald-500/40 font-semibold"
                    : "bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:bg-neutral-800/60 hover:text-neutral-200"
                }
              `}
            >
              <input
                type="radio"
                id="vram-preset-custom"
                name="vram-preset"
                value="custom"
                checked={vramChoice === "custom"}
                onChange={() => setVramChoice("custom")}
                className="sr-only"
              />
              <span>Custom</span>
            </label>
          </div>

          {vramChoice === "custom" && (
            <div className="pt-2">
              <NumberField
                id="custom-vram-input"
                label="Custom VRAM (GB)"
                value={customVram}
                onChange={(val) => setCustomVram(val)}
                min={1}
                max={192}
                unit="GB"
                placeholder="e.g. 10"
                error={vramError}
                autoFocus
              />
            </div>
          )}

          <p className="text-xs text-neutral-400 leading-relaxed">
            Requires NVIDIA drivers ({os === "windows" ? "551.61+ on Windows" : "550+ with Compute Capability 5.0+ on Linux"}).
            Dedicated VRAM is evaluated separately from system RAM.
          </p>
        </fieldset>
      )}

      {hardwareType === "amd" && (
        <Callout variant="info" title="AMD GPU note">
          Ollama supports AMD GPUs via ROCm / Vulkan. Recommendations currently use
          conservative CPU-safe estimates while direct GPU offloading metrics are being benchmarked.
        </Callout>
      )}

      {hardwareType === "cpu" && (
        <div className="rounded-lg bg-neutral-950/40 border border-neutral-800/60 p-3 text-xs text-neutral-400 leading-relaxed">
          CPU execution will use system memory threads for inference. Fits smaller, optimized quantizations best.
        </div>
      )}

      {/* 4. Memory */}
      <fieldset className="space-y-2.5">
        <div className="flex items-baseline justify-between">
          <legend className="text-sm font-medium text-neutral-200">
            {memoryLabel}
          </legend>
          <span className="text-xs text-neutral-400">
            Selected:{" "}
            <strong className="text-neutral-200">
              {typeof ramChoice === "number"
                ? `${ramChoice} GB`
                : customRam !== ""
                ? `${customRam} GB (Custom)`
                : "Custom"}
            </strong>
          </span>
        </div>

        <div
          role="radiogroup"
          aria-label={`${memoryLabel} presets`}
          className="flex flex-wrap gap-2"
        >
          {RAM_PRESETS.map((val) => {
            const isSelected = ramChoice === val;
            const inputId = `ram-preset-${val}`;
            return (
              <label
                key={val}
                htmlFor={inputId}
                className={`
                  inline-flex items-center justify-center px-4 py-2 rounded-lg border text-sm font-medium cursor-pointer select-none transition-all min-h-[40px]
                  has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-neutral-950
                  ${
                    isSelected
                      ? "bg-neutral-800 text-neutral-100 border-neutral-600 ring-1 ring-emerald-500/40 font-semibold"
                      : "bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:bg-neutral-800/60 hover:text-neutral-200"
                  }
                `}
              >
                <input
                  type="radio"
                  id={inputId}
                  name="ram-presets"
                  value={val}
                  checked={isSelected}
                  onChange={() => {
                    setRamChoice(val);
                    setCustomRam("");
                  }}
                  className="sr-only"
                />
                <span>{val} GB</span>
              </label>
            );
          })}

          <label
            htmlFor="ram-preset-custom"
            className={`
              inline-flex items-center justify-center px-4 py-2 rounded-lg border text-sm font-medium cursor-pointer select-none transition-all min-h-[40px]
              has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-neutral-950
              ${
                ramChoice === "custom"
                  ? "bg-neutral-800 text-neutral-100 border-neutral-600 ring-1 ring-emerald-500/40 font-semibold"
                  : "bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:bg-neutral-800/60 hover:text-neutral-200"
              }
            `}
          >
            <input
              type="radio"
              id="ram-preset-custom"
              name="ram-presets"
              value="custom"
              checked={ramChoice === "custom"}
              onChange={() => setRamChoice("custom")}
              className="sr-only"
            />
            <span>Custom</span>
          </label>
        </div>

        {ramChoice === "custom" && (
          <div className="pt-1.5">
            <NumberField
              id="custom-ram-field"
              label={`Custom ${memoryLabel} (GB)`}
              value={customRam}
              onChange={(val) => setCustomRam(val)}
              min={1}
              max={1024}
              unit="GB"
              placeholder="e.g. 48"
              error={ramError}
              autoFocus
            />
          </div>
        )}

        <p className="text-xs text-neutral-400 mt-1">
          {hardwareType === "apple-silicon"
            ? "Unified memory is shared between CPU, GPU, and neural engine."
            : "Total system RAM installed on the host machine."}
        </p>
      </fieldset>

      {/* 5. Free Disk Space */}
      <fieldset className="space-y-2.5">
        <div className="flex items-baseline justify-between">
          <legend className="text-sm font-medium text-neutral-200">
            Free disk space
          </legend>
          <span className="text-xs text-neutral-400">
            Selected:{" "}
            <strong className="text-neutral-200">
              {typeof diskChoice === "number"
                ? `${diskChoice} GB`
                : customDisk !== ""
                ? `${customDisk} GB (Custom)`
                : "Custom"}
            </strong>
          </span>
        </div>

        <div
          role="radiogroup"
          aria-label="Free disk space presets"
          className="flex flex-wrap gap-2"
        >
          {DISK_PRESETS.map((val) => {
            const isSelected = diskChoice === val;
            const inputId = `disk-preset-${val}`;
            return (
              <label
                key={val}
                htmlFor={inputId}
                className={`
                  inline-flex items-center justify-center px-4 py-2 rounded-lg border text-sm font-medium cursor-pointer select-none transition-all min-h-[40px]
                  has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-neutral-950
                  ${
                    isSelected
                      ? "bg-neutral-800 text-neutral-100 border-neutral-600 ring-1 ring-emerald-500/40 font-semibold"
                      : "bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:bg-neutral-800/60 hover:text-neutral-200"
                  }
                `}
              >
                <input
                  type="radio"
                  id={inputId}
                  name="disk-presets"
                  value={val}
                  checked={isSelected}
                  onChange={() => {
                    setDiskChoice(val);
                    setCustomDisk("");
                  }}
                  className="sr-only"
                />
                <span>{val} GB</span>
              </label>
            );
          })}

          <label
            htmlFor="disk-preset-custom"
            className={`
              inline-flex items-center justify-center px-4 py-2 rounded-lg border text-sm font-medium cursor-pointer select-none transition-all min-h-[40px]
              has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-neutral-950
              ${
                diskChoice === "custom"
                  ? "bg-neutral-800 text-neutral-100 border-neutral-600 ring-1 ring-emerald-500/40 font-semibold"
                  : "bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:bg-neutral-800/60 hover:text-neutral-200"
              }
            `}
          >
            <input
              type="radio"
              id="disk-preset-custom"
              name="disk-presets"
              value="custom"
              checked={diskChoice === "custom"}
              onChange={() => setDiskChoice("custom")}
              className="sr-only"
            />
            <span>Custom</span>
          </label>
        </div>

        {diskChoice === "custom" && (
          <div className="pt-1.5">
            <NumberField
              id="custom-disk-field"
              label="Custom free disk space (GB)"
              value={customDisk}
              onChange={(val) => setCustomDisk(val)}
              min={1}
              max={100000}
              unit="GB"
              placeholder="e.g. 120"
              error={diskError}
              autoFocus
            />
          </div>
        )}

        <p className="text-xs text-neutral-400 mt-1">
          Evaluated against the exact model download size plus a recommended 1.5 GB safety buffer.
        </p>
      </fieldset>

      {/* 6. What are you building? (Use Case) */}
      <div className="space-y-1.5 pt-1 border-t border-neutral-800/80">
        <Select
          id="use-case-select"
          label="What are you building?"
          value={useCase}
          onChange={(e) => setUseCase(e.target.value as UseCase)}
          options={USE_CASE_OPTIONS.map((o) => ({
            value: o.value,
            label: `${o.label} — ${o.description}`,
          }))}
        />
      </div>

      {/* 7. Mandatory Capability Filters */}
      <div className="space-y-2 pt-2 border-t border-neutral-800/80">
        <span className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider">
          Must support:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Checkbox
            id="filter-tools"
            label="Tool calling"
            description="Native function calling and structured outputs"
            checked={requireTools}
            onChange={(e) => setRequireTools(e.target.checked)}
          />
          <Checkbox
            id="filter-vision"
            label="Vision capability"
            description="Multimodal image input understanding"
            checked={requireVision}
            onChange={(e) => setRequireVision(e.target.checked)}
          />
        </div>
      </div>

      {/* Submit CTA */}
      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          disabled={hasValidationError || loading}
          className="w-full text-base"
        >
          {loading ? "Checking verified models…" : "Find models"}
        </Button>
      </div>
    </form>
  );
}
