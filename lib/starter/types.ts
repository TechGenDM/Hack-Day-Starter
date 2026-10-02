import { ModelEntry, StarterType } from "../types";

export interface StarterFile {
  path: string;
  content: string;
}

export interface StarterGenerationOptions {
  model: ModelEntry;
  starterType: StarterType;
  explanation?: string;
}

export interface StarterProjectResult {
  projectName: string;
  starterType: StarterType;
  modelTag: string;
  modelDisplayName: string;
  provider: string;
  files: StarterFile[];
  summary: {
    fileCount: number;
    primaryCommand: string;
  };
}

export interface StarterApiRequest {
  modelId: string;
  starterType: StarterType;
  explanation?: string;
}

export interface StarterApiResponse {
  success: boolean;
  result?: StarterProjectResult;
  error?: string;
}
