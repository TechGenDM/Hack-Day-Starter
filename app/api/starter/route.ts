import { NextRequest, NextResponse } from "next/server";
import { VERIFIED_MODEL_REGISTRY } from "@/lib/registry";
import { generateStarterProject } from "@/lib/starter/generate";
import { StarterType } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const { modelId, starterType, explanation } = body;

    if (!modelId || typeof modelId !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing required 'modelId' field" },
        { status: 400 }
      );
    }

    if (starterType !== "chat" && starterType !== "agent") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid 'starterType'. Must be either 'chat' or 'agent'",
        },
        { status: 400 }
      );
    }

    // 1. Find model in VERIFIED_MODEL_REGISTRY (never trust arbitrary client input)
    const model = VERIFIED_MODEL_REGISTRY.find(
      (m) => m.id === modelId || m.ollamaTag === modelId
    );

    if (!model) {
      return NextResponse.json(
        {
          success: false,
          error: `Model '${modelId}' not found in verified registry`,
        },
        { status: 404 }
      );
    }

    // 2. Verify model is locally supported and verified
    if (!model.localSupport) {
      return NextResponse.json(
        {
          success: false,
          error: `Model '${model.ollamaTag}' requires remote/cloud execution and cannot be run locally.`,
        },
        { status: 400 }
      );
    }

    if (model.verificationStatus !== "verified") {
      return NextResponse.json(
        {
          success: false,
          error: `Model '${model.ollamaTag}' has status '${model.verificationStatus}' and cannot be used for starters until verified.`,
        },
        { status: 400 }
      );
    }

    if (model.lifecycle === "retired") {
      return NextResponse.json(
        {
          success: false,
          error: `Model '${model.ollamaTag}' is retired from practical use.`,
        },
        { status: 400 }
      );
    }

    // 3. Verify agent capability when starterType === "agent"
    if (starterType === "agent" && model.capabilities.tools !== true) {
      return NextResponse.json(
        {
          success: false,
          error: "This model does not have verified native tool-calling support.",
        },
        { status: 400 }
      );
    }

    // 4. Generate files using deterministic templates
    const result = generateStarterProject({
      model,
      starterType: starterType as StarterType,
      explanation: typeof explanation === "string" ? explanation : undefined,
    });

    // 5. Return generated file metadata/content
    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to generate starter project",
      },
      { status: 500 }
    );
  }
}
