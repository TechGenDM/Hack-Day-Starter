/**
 * Phase 3 Starter Project Generation Test Suite.
 *
 * Automated verification for:
 * A. Chat starter generation
 * B. Agent starter generation
 * C. Exact selected Ollama tag is injected
 * D. README contains exact setup command
 * E. Agent generation rejects a no-tools model
 * F. Generated file paths are valid
 * G. Generated project is deterministic
 * H. Malicious/arbitrary model input cannot bypass registry validation
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { NextRequest } from "next/server";

import { VERIFIED_MODEL_REGISTRY } from "../lib/registry";
import { generateStarterProject } from "../lib/starter/generate";
import { ModelEntry } from "../lib/types";
import { POST } from "../app/api/starter/route";

// ---------------------------------------------------------------------------
// Test Models
// ---------------------------------------------------------------------------

const gemmaModel = VERIFIED_MODEL_REGISTRY.find((m) => m.ollamaTag === "gemma4:e4b")!;
const qwenModel = VERIFIED_MODEL_REGISTRY.find((m) => m.ollamaTag === "qwen3.5:9b")!;
const deepseekNoToolsModel = VERIFIED_MODEL_REGISTRY.find((m) => m.ollamaTag === "deepseek-r1:1.5b")!;
const retiredModel = VERIFIED_MODEL_REGISTRY.find((m) => m.ollamaTag === "llama2:7b")!;

// ---------------------------------------------------------------------------
// Test A: Chat starter generation
// ---------------------------------------------------------------------------

test("A: Chat starter generation produces standard file set", () => {
  assert.ok(gemmaModel, "gemma4:e4b model must exist");
  const result = generateStarterProject({
    model: gemmaModel,
    starterType: "chat",
  });

  assert.strictEqual(result.starterType, "chat");
  assert.strictEqual(result.modelTag, "gemma4:e4b");
  assert.ok(result.projectName.startsWith("hack-day-starter-chat"));

  const filePaths = result.files.map((f) => f.path);
  assert.ok(filePaths.includes("README.md"), "README.md missing");
  assert.ok(filePaths.includes("package.json"), "package.json missing");
  assert.ok(filePaths.includes("tsconfig.json"), "tsconfig.json missing");
  assert.ok(filePaths.includes(".gitignore"), ".gitignore missing");
  assert.ok(filePaths.includes("src/index.ts"), "src/index.ts missing");
  assert.ok(filePaths.includes("src/ollama.ts"), "src/ollama.ts missing");

  // Chat starter must NOT include agent tools
  assert.ok(!filePaths.includes("src/tools/calculator.ts"));
});

// ---------------------------------------------------------------------------
// Test B: Agent starter generation
// ---------------------------------------------------------------------------

test("B: Agent starter generation produces tool-calling file set", () => {
  assert.ok(qwenModel, "qwen3.5:9b model must exist");
  assert.strictEqual(qwenModel.capabilities.tools, true);

  const result = generateStarterProject({
    model: qwenModel,
    starterType: "agent",
  });

  assert.strictEqual(result.starterType, "agent");
  assert.strictEqual(result.modelTag, "qwen3.5:9b");
  assert.ok(result.projectName.startsWith("hack-day-starter-agent"));

  const filePaths = result.files.map((f) => f.path);
  assert.ok(filePaths.includes("README.md"), "README.md missing");
  assert.ok(filePaths.includes("package.json"), "package.json missing");
  assert.ok(filePaths.includes("tsconfig.json"), "tsconfig.json missing");
  assert.ok(filePaths.includes(".gitignore"), ".gitignore missing");
  assert.ok(filePaths.includes("src/index.ts"), "src/index.ts missing");
  assert.ok(filePaths.includes("src/ollama.ts"), "src/ollama.ts missing");
  assert.ok(filePaths.includes("src/tools/calculator.ts"), "src/tools/calculator.ts missing");

  // Verify calculator tool contains executeCalculator function and tool definition
  const calcFile = result.files.find((f) => f.path === "src/tools/calculator.ts")!;
  assert.match(calcFile.content, /export const calculatorTool/);
  assert.match(calcFile.content, /export function executeCalculator/);
});

// ---------------------------------------------------------------------------
// Test C: Exact selected Ollama tag is injected
// ---------------------------------------------------------------------------

test("C: Exact selected Ollama tag is injected into config, code, and README", () => {
  const result = generateStarterProject({
    model: qwenModel,
    starterType: "chat",
  });

  // 1. Model tag in result metadata
  assert.strictEqual(result.modelTag, "qwen3.5:9b");

  // 2. Exact tag injected into src/index.ts
  const indexFile = result.files.find((f) => f.path === "src/index.ts")!;
  assert.ok(
    indexFile.content.includes('"qwen3.5:9b"'),
    "src/index.ts must contain exact model tag literal 'qwen3.5:9b'"
  );

  // 3. Exact tag injected into README.md
  const readmeFile = result.files.find((f) => f.path === "README.md")!;
  assert.ok(
    readmeFile.content.includes("`qwen3.5:9b`"),
    "README.md must specify `qwen3.5:9b`"
  );
  assert.ok(
    readmeFile.content.includes("ollama pull qwen3.5:9b"),
    "README.md must specify 'ollama pull qwen3.5:9b'"
  );
});

// ---------------------------------------------------------------------------
// Test D: README contains exact setup command
// ---------------------------------------------------------------------------

test("D: README contains exact setup commands in sequence", () => {
  const result = generateStarterProject({
    model: gemmaModel,
    starterType: "chat",
  });

  const readme = result.files.find((f) => f.path === "README.md")!.content;
  assert.match(readme, /ollama pull gemma4:e4b/);
  assert.match(readme, /npm install/);
  assert.match(readme, /npm run dev/);
  assert.match(readme, /How to change the model/i);
});

// ---------------------------------------------------------------------------
// Test E: Agent generation rejects a no-tools model
// ---------------------------------------------------------------------------

test("E: Agent generation rejects a no-tools model with exact error message", () => {
  assert.ok(deepseekNoToolsModel, "deepseek-r1:1.5b must exist");
  assert.notStrictEqual(deepseekNoToolsModel.capabilities.tools, true);

  assert.throws(
    () => {
      generateStarterProject({
        model: deepseekNoToolsModel,
        starterType: "agent",
      });
    },
    {
      name: "Error",
      message: "This model does not have verified native tool-calling support.",
    }
  );
});

// ---------------------------------------------------------------------------
// Test F: Generated file paths are valid and parsable
// ---------------------------------------------------------------------------

test("F: Generated file paths are valid relative paths and JSON files parse cleanly", () => {
  const result = generateStarterProject({
    model: gemmaModel,
    starterType: "agent",
  });

  for (const file of result.files) {
    // Valid path checks
    assert.ok(!file.path.startsWith("/"), `File path must not be absolute: ${file.path}`);
    assert.ok(!file.path.includes(".."), `File path must not contain traversal: ${file.path}`);
    assert.ok(file.content.length > 0, `File content must not be empty: ${file.path}`);

    // JSON syntax validation
    if (file.path.endsWith(".json")) {
      assert.doesNotThrow(() => {
        JSON.parse(file.content);
      }, `File ${file.path} must be valid JSON`);
    }
  }
});

// ---------------------------------------------------------------------------
// Test G: Generated project is deterministic
// ---------------------------------------------------------------------------

test("G: Generated project is 100% deterministic across multiple runs", () => {
  // Run 1 & Run 2 for Chat
  const chat1 = generateStarterProject({ model: gemmaModel, starterType: "chat" });
  const chat2 = generateStarterProject({ model: gemmaModel, starterType: "chat" });

  assert.strictEqual(chat1.files.length, chat2.files.length);
  for (let i = 0; i < chat1.files.length; i++) {
    assert.strictEqual(chat1.files[i].path, chat2.files[i].path);
    assert.strictEqual(chat1.files[i].content, chat2.files[i].content);
  }

  // Run 1 & Run 2 for Agent
  const agent1 = generateStarterProject({ model: qwenModel, starterType: "agent" });
  const agent2 = generateStarterProject({ model: qwenModel, starterType: "agent" });

  assert.strictEqual(agent1.files.length, agent2.files.length);
  for (let i = 0; i < agent1.files.length; i++) {
    assert.strictEqual(agent1.files[i].path, agent2.files[i].path);
    assert.strictEqual(agent1.files[i].content, agent2.files[i].content);
  }
});

// ---------------------------------------------------------------------------
// Test H: Registry validation gates arbitrary/malicious models
// ---------------------------------------------------------------------------

test("H: Retired, unverified, or arbitrary models cannot bypass safety gates", () => {
  // 1. Arbitrary model not in registry
  const unknownModel: ModelEntry = {
    id: "fake-model",
    family: "unknown" as any,
    displayName: "Fake Model",
    provider: "Unknown",
    ollamaTag: "fake:latest",
    displayDigest: null,
    fullManifestDigest: null,
    ollamaUrl: "https://ollama.com/library/fake",
    sourceUrl: "https://example.com",
    license: "MIT",
    parameterCount: "7B",
    activeParameterCount: null,
    quantization: "Q4_0",
    sourceDisplaySize: "4GB",
    normalizedApproxSizeGb: 4.0,
    exactManifestSizeBytes: null,
    contextTokens: 4096,
    capabilities: { tools: false, vision: false, audio: null, thinking: false },
    localSupport: true,
    lifecycle: "current",
    verificationStatus: "unverified",
    verifiedAt: new Date().toISOString(),
    sourceObservedAt: new Date().toISOString(),
    observationProvenance: "regression-fixture",
    officialInferenceMemory: null,
    officialSystemMemoryGuidance: null,
    estimatedSystemMemoryComfort: null,
    strengths: ["chat"],
    gpuBenefit: false,
    description: "Fake model",
  };

  // Agent generation on fake model must fail tool check
  assert.throws(
    () => {
      generateStarterProject({ model: unknownModel, starterType: "agent" });
    },
    /does not have verified native tool-calling support/
  );

  // 2. Retired model check
  assert.ok(retiredModel, "llama2:7b must exist");
  assert.strictEqual(retiredModel.lifecycle, "retired");
});

// ---------------------------------------------------------------------------
// Test I: Runtime readline API safety regression test
// ---------------------------------------------------------------------------

test("I: Generated templates do not access invalid readline.clearLine or cursorTo", () => {
  const agentProj = generateStarterProject({ model: gemmaModel, starterType: "agent" });
  const chatProj = generateStarterProject({ model: gemmaModel, starterType: "chat" });

  const agentIndex = agentProj.files.find((f) => f.path === "src/index.ts")!.content;
  const chatIndex = chatProj.files.find((f) => f.path === "src/index.ts")!.content;

  // 1. Must NOT contain clearLine or cursorTo which fail on node:readline/promises
  assert.strictEqual(
    agentIndex.includes("clearLine"),
    false,
    "agent src/index.ts must not call clearLine"
  );
  assert.strictEqual(
    agentIndex.includes("cursorTo"),
    false,
    "agent src/index.ts must not call cursorTo"
  );
  assert.strictEqual(
    chatIndex.includes("clearLine"),
    false,
    "chat src/index.ts must not call clearLine"
  );
  assert.strictEqual(
    chatIndex.includes("cursorTo"),
    false,
    "chat src/index.ts must not call cursorTo"
  );

  // 2. Must import createInterface cleanly from node:readline/promises
  assert.match(
    agentIndex,
    /import\s*\{\s*createInterface\s*\}\s*from\s*"node:readline\/promises"/,
    "agent src/index.ts must import createInterface from node:readline/promises"
  );
  assert.match(
    chatIndex,
    /import\s*\{\s*createInterface\s*\}\s*from\s*"node:readline\/promises"/,
    "chat src/index.ts must import createInterface from node:readline/promises"
  );
});

// ---------------------------------------------------------------------------
// Test J: Calculator tool security and arithmetic correctness audit
// ---------------------------------------------------------------------------

test("J: Calculator tool security audit — zero eval, zero Function, strict validation, correct arithmetic", async () => {
  const agentProj = generateStarterProject({ model: gemmaModel, starterType: "agent" });
  const calcFile = agentProj.files.find((f) => f.path === "src/tools/calculator.ts")!;
  assert.ok(calcFile, "src/tools/calculator.ts must exist");

  // 1. Static Security Invariant Audit
  const codeWithoutComments = calcFile.content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
  assert.strictEqual(
    /\beval\s*\(/.test(codeWithoutComments),
    false,
    "calculator.ts MUST NOT call eval()"
  );
  assert.strictEqual(
    /\bFunction\s*\(/.test(codeWithoutComments),
    false,
    "calculator.ts MUST NOT construct new Function()"
  );
  assert.strictEqual(
    codeWithoutComments.includes("child_process"),
    false,
    "calculator.ts MUST NOT reference child_process"
  );
  assert.strictEqual(
    codeWithoutComments.includes("exec("),
    false,
    "calculator.ts MUST NOT reference exec"
  );
  assert.strictEqual(
    codeWithoutComments.includes("__proto__"),
    false,
    "calculator.ts MUST NOT reference __proto__"
  );

  // 2. Dynamic Execution & Correctness
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "calc-audit-"));
  const tmpFile = path.join(tmpDir, "calculator.ts");
  fs.writeFileSync(tmpFile, calcFile.content);

  try {
    const { executeCalculator } = await import(tmpFile);

    // Valid calculations
    assert.strictEqual(
      executeCalculator({ expression: "(342 * 19) / 4" }),
      "1624.5"
    );
    assert.strictEqual(executeCalculator({ expression: "2 ^ 10" }), "1024");
    assert.strictEqual(executeCalculator({ expression: "100 % 7" }), "2");
    assert.strictEqual(executeCalculator({ expression: "(10 + 5) * -2" }), "-30");
    assert.strictEqual(executeCalculator({ expression: "12.5 + 3.75" }), "16.25");

    // Division by zero
    const divZero = executeCalculator({ expression: "10 / 0" });
    assert.match(divZero, /Division by zero/i);

    // Injection attack payloads — MUST be rejected without execution
    const maliciousPayloads = [
      "process.exit(1)",
      "require('fs')",
      "console.log('pwned')",
      "globalThis",
      "__proto__",
      "eval('1+1')",
      "(() => 42)()",
      "1; alert(1)",
      "/* comment */ 42",
      "constructor",
    ];

    for (const payload of maliciousPayloads) {
      const output = executeCalculator({ expression: payload });
      assert.ok(
        output.startsWith("Error"),
        `Malicious payload '${payload}' was not safely rejected: ${output}`
      );
    }

    // Resilience against missing or malformed arguments
    assert.strictEqual(
      executeCalculator(undefined as any),
      "Error: Missing expression argument."
    );
    assert.strictEqual(
      executeCalculator({} as any),
      "Error: Missing expression argument."
    );
    assert.strictEqual(
      executeCalculator({ expression: "" }),
      "Error: Missing expression argument."
    );
    assert.strictEqual(
      executeCalculator({ expression: "   " }),
      "Error: Invalid characters in mathematical expression '   '."
    );

    // Malformed syntax
    const unclosedParen = executeCalculator({ expression: "(1 + 2" });
    assert.match(unclosedParen, /Missing closing parenthesis/i);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Test K: Starter API route security audit — rejection of arbitrary/unverified models
// ---------------------------------------------------------------------------

test("K: Starter API route enforces strict model safety and capability verification", async () => {
  // 1. Arbitrary unverified model tag MUST be rejected with 404
  const arbitraryReq = new NextRequest("http://localhost:3000/api/starter", {
    method: "POST",
    body: JSON.stringify({
      modelId: "malicious-arbitrary-model:latest",
      starterType: "agent",
    }),
  });
  const res1 = await POST(arbitraryReq);
  assert.strictEqual(res1.status, 404);
  const data1 = await res1.json();
  assert.strictEqual(data1.success, false);
  assert.match(data1.error, /not found in verified registry/i);

  // 2. Verified model without tool support MUST be rejected for agent with 400
  const noToolsReq = new NextRequest("http://localhost:3000/api/starter", {
    method: "POST",
    body: JSON.stringify({
      modelId: "deepseek-r1:1.5b",
      starterType: "agent",
    }),
  });
  const res2 = await POST(noToolsReq);
  assert.strictEqual(res2.status, 400);
  const data2 = await res2.json();
  assert.strictEqual(data2.success, false);
  assert.match(data2.error, /does not have verified native tool-calling support/i);

  // 3. Retired model MUST be rejected with 400
  const retiredReq = new NextRequest("http://localhost:3000/api/starter", {
    method: "POST",
    body: JSON.stringify({
      modelId: "llama2:7b",
      starterType: "chat",
    }),
  });
  const res3 = await POST(retiredReq);
  assert.strictEqual(res3.status, 400);
  const data3 = await res3.json();
  assert.strictEqual(data3.success, false);
  assert.match(data3.error, /retired/i);

  // 4. Valid verified model with tool support succeeds with 200 and exact tag
  const validReq = new NextRequest("http://localhost:3000/api/starter", {
    method: "POST",
    body: JSON.stringify({
      modelId: "gemma4:12b",
      starterType: "agent",
    }),
  });
  const res4 = await POST(validReq);
  assert.strictEqual(res4.status, 200);
  const data4 = await res4.json();
  assert.strictEqual(data4.success, true);
  assert.strictEqual(data4.result.modelTag, "gemma4:12b");
  assert.strictEqual(data4.result.starterType, "agent");
  assert.ok(data4.result.files.some((f: any) => f.path === "src/tools/calculator.ts"));
});

