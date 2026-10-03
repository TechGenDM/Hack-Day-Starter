# 🚀 Hack Day Starter

**Hacktoberfest 2026 — Weekend Challenge: Build for a Friend**

> Stop wasting the first 2–3 hours of your hack day choosing an open-weight model, fighting out-of-memory errors, and fixing environment problems. Hack Day Starter profiles your machine, recommends a verified local model that actually runs comfortably on your hardware, and generates an immediate, production-ready TypeScript starter project.

---

## The Real Problem: "Build for a Friend"

During hack days and weekend builds, developers wanting to build with local open-weight AI face recurring bottlenecks:
- **Guesswork on Model Sizing:** Downloading a 14 GB or 20 GB model only to discover it exceeds system RAM, swaps to disk, or runs at an unusable 0.5 tokens/second.
- **Outdated Model Information:** Relying on stale model recommendations when modern architectures (such as Gemma 4, Qwen 3.5, and GPT-OSS) offer superior speed, context windows, and native tool-calling capabilities.
- **Disk Space Blindspots:** Failing to account for free SSD headroom before kicking off multi-gigabyte downloads.
- **Boilerplate & Environment Friction:** Spending hours wiring up Ollama API clients, handling streaming, setting up function calling loops, or dealing with fragile CLI progress code.

**Hack Day Starter** was built to solve this exact problem for a friend:
1. Enter your laptop's physical specifications (RAM, GPU acceleration, OS, and free disk space).
2. Receive a transparent, deterministic recommendation scored for your hardware and use case.
3. Select your project archetype (**Local Chat** or **Tool-calling Agent**).
4. Download a pre-configured, zero-runtime-dependency TypeScript project with the exact verified model tag injected, ready to run with `npm run dev`.

---

## System Architecture

```text
               ┌───────────────────────────────────────────────┐
               │         Developer Laptop Specifications       │
               │  • RAM (GB)      • GPU (Apple / NVIDIA / CPU) │
               │  • Operating OS  • Free Disk Space Headroom   │
               └───────────────────────┬───────────────────────┘
                                       │
                                       ▼
               ┌───────────────────────────────────────────────┐
               │             Hack Day Starter (App)            │
               │  • Deterministic hardware compatibility       │
               │  • Verified Model Registry (Oct 2026 data)    │
               │  • Authoritative vs Estimated memory guidance │
               │  • Free disk space safety gate                │
               └───────────────────────┬───────────────────────┘
                                       │
                                       ▼
               ┌───────────────────────────────────────────────┐
               │           Verified Model Selection            │
               │  • Exact Ollama tag (e.g. gemma4:12b)         │
               │  • Verified native capabilities (tools/vision)│
               │  • Starter type: Local Chat vs Agent          │
               └───────────────────────┬───────────────────────┘
                                       │
                                       ▼
               ┌───────────────────────────────────────────────┐
               │      Generated Starter Project (ZIP)          │
               │  • Zero runtime dependencies (native fetch)   │
               │  • Direct /api/chat client                    │
               │  • Safe recursive-descent math tool           │
               │  • Deterministic in-memory generation         │
               └───────────────────────┬───────────────────────┘
                                       │
                                       ▼
               ┌───────────────────────────────────────────────┐
               │          Local Ollama Runtime Daemon          │
               │             http://localhost:11434            │
               └───────────────────────┬───────────────────────┘
                                       │
                                       ▼
               ┌───────────────────────────────────────────────┐
               │          Open-Weight Model Weights            │
               │         gemma4:12b / qwen3.5:9b / ...         │
               └───────────────────────┬───────────────────────┘
                                       │
                         ┌─────────────┴─────────────┐
                         ▼                           ▼
                 Direct Response            Tool Call Execution
                                            (src/tools/calculator.ts)
                                                     │
                                                     ▼
                                            Synthesized Result
```

### Component Roles & Boundaries

| Component | Role | What It Does / Does Not Do |
| --- | --- | --- |
| **Ollama** | Local Runtime Daemon | Runs locally on `http://localhost:11434`. Pulls weights and executes inference on your CPU/GPU. |
| **Open-Weight Models** | Intelligence Layer | Neural network model weights (e.g. `gemma4:12b`, `qwen3.5:9b`) executed by Ollama. |
| **Hack Day Starter** | Generator & Bootstrapper | Next.js application that profiles hardware, ranks models, and generates starter ZIPs in-memory. Does **not** execute inference itself. |
| **Generated Project** | Developer Project | Clean, standalone TypeScript/Node.js project extracted from the downloaded ZIP and run directly by the developer. |

---

## Starter Archetypes

### 1. Local Chat (`hack-day-starter-chat-<model>`)
- **Use Case:** Interactive conversational assistants, prompt prototyping, multi-turn reasoning.
- **Features:** 
  - Zero runtime dependencies (uses native Node.js 18+ `fetch`).
  - Terminal-based interactive conversation with full multi-turn context history.
  - Connection check to local Ollama daemon on startup with clear error diagnostics.
  - Model installation check with helpful `ollama pull` reminder if weights are missing.
  - Clean stream EOF and graceful shutdown on `exit` or `Ctrl+C`.

### 2. Tool-Calling Agent (`hack-day-starter-agent-<model>`)
- **Use Case:** Autonomous agents, calculation workflows, structured tool calling.
- **Gating:** Requires verified native tool-calling support (`model.capabilities.tools === true`). Models lacking tool support are disabled in the UI and rejected by the API.
- **Features:**
  - Real autonomous execution loop: Model produces `tool_calls` -> Local tool runs -> Result returned as `role: "tool"` -> Model synthesizes final response.
  - Built-in safe `calculator` tool powered by a pure recursive-descent parser (zero `eval()`, zero `new Function()`).
  - Extensible tool registration pattern in `src/tools/` using standard JSON Schema.

---

## Real End-to-End Runtime Execution: Gemma 4 12B

The generated Tool-calling Agent starter has been tested end-to-end against local Ollama running `gemma4:12b`:

```text
$ npm run dev

=================================================
🤖 Hack Day Starter — Tool-Calling Agent
🎯 Model: gemma4:12b (Native Tool-Calling Verified)
🛠️  Active Tools: [calculate]
📡 Ollama Host: http://localhost:11434
=================================================

✨ Agent ready! Try asking complex calculations or math problems:
Example: 'What is 342 multiplied by 19, and then divide by 4?'
Type 'exit' or press Ctrl+C to quit.

User: What is 342 multiplied by 19, and then divide by 4?
Agent: Thinking...
⚙️  [Tool Call] calculate({"expression":"(342 * 19) / 4"})
📋 [Tool Result] 1624.5
Agent: Thinking...
Agent: 342 multiplied by 19, divided by 4, equals 1624.5.
```

### What Happened Behind the Scenes:
1. **User Request:** User provided a multi-step arithmetic prompt.
2. **Intent & Function Calling:** `gemma4:12b` analyzed the request and emitted a structured tool call: `calculate({"expression": "(342 * 19) / 4"})`.
3. **Local Tool Execution:** `src/tools/calculator.ts` safely parsed and evaluated the expression, returning `1624.5`.
4. **Context Injection:** The tool result was appended to the conversation history as `{ role: "tool", content: "1624.5" }`.
5. **Synthesis:** Ollama received the conversation history and the model produced the final natural language answer.

---

## Verified Model Registry (as of October 2, 2026)

Models are evaluated against verified public artifacts on Ollama:

| Model | Provider | Tag | Listed Size | Context | Tools | Memory Guidance |
| --- | --- | --- | --- | --- | --- | --- |
| **Gemma 4 12B** | Google | `gemma4:12b` | 7.7GB | 256k | ✓ | Official: 16 GB |
| **Gemma 4 e4b** | Google | `gemma4:e4b` | 6.6GB | 128k | ✓ | Official: 8 GB |
| **Qwen 3.5 9B** | Alibaba | `qwen3.5:9b` | 6.6GB | 256k | ✓ | Estimated: ~10 GB |
| **Qwen 3.5 4B** | Alibaba | `qwen3.5:4b` | 3.4GB | 256k | ✓ | Estimated: ~5.5 GB |
| **Qwen 3.8 27B** | Alibaba | `qwen3.8:27b` | 18GB | 256k | ✓ | Estimated: ~26 GB |
| **Qwen 3.6 27B** | Alibaba | `qwen3.6:27b` | 18GB | 256k | ✓ | Estimated: ~26 GB |
| **Qwen 3.6 35B** | Alibaba | `qwen3.6:35b` | 23GB | 256k | ✓ | Estimated: ~32 GB |
| **Qwen 3 8B** | Alibaba | `qwen3:8b` | 5.2GB | 40k | ✓ | Estimated: ~8 GB |
| **GPT-OSS 20B** | Community | `gpt-oss:20b` | 14GB | 128k | ✓ | Estimated: ~20 GB |
| **Phi-4 Mini** | Microsoft | `phi4-mini` | 2.5GB | 128k | ✓ | Estimated: ~4 GB |
| **Nemotron 3 Nano 4B** | NVIDIA | `nemotron-3-nano:4b` | 2.8GB | 256k | ✓ | Estimated: ~4.5 GB |
| **Qwen 3 Coder Next** | Alibaba | `qwen3-coder-next:latest` | 52GB | 256k | ✓ | Estimated: ~64 GB |
| **DeepSeek R1 1.5B** | DeepSeek | `deepseek-r1:1.5b` | 1.1GB | 128k | ✕ | Estimated: ~2.5 GB |
| *Gemma 3 12B* | Google | `gemma3:12b` | 8.1GB | 128k | ✓ | *Legacy (Gemma 4 preferred)* |
| *Llama 2 7B* | Meta | `llama2:7b` | 3.8GB | 4k | ✕ | *Retired (filtered)* |

---

## Security & Verification Standards

1. **No Arbitrary Model Tags:** The generation API (`POST /api/starter`) only accepts models registered in `VERIFIED_MODEL_REGISTRY`. Arbitrary, unverified, or rogue model strings are rejected with HTTP 404.
2. **Strict Tool-Calling Verification:** Starter generation enforces `model.capabilities.tools === true` for agent projects. Models without verified tool calling are rejected with HTTP 400.
3. **No Arbitrary JavaScript Execution:** `src/tools/calculator.ts` strictly rejects any input containing non-arithmetic characters. It never invokes `eval()`, `new Function()`, child processes, or filesystem APIs.
4. **Deterministic Generation:** Identical model parameters and starter types produce 100% byte-identical project files without relying on nondeterministic LLM APIs.
5. **Zero External API Keys:** No accounts, passwords, closed-API keys, or telemetry tracking required.

---

## Quickstart

### 1. Running the Hack Day Starter Web App

```bash
# Clone the repository
git clone https://github.com/TechGenDM/hack-day-starter.git
cd hack-day-starter

# Install dependencies
npm install

# Run the test suite (25 automated unit & integration tests)
npm test

# Start the application
npm run dev

# Open http://localhost:3000 in your browser
```

### 2. Running a Generated Starter Project

After generating and downloading your starter ZIP:

```bash
# 1. Unzip the project
unzip hack-day-starter-agent-gemma4.zip -d hack-day-starter-agent-gemma4
cd hack-day-starter-agent-gemma4

# 2. Ensure Ollama is running and download the model
ollama pull gemma4:12b

# 3. Install project dev dependencies
npm install

# 4. Start the agent CLI
npm run dev
```

---

## Project Structure

```
├── app/
│   ├── api/recommend/route.ts      # Hardware scoring & model recommendation API
│   ├── api/starter/route.ts        # Starter generation & model safety gating API
│   ├── globals.css                 # Dark theme & select styling
│   ├── layout.tsx                  # Root layout & SEO metadata
│   └── page.tsx                    # Hardware profiler, model picker & ZIP downloader
├── lib/
│   ├── types.ts                    # Core TypeScript interfaces & registry schemas
│   ├── registry.ts                 # Curated Verified Model Registry
│   ├── memory-calculator.ts        # Authoritative vs estimated memory heuristics
│   ├── recommend.ts                # Deterministic recommendation scoring engine
│   ├── sources/
│   │   └── ollama.ts               # Ollama library observation scraper & parser
│   └── starter/
│       ├── types.ts                # Starter project types
│       ├── generate.ts             # In-memory deterministic project generator
│       └── templates/
│           ├── chat.ts             # Zero-dependency Local Chat template
│           ├── agent.ts            # Autonomous Tool-Calling Agent template
│           └── readiness.ts        # Ollama daemon & model readiness check template
├── scripts/
│   └── sync-model-registry.ts      # Automated registry discovery & discrepancy checker
├── tests/
│   ├── recommend.test.ts           # Tests A–N: 14 recommendation & registry tests
│   ├── starter.test.ts             # Tests A–K: 11 starter generation & security tests
│   └── readiness.test.ts           # Tests R1–R6: 8 readiness & runtime integration tests
├── package.json
├── LICENSE                         # MIT License
└── README.md
```

---

## Automated Test Suite

Run all 33 unit, integration, and security tests:

```bash
npm test
```

### Test Coverage Highlights:
- **Recommendation Scenarios (A–N):** Apple Silicon 24GB, CPU-only 8GB, disk space headroom enforcement, legacy/retired model exclusion, tool-calling filtering, and live observation discrepancy detection.
- **Starter Generation & Security (A–K):** Exact model tag injection, valid relative file structures, determinism, agent no-tools gating, readline API safety (no invalid `clearLine`/`cursorTo` calls), static AST security audit (zero `eval`/`Function`), dynamic arithmetic correctness, and API endpoint safety gating.
- **Ollama & Model Readiness (R1–R6):** Friendly actionable diagnostics when Ollama daemon is unreachable, exact model tag check with `ollama pull <model>` instructions, readiness confirmation, and unchanged chat & agent execution loop.

---

## License

[MIT](LICENSE) © 2026 Hack Day Starter Contributors

