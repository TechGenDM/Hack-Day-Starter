/**
 * POST /api/recommend
 *
 * Accepts a HardwareProfile JSON body and returns verified model recommendations.
 * Runs entirely server-side so recommendation logic and catalog remain centralized.
 */

import { NextRequest, NextResponse } from "next/server";
import { recommendModels } from "@/lib/recommend";
import { REGISTRY_METADATA } from "@/lib/registry";
import { GpuType, HardwareProfile, OperatingSystem, UseCase } from "@/lib/types";

const VALID_GPU: GpuType[] = ["apple-silicon", "nvidia", "none"];
const VALID_OS: OperatingSystem[] = ["macos", "linux", "windows"];
const VALID_USE_CASE: UseCase[] = ["code", "chat", "summarization", "general"];

function isValidProfile(body: unknown): body is HardwareProfile {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.ramGb === "number" &&
    b.ramGb > 0 &&
    typeof b.freeDiskSpaceGb === "number" &&
    b.freeDiskSpaceGb > 0 &&
    VALID_GPU.includes(b.gpu as GpuType) &&
    VALID_OS.includes(b.os as OperatingSystem) &&
    VALID_USE_CASE.includes(b.useCase as UseCase)
  );
}

export async function POST(req: NextRequest) {
  try {
    const rawBody: unknown = await req.json();

    // Default freeDiskSpaceGb to 50 if missing for backward compatibility
    if (
      typeof rawBody === "object" &&
      rawBody !== null &&
      !("freeDiskSpaceGb" in rawBody)
    ) {
      (rawBody as Record<string, unknown>).freeDiskSpaceGb = 50;
    }

    if (!isValidProfile(rawBody)) {
      return NextResponse.json(
        {
          error:
            "Invalid hardware profile. Please provide valid RAM, Free Disk Space, GPU, OS, and Use Case.",
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
