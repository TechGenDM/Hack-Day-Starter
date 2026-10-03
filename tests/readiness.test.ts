/**
 * Phase 8 — Ollama / model readiness UX (generated starter runtime).
 *
 * These tests generate real starter projects, write them to a temp directory,
 * and run the generated `src/index.ts` against a fake local Ollama HTTP server.
 *
 * Covered:
 *  - Ollama unavailable (no raw ECONNREFUSED / stack trace)
 *  - Ollama available + model missing (exact `ollama pull <tag>`)
 *  - Ollama available + model available
 *  - exact selected model tag is used (no near-match, no substitution)
 *  - existing tool-calling behavior unchanged (Agent)
 *  - existing chat behavior unchanged (Chat)
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { AddressInfo } from "node:net";

import { VERIFIED_MODEL_REGISTRY } from "../lib/registry";
import { generateStarterProject } from "../lib/starter/generate";
import { StarterType } from "../lib/types";

const TSX_BIN = path.resolve(process.cwd(), "node_modules", ".bin", "tsx");
const OLLAMA_DOWNLOAD_URL = "https://ollama.com/download";

const chatModel = VERIFIED_MODEL_REGISTRY.find((m) => m.ollamaTag === "qwen3.5:9b")!;
const agentModel = VERIFIED_MODEL_REGISTRY.find((m) => m.ollamaTag === "gemma4:12b")!;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface FakeOllama {
  url: string;
  chatRequests: any[];
  tagsRequests: number;
  close: () => Promise<void>;
}

/**
 * Minimal fake Ollama. `/api/chat` behaviour is supplied per test.
 */
async function startFakeOllama(
  installedModels: string[],
  onChat?: (body: any, count: number) => object
): Promise<FakeOllama> {
  const state = { chatRequests: [] as any[], tagsRequests: 0 };
  const server = http.createServer((req, res) => {
    if (req.method === "GET" && req.url === "/api/tags") {
      state.tagsRequests++;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ models: installedModels.map((name) => ({ name, model: name })) }));
      return;
    }
    if (req.method === "POST" && req.url === "/api/chat") {
      let raw = "";
      req.on("data", (c) => (raw += c));
      req.on("end", () => {
        const body = JSON.parse(raw);
        state.chatRequests.push(body);
        const payload = onChat
          ? onChat(body, state.chatRequests.length)
          : { message: { role: "assistant", content: "unexpected" }, done: true };
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(payload));
      });
      return;
    }
    res.statusCode = 404;
    res.end();
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as AddressInfo).port;
  return {
    url: "http://127.0.0.1:" + port,
    get chatRequests() {
      return state.chatRequests;
    },
    get tagsRequests() {
      return state.tagsRequests;
    },
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  } as FakeOllama;
}

/** Returns a localhost URL that nothing is listening on. */
async function getClosedPortUrl(): Promise<string> {
  const server = http.createServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as AddressInfo).port;
  await new Promise<void>((resolve) => server.close(() => resolve()));
  return "http://127.0.0.1:" + port;
}

function writeStarter(model: typeof chatModel, starterType: StarterType): string {
  const result = generateStarterProject({ model, starterType });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hds-readiness-"));
  for (const file of result.files) {
    const target = path.join(dir, file.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, file.content);
  }
  return dir;
}

interface RunResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

/** Runs the generated src/index.ts, feeding `stdin` then closing it (EOF). */
function runStarter(dir: string, host: string, stdin = ""): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, OLLAMA_HOST: host } as NodeJS.ProcessEnv;
    delete env.OLLAMA_MODEL;
    const child = spawn(TSX_BIN, ["src/index.ts"], { cwd: dir, env });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("generated starter timed out\nstdout:\n" + stdout + "\nstderr:\n" + stderr));
    }, 30000);
    child.stdout.on("data", (c) => (stdout += c));
    child.stderr.on("data", (c) => (stderr += c));
    child.on("error", reject);
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
    child.stdin.end(stdin);
  });
}

function cleanup(dir: string) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function assertNoRawNetworkError(out: RunResult) {
  const all = out.stdout + out.stderr;
  assert.ok(!/ECONNREFUSED/.test(all), "must not leak ECONNREFUSED:\n" + all);
  assert.ok(!/TypeError: fetch failed/.test(all), "must not leak fetch failure:\n" + all);
  assert.ok(!/Fatal error/.test(all), "must not crash with Fatal error:\n" + all);
  assert.ok(!/\n\s+at .*\(.*:\d+:\d+\)/.test(all), "must not print a stack trace:\n" + all);
}

// ---------------------------------------------------------------------------
// Generated file set
// ---------------------------------------------------------------------------

test("R1: Both starter types ship the readiness module and use it in index.ts", () => {
  for (const [model, type] of [
    [chatModel, "chat"],
    [agentModel, "agent"],
  ] as const) {
    const result = generateStarterProject({ model, starterType: type });
    const paths = result.files.map((f) => f.path);
    assert.ok(paths.includes("src/readiness.ts"), type + ": src/readiness.ts missing");

    const readiness = result.files.find((f) => f.path === "src/readiness.ts")!.content;
    assert.ok(readiness.includes(OLLAMA_DOWNLOAD_URL), type + ": download URL missing");

    const index = result.files.find((f) => f.path === "src/index.ts")!.content;
    assert.match(index, /import \{ ensureOllamaReady \} from "\.\/readiness\.js"/);
    assert.match(index, /ensureOllamaReady\(OLLAMA_HOST, MODEL_TAG\)/);

    // Standalone: still zero runtime dependencies
    const pkg = JSON.parse(result.files.find((f) => f.path === "package.json")!.content);
    assert.strictEqual(pkg.dependencies, undefined, type + ": must have no runtime deps");
  }
});

// ---------------------------------------------------------------------------
// Ollama unavailable
// ---------------------------------------------------------------------------

for (const [model, type] of [
  [chatModel, "chat"],
  [agentModel, "agent"],
] as const) {
  test(`R2 (${type}): Ollama unavailable → friendly message, download URL, no raw error`, async () => {
    const dir = writeStarter(model, type);
    try {
      const host = await getClosedPortUrl();
      const out = await runStarter(dir, host, "hello\n");

      assert.strictEqual(out.code, 1, "must exit non-zero when Ollama is unreachable");
      assertNoRawNetworkError(out);
      assert.match(out.stderr, /Ollama is not reachable at /);
      assert.ok(out.stderr.includes(host), "message must show configured host");
      assert.ok(out.stderr.includes(OLLAMA_DOWNLOAD_URL), "must include official download URL");
      assert.match(out.stderr, /ollama serve/);
      assert.match(out.stderr, /Restart this project: npm run dev/);
    } finally {
      cleanup(dir);
    }
  });
}

// ---------------------------------------------------------------------------
// Ollama available + model missing  (+ exact tag, no substitution)
// ---------------------------------------------------------------------------

for (const [model, type] of [
  [chatModel, "chat"],
  [agentModel, "agent"],
] as const) {
  test(`R3 (${type}): model missing → exact 'ollama pull ${model.ollamaTag}', no substitution`, async () => {
    const dir = writeStarter(model, type);
    // Near-miss tags and other models must NOT satisfy the exact selected tag.
    const fake = await startFakeOllama([
      model.ollamaTag + "-instruct",
      model.ollamaTag.split(":")[0] + ":other",
      "llama3:8b",
    ]);
    try {
      const out = await runStarter(dir, fake.url, "hello\n");

      assert.strictEqual(out.code, 1);
      assertNoRawNetworkError(out);
      assert.ok(
        out.stderr.includes("the model '" + model.ollamaTag + "' is not installed locally"),
        "must name the exact tag:\n" + out.stderr
      );
      assert.ok(
        out.stderr.includes("ollama pull " + model.ollamaTag),
        "must print exact pull command:\n" + out.stderr
      );
      assert.strictEqual(fake.chatRequests.length, 0, "must not send any model request");
      assert.ok(fake.tagsRequests >= 1, "must have checked /api/tags");
    } finally {
      await fake.close();
      cleanup(dir);
    }
  });
}

// ---------------------------------------------------------------------------
// Ollama available + model available — Chat behavior unchanged
// ---------------------------------------------------------------------------

test("R4: Chat — ready → readiness message, then unchanged chat behavior with exact tag", async () => {
  const dir = writeStarter(chatModel, "chat");
  const fake = await startFakeOllama(["llama3:8b", chatModel.ollamaTag], () => ({
    model: chatModel.ollamaTag,
    message: { role: "assistant", content: "Hello from the fake model." },
    done: true,
  }));
  try {
    const out = await runStarter(dir, fake.url, "Hi there\n");

    assert.strictEqual(out.code, 0, "clean exit on EOF:\n" + out.stdout + out.stderr);
    assertNoRawNetworkError(out);
    assert.ok(
      out.stdout.includes("✅ Ollama is running and model '" + chatModel.ollamaTag + "' is installed."),
      out.stdout
    );
    assert.match(out.stdout, /Hack Day Starter — Local Chat/);
    assert.match(out.stdout, /Assistant: Hello from the fake model\./);

    // Existing chat request contract is unchanged, with the exact verified tag.
    assert.strictEqual(fake.chatRequests.length, 1);
    const req = fake.chatRequests[0];
    assert.strictEqual(req.model, chatModel.ollamaTag);
    assert.strictEqual(req.stream, false);
    assert.deepStrictEqual(req.messages, [{ role: "user", content: "Hi there" }]);
    assert.strictEqual(req.tools, undefined, "chat must not send tools");
  } finally {
    await fake.close();
    cleanup(dir);
  }
});

// ---------------------------------------------------------------------------
// Ollama available + model available — Agent tool-calling unchanged
// ---------------------------------------------------------------------------

test("R5: Agent — ready → unchanged model → calculator tool → result → model loop", async () => {
  const dir = writeStarter(agentModel, "agent");
  const fake = await startFakeOllama([agentModel.ollamaTag], (_body, count) =>
    count === 1
      ? {
          model: agentModel.ollamaTag,
          message: {
            role: "assistant",
            content: "",
            tool_calls: [
              { function: { name: "calculate", arguments: { expression: "(342 * 19) / 4" } } },
            ],
          },
          done: true,
        }
      : {
          model: agentModel.ollamaTag,
          message: { role: "assistant", content: "342 times 19, divided by 4, is 1624.5." },
          done: true,
        }
  );
  try {
    const out = await runStarter(
      dir,
      fake.url,
      "What is 342 multiplied by 19, and then divide by 4?\n"
    );

    assert.strictEqual(out.code, 0, "clean exit on EOF:\n" + out.stdout + out.stderr);
    assertNoRawNetworkError(out);
    assert.ok(
      out.stdout.includes("✅ Ollama is running and model '" + agentModel.ollamaTag + "' is installed.")
    );
    assert.match(out.stdout, /\[Tool Call\] calculate\(\{"expression":"\(342 \* 19\) \/ 4"\}\)/);
    assert.match(out.stdout, /\[Tool Result\] 1624\.5/);
    assert.match(out.stdout, /Agent: 342 times 19, divided by 4, is 1624\.5\./);

    // Two model round-trips with exact tag; tool schema sent; tool result fed back.
    assert.strictEqual(fake.chatRequests.length, 2);
    for (const req of fake.chatRequests) {
      assert.strictEqual(req.model, agentModel.ollamaTag);
      assert.strictEqual(req.stream, false);
      assert.ok(Array.isArray(req.tools) && req.tools[0].function.name === "calculate");
    }
    const toolMsg = fake.chatRequests[1].messages.find((m: any) => m.role === "tool");
    assert.ok(toolMsg, "second request must include the tool result message");
    assert.strictEqual(toolMsg.content, "1624.5");
  } finally {
    await fake.close();
    cleanup(dir);
  }
});

// ---------------------------------------------------------------------------
// Exact tag handling in the readiness module itself
// ---------------------------------------------------------------------------

test("R6: readiness module matches exact tags only (':latest' normalization for bare names)", async () => {
  const dir = writeStarter(chatModel, "chat");
  try {
    const mod = await import(path.join(dir, "src", "readiness.ts"));
    const { isModelTagInstalled } = mod;

    assert.strictEqual(isModelTagInstalled("qwen3.5:9b", ["qwen3.5:9b"]), true);
    assert.strictEqual(isModelTagInstalled("qwen3.5:9b", ["qwen3.5:4b"]), false);
    assert.strictEqual(isModelTagInstalled("qwen3.5:9b", ["qwen3.5:9b-q8_0"]), false);
    assert.strictEqual(isModelTagInstalled("qwen3.5:9b", ["qwen3.5"]), false);
    assert.strictEqual(isModelTagInstalled("phi4-mini", ["phi4-mini:latest"]), true);
    assert.strictEqual(isModelTagInstalled("phi4-mini", ["phi4:latest"]), false);
    assert.strictEqual(isModelTagInstalled("gemma4:12b", []), false);
  } finally {
    cleanup(dir);
  }
});
