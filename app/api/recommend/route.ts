/**
 * POST /api/recommend
 *
 * Accepts a HardwareProfile JSON body and returns model recommendations.
 * Runs entirely server-side so the recommendation logic never ships to the
 * browser (keeps the bundle small and the logic in one place).
 */

import { NextRequest, NextResponse } from "next/server";
import { recommendModels } from "@/lib/recommend";
import { GpuType, HardwareProfile, OperatingSystem, UseCase } from "@/lib/types";

// Simple runtime validation — avoids pulling in zod for the MVP
const VALID_GPU: GpuType[] = ["apple-silicon", "nvidia", "none"];
const VALID_OS: OperatingSystem[] = ["macos", "linux", "windows"];
const VALID_USE_CASE: UseCase[] = ["code", "chat", "summarization", "general"];

function isValidProfile(body: unknown): body is HardwareProfile {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.ramGb === "number" &&
    b.ramGb > 0 &&
    VALID_GPU.includes(b.gpu as GpuType) &&
    VALID_OS.includes(b.os as OperatingSystem) &&
    VALID_USE_CASE.includes(b.useCase as UseCase)
  );
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();

    if (!isValidProfile(body)) {
      return NextResponse.json(
        { error: "Invalid hardware profile. Check your inputs." },
        { status: 400 }
      );
    }

    const results = recommendModels(body);
    return NextResponse.json({ recommendations: results });
  } catch {
    return NextResponse.json(
      { error: "Could not parse request body." },
      { status: 400 }
    );
  }
}
