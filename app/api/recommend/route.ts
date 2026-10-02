/**
 * POST /api/recommend
 *
 * Accepts an extended HardwareProfile JSON body and returns verified model recommendations.
 * Runs entirely server-side.
 */

import { NextRequest, NextResponse } from "next/server";
import { recommendModels } from "@/lib/recommend";
import { REGISTRY_METADATA } from "@/lib/registry";
import {
  GpuType,
  HardwareProfile,
  OperatingSystem,
  UseCase,
  AppleSiliconGeneration,
} from "@/lib/types";

const VALID_GPU: GpuType[] = ["apple-silicon", "nvidia", "none"];
const VALID_OS: OperatingSystem[] = ["macos", "linux", "windows"];
const VALID_USE_CASE: UseCase[] = ["code", "chat", "summarization", "general"];

function isValidProfile(body: unknown): body is HardwareProfile {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;

  const hasValidRam = typeof b.ramGb === "number" && b.ramGb > 0;
  const hasValidDisk = typeof b.freeDiskSpaceGb === "number" && b.freeDiskSpaceGb > 0;
  const hasValidGpu = VALID_GPU.includes(b.gpuType as GpuType);
  const hasValidOs = VALID_OS.includes(b.os as OperatingSystem);
  const hasValidUseCase = VALID_USE_CASE.includes(b.useCase as UseCase);

  return hasValidRam && hasValidDisk && hasValidGpu && hasValidOs && hasValidUseCase;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody: unknown = await req.json();

    if (typeof rawBody === "object" && rawBody !== null) {
      const b = rawBody as Record<string, unknown>;

      // Handle backward-compatibility alias `gpu` -> `gpuType`
      if (!("gpuType" in b) && "gpu" in b) {
        b.gpuType = b.gpu;
      }

      // Default freeDiskSpaceGb if omitted
      if (!("freeDiskSpaceGb" in b)) {
        b.freeDiskSpaceGb = 50;
      }

      // Ensure optional fields are null if missing
      if (!("gpuVramGb" in b)) {
        b.gpuVramGb = null;
      }
      if (!("appleSiliconGeneration" in b)) {
        b.appleSiliconGeneration = null;
      }
    }

    if (!isValidProfile(rawBody)) {
      return NextResponse.json(
        {
          error:
            "Invalid hardware profile. Please provide valid RAM, Free Disk Space, GPU type, OS, and Use Case.",
        },
        { status: 400 }
      );
    }

    const recommendations = recommendModels(rawBody);

    return NextResponse.json({
      recommendations,
      registry: REGISTRY_METADATA,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not parse request body." },
      { status: 400 }
    );
  }
}
