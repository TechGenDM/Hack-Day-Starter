import type { Metadata } from "next";
import Link from "next/link";
import { VERIFIED_MODEL_REGISTRY } from "@/lib/registry";
import {
  WrenchIcon,
  CheckIcon,
  AlertTriangleIcon,
  CpuIcon,
  ExternalLinkIcon,
} from "../components/ui/Icons";

export const metadata: Metadata = {
  title: "Building Local Tool-Calling Agents with Ollama & TypeScript",
  description:
    "An architectural guide to building local AI agents using native Ollama tool calling and TypeScript. Covers JSON schema definitions, multi-step execution loops, and AST-safe calculator execution.",
  alternates: {
    canonical: "/ollama-tool-calling",
  },
  openGraph: {
    title: "Building Local Tool-Calling Agents with Ollama & TypeScript",
    description:
      "Master native Ollama function calling in TypeScript: multi-step loops, AST safety, and zero external framework bloat.",
    url: "/ollama-tool-calling",
  },
};

export default function ToolCallingGuidePage() {
  const toolModels = VERIFIED_MODEL_REGISTRY.filter(
    (m) => m.capabilities.tools === true && m.lifecycle === "current"
  );

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-14 space-y-12">
      {/* ---------------------------------------------------------------- */}
      {/* Header */}
      {/* ---------------------------------------------------------------- */}
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
          <span className="w-2 h-2 rounded-full bg-purple-500" aria-hidden="true" />
          <span>Agent Architecture Guide</span>
          <span className="text-neutral-600" aria-hidden="true">•</span>
          <span className="text-neutral-400">TypeScript & Ollama</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-neutral-100">
          Building Local Tool-Calling Agents with Ollama
        </h1>

        <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
          How to implement native function calling and multi-step autonomous agent loops in pure TypeScript without heavyweight agent frameworks.
        </p>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Section 1: The Native Ollama Tool Protocol */}
      {/* ---------------------------------------------------------------- */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-100">
          1. How Native Tool Calling Works in Ollama
        </h2>
        <div className="text-xs sm:text-sm text-neutral-300 leading-relaxed space-y-3">
          <p>
            Unlike early prompt-engineering approaches where models were asked to format outputs as markdown code blocks, modern open-weight models (Qwen 3.5, Gemma 4, Llama 3.1) support <strong>native function calling</strong> directly via Ollama’s <code className="text-neutral-200 bg-neutral-900 px-1.5 py-0.5 rounded font-mono">/api/chat</code> endpoint.
          </p>
          <p>
            When you pass a <code className="text-neutral-200 bg-neutral-900 px-1.5 py-0.5 rounded font-mono">tools</code> array containing standard JSON Schema definitions, Ollama utilizes grammar-constrained decoding to force the model to output syntactically valid function parameters.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Section 2: The Agentic Execution Loop */}
      {/* ---------------------------------------------------------------- */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-100">
          2. The Multi-Step Agent Loop Architecture
        </h2>
        <div className="p-5 sm:p-6 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-4">
          <div className="font-mono text-xs text-neutral-300 bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-2 overflow-x-auto">
            <div className="text-emerald-400 font-semibold">// 1. User submits task</div>
            <div>messages = [{`{ role: "user", content: "What is 482 * 19.5?" }`}]</div>
            <div className="text-neutral-500">{"               ↓"}</div>
            <div className="text-sky-400 font-semibold">// 2. Ollama evaluates available tools</div>
            <div>POST /api/chat with {`{ model, messages, tools: [calculatorTool] }`}</div>
            <div className="text-neutral-500">{"               ↓"}</div>
            <div className="text-purple-400 font-semibold">// 3. Model requests tool call</div>
            <div>response.tool_calls = [{`{ function: { name: "calculate", arguments: { expr: "482 * 19.5" } } }`}]</div>
            <div className="text-neutral-500">{"               ↓"}</div>
            <div className="text-amber-400 font-semibold">// 4. Client executes function locally</div>
            <div>result = executeCalculator("482 * 19.5") // 9399</div>
            <div className="text-neutral-500">{"               ↓"}</div>
            <div className="text-emerald-400 font-semibold">// 5. Result appended with role: "tool"</div>
            <div>messages.push({`{ role: "tool", content: "9399" }`})</div>
            <div className="text-neutral-500">{"               ↓"}</div>
            <div className="text-sky-400 font-semibold">// 6. Model synthesizes final human response</div>
            <div>&quot;482 multiplied by 19.5 equals 9,399.&quot;</div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Section 3: Safe Execution vs eval() */}
      {/* ---------------------------------------------------------------- */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-100">
          3. Security: The Dangers of eval() in Local Agents
        </h2>
        <div className="text-xs sm:text-sm text-neutral-300 leading-relaxed space-y-3">
          <p>
            Many naive tutorials evaluate math expressions or code emitted by LLMs using JavaScript’s <code className="text-red-400 font-mono">eval()</code> or <code className="text-red-400 font-mono">new Function()</code>. This creates critical <strong>Remote Code Execution (RCE)</strong> vulnerabilities if prompt injection or untrusted inputs manipulate the model into executing arbitrary system commands.
          </p>

          <div className="p-4 rounded-xl bg-red-950/20 border border-red-800/40 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
              <AlertTriangleIcon className="w-4 h-4 shrink-0" />
              <span>Insecure Pattern (Never Do This):</span>
            </div>
            <pre className="font-mono text-xs text-red-300 bg-neutral-950 p-2.5 rounded border border-red-900/40">
              {`// DANGEROUS: Arbitrary code execution vulnerability\nconst answer = eval(toolCall.arguments.expression);`}
            </pre>
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <CheckIcon className="w-4 h-4 shrink-0" />
              <span>Hack Day Starter Approach (AST / Recursive-Descent):</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Hack Day Starter’s generated agent templates implement a pure recursive-descent math tokenizer that only parses numbers, parentheses, and arithmetic operators (<code className="text-neutral-200">+</code>, <code className="text-neutral-200">-</code>, <code className="text-neutral-200">*</code>, <code className="text-neutral-200">/</code>, <code className="text-neutral-200">^</code>, <code className="text-neutral-200">%</code>). Zero eval, zero Function constructors, 100% auditable.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Section 4: Verified Tool-Calling Models */}
      {/* ---------------------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-neutral-800 pb-3">
          <h2 className="text-lg sm:text-xl font-bold text-neutral-100">
            Verified Tool-Calling Models ({toolModels.length})
          </h2>
          <span className="text-xs text-neutral-400">
            Current open-weight models with verified function calling
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {toolModels.map((m) => (
            <div
              key={m.id}
              className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-200">{m.displayName}</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-800/40 font-mono">
                  {m.parameterCount}
                </span>
              </div>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                {m.description}
              </p>
              <code className="text-emerald-400 block font-mono bg-neutral-950 p-2 rounded border border-neutral-800">
                ollama pull {m.ollamaTag}
              </code>
            </div>
          ))}
        </div>
      </section>

      {/* Navigation Footer */}
      <div className="pt-6 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <Link
          href="/"
          className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
        >
          ← Back to Hardware Profiler
        </Link>
        <Link
          href="/how-it-works"
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
        >
          Deterministic Sizing Logic →
        </Link>
      </div>
    </main>
  );
}
