import { StarterGenerationOptions, StarterProjectResult } from "./types";
import { generateChatStarter } from "./templates/chat";
import { generateAgentStarter } from "./templates/agent";

/**
 * Deterministically generates a starter project given a verified model and starter type.
 *
 * Rules:
 * 1. Strictly enforces that starterType === "agent" requires model.capabilities.tools === true.
 * 2. Deterministic: identical model + starterType produces identical file contents.
 * 3. Never writes to disk directly; returns file array in-memory.
 */
export function generateStarterProject(
  options: StarterGenerationOptions
): StarterProjectResult {
  const { model, starterType } = options;

  if (starterType === "agent") {
    if (model.capabilities.tools !== true) {
      throw new Error(
        "This model does not have verified native tool-calling support."
      );
    }
    const files = generateAgentStarter(options);
    const projectName = `hack-day-starter-agent-${model.family}`;

    return {
      projectName,
      starterType: "agent",
      modelTag: model.ollamaTag,
      modelDisplayName: model.displayName,
      provider: model.provider,
      files,
      summary: {
        fileCount: files.length,
        primaryCommand: "npm run dev",
      },
    };
  }

  if (starterType === "chat") {
    const files = generateChatStarter(options);
    const projectName = `hack-day-starter-chat-${model.family}`;

    return {
      projectName,
      starterType: "chat",
      modelTag: model.ollamaTag,
      modelDisplayName: model.displayName,
      provider: model.provider,
      files,
      summary: {
        fileCount: files.length,
        primaryCommand: "npm run dev",
      },
    };
  }

  throw new Error(`Unsupported starter type: '${starterType}'`);
}
