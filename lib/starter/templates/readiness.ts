/**
 * Shared source for the generated `src/readiness.ts` module.
 *
 * Both starter types (Local Chat and Tool-calling Agent) ship the exact same
 * readiness check so they behave identically when Ollama or the selected
 * model is missing.
 *
 * NOTE: The returned string is emitted verbatim into generated projects.
 * It intentionally contains no backticks, no template placeholders, and no
 * backslash escapes so it can live safely inside this template literal.
 */
export function generateReadinessModule(): string {
  return `/**
 * Ollama readiness check.
 *
 * Runs once before the first model request so that a missing Ollama runtime
 * or a missing model produces a clear, actionable message instead of a raw
 * connection error. Uses only native Node.js fetch (no dependencies).
 *
 * This module never installs software, never pulls models, and never
 * substitutes a different model. It only reports what it finds.
 */

export const OLLAMA_DOWNLOAD_URL = "https://ollama.com/download";

export type ReadinessStatus = "ready" | "ollama-unreachable" | "model-missing";

export interface ReadinessResult {
  status: ReadinessStatus;
  host: string;
  modelTag: string;
  installedModels: string[];
  detail?: string;
}

/**
 * Exact tag match. A tag without a version suffix is treated as ":latest",
 * which is how Ollama lists it locally. No other normalization is applied.
 */
export function isModelTagInstalled(modelTag: string, installedModels: string[]): boolean {
  const normalized = modelTag.includes(":") ? modelTag : modelTag + ":latest";
  return installedModels.some((name) => name === modelTag || name === normalized);
}

export async function checkOllamaReadiness(
  host: string,
  modelTag: string,
  timeoutMs = 3000
): Promise<ReadinessResult> {
  let baseUrl = host;
  while (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);

  let installedModels: string[];
  try {
    const res = await fetch(baseUrl + "/api/tags", {
      method: "GET",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      return {
        status: "ollama-unreachable",
        host,
        modelTag,
        installedModels: [],
        detail: "HTTP " + res.status,
      };
    }
    const data = (await res.json()) as {
      models?: Array<{ name?: unknown; model?: unknown }>;
    };
    installedModels = (data.models ?? [])
      .flatMap((m) => [m.name, m.model])
      .filter((n): n is string => typeof n === "string");
  } catch (err: any) {
    return {
      status: "ollama-unreachable",
      host,
      modelTag,
      installedModels: [],
      detail: String(err?.cause?.code || err?.name || err?.message || err),
    };
  }

  if (!isModelTagInstalled(modelTag, installedModels)) {
    return { status: "model-missing", host, modelTag, installedModels };
  }
  return { status: "ready", host, modelTag, installedModels };
}

export function formatReadinessMessage(result: ReadinessResult): string[] {
  if (result.status === "ollama-unreachable") {
    return [
      "❌ Ollama is not reachable at " + result.host + ".",
      "   This project runs its model locally through Ollama, and Ollama does not seem to be running.",
      "",
      "   1. Install Ollama (skip if already installed): " + OLLAMA_DOWNLOAD_URL,
      "   2. Start Ollama: open the Ollama app, or run: ollama serve",
      "   3. Restart this project: npm run dev",
    ];
  }
  if (result.status === "model-missing") {
    return [
      "⚠️  Ollama is running, but the model '" + result.modelTag + "' is not installed locally.",
      "",
      "   Download it with:",
      "     ollama pull " + result.modelTag,
      "",
      "   Then restart this project: npm run dev",
    ];
  }
  return ["✅ Ollama is running and model '" + result.modelTag + "' is installed."];
}

/**
 * Prints the readiness outcome. Returns true only when the project can
 * safely continue to the first model request.
 */
export async function ensureOllamaReady(host: string, modelTag: string): Promise<boolean> {
  const result = await checkOllamaReadiness(host, modelTag);
  const print = result.status === "ready" ? console.log : console.error;
  for (const line of formatReadinessMessage(result)) print(line);
  if (result.status !== "ready") print("");
  return result.status === "ready";
}
`;
}
