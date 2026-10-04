# 🚀 Hack Day Starter — Run Local AI Models on Any Laptop or PC

[![Tests](https://img.shields.io/badge/tests-36%2F36%20passing-brightgreen.svg)](tests/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B%20(Native%20Fetch)-success.svg)](https://nodejs.org/)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20Inference-black.svg)](https://ollama.com)
[![License](https://img.shields.io/badge/license-MIT-purple.svg)](LICENSE)
[![Hacktoberfest 2026](https://img.shields.io/badge/Hacktoberfest-2026%20Weekend%20Challenge-orange.svg)](https://github.com/TechGenDM/hack-day-starter)

> **Hardware-aware local model recommender and zero-dependency TypeScript starters for Ollama.**  
> Built for the **Hacktoberfest 2026 "Build for a Friend" Weekend Challenge**, **Hack Day Starter** profiles your hardware (RAM, GPU, CPU, SSD headroom), matches your machine with a verified open-weight AI model fitted to your system memory and compute limits, and generates an immediate, production-ready TypeScript project with **zero runtime dependencies**.

---

## 📚 Technical Documentation & Guides

- 📖 **[Verified Model Registry](https://hack-day-starter.vercel.app/model-registry):** All 23 tracked entries with exact manifest byte sizes, context token windows, lifecycle states, and verified capabilities.
- ⚡ **[Ollama Hardware Requirements Guide](https://hack-day-starter.vercel.app/ollama-hardware-guide):** In-depth engineering analysis of Apple Silicon Metal, NVIDIA CUDA VRAM, CPU bottlenecks, and KV cache calculations.
- 🛠️ **[Building Local Tool-Calling Agents](https://hack-day-starter.vercel.app/ollama-tool-calling):** Native Ollama tool calling, multi-step agent loops, AST arithmetic security, and verified models.
- ⚙️ **[Deterministic Sizing Logic](https://hack-day-starter.vercel.app/how-it-works):** Mathematical scoring breakdown, binary safety gates, and 1.5 GB buffer policy.

---

## ⚡ Quick Answer: How to Run a Local AI Model on Your Device

If you are asking *"How do I run an open-source AI model locally on my computer?"*, here is the 3-step process:

1. **Install Ollama** (the local AI runtime):
   ```bash
   # macOS / Linux
   curl -fsSL https://ollama.com/install.sh | sh
   # Windows: Download installer from https://ollama.com/download
   ```
2. **Match the right model to your RAM**:
   - **8 GB RAM:** Run `phi4-mini` (2.5 GB) or `qwen3.5:4b` (3.4 GB)
   - **16 GB RAM:** Run `gemma4:e4b` (6.6 GB) or `qwen3.5:9b` (6.6 GB) or `gemma4:12b` (7.7 GB)
   - **24 GB – 32 GB RAM:** Run `gemma4:12b` (with 256K context) or `qwen3.8:27b` (18 GB)
   - **64 GB+ RAM:** Run `qwen3-coder-next` (52 GB) or large MoE models
3. **Pull and execute**:
   ```bash
   ollama run gemma4:12b
   ```

**The catch?** Wiring up streaming, handling conversational state, managing function/tool calls, avoiding disk swap death, and writing boilerplate code takes hours.  
**Hack Day Starter automates this end-to-end.**

---

## 🎯 The "Build for a Friend" Challenge (Hacktoberfest 2026)

Hack Day Starter was built specifically for the **Hacktoberfest 2026 "Build for a Friend" Weekend Challenge**. During hackathons, weekend sprints, and local AI prototyping, developers lose the first 2–4 hours fighting common pitfalls:

* 💥 **Out-of-Memory (OOM) Crashes:** Downloading a 14 GB or 20 GB model on an 8 GB or 16 GB laptop triggers aggressive swap thrashing, freezing the machine or crawling at 0.2 tokens/second.
* 📦 **Stale Model Catalogs:** Outdated tutorials recommend retired 2023-era models (like Llama 2 7B) instead of modern state-of-the-art architectures (Gemma 4, Qwen 3.5, Phi-4) that offer 256K context and native tool calling.
* 💾 **Disk Space Blindspots:** Pulling models without checking SSD headroom can stall multi-gigabyte downloads halfway through.
* 🔌 **Boilerplate & Runtime Frustration:** Connecting to local REST daemons, handling chunked NDJSON streams, configuring tool execution loops, and debugging raw `ECONNREFUSED` connection crashes drain developer momentum.

**Hack Day Starter** was created to solve this for a friend:
1. Detect your hardware specs (RAM, GPU acceleration, OS, free storage).
2. Deterministically recommend verified models with realistic memory requirements.
3. Choose your starter archetype (**Local Chat** or **Tool-Calling Agent**).
4. Download a clean, ready-to-run TypeScript project ZIP and start building in under 60 seconds.

---

## 📊 Hardware Sizing Matrix: What Model Can Your Computer Run?

Memory calculations must account for the **model weights**, the **KV cache** (which scales with context length), and **operating system overhead** (~2.5–4 GB):

| Your Available RAM | Recommended Models | Ollama Tag | Model Size | Context Window | Native Tool Calling | Experience / Speed |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **8 GB RAM** (Standard Laptop) | **Phi-4 Mini**<br>**Nemotron 3 Nano**<br>**Qwen 3.5 4B** | `phi4-mini`<br>`nemotron-3-nano:4b`<br>`qwen3.5:4b` | 2.5 GB<br>2.8 GB<br>3.4 GB | 128K<br>256K<br>256K | ✅<br>✅<br>✅ | ⚡ Fast (30–60 tok/s on M-series or modern CPU) |
| **16 GB RAM** (Dev Laptop) | **Gemma 4 E4B**<br>**Qwen 3.5 9B**<br>**Gemma 4 12B** | `gemma4:e4b`<br>`qwen3.5:9b`<br>`gemma4:12b` | 6.6 GB<br>6.6 GB<br>7.7 GB | 128K<br>256K<br>256K | ✅<br>✅<br>✅ | 🚀 Optimal balance of intelligence, speed, and context |
| **24 GB – 32 GB RAM** (Pro Mac / RTX PC) | **Gemma 4 12B** (Full KV)<br>**Qwen 3.8 27B**<br>**GPT-OSS 20B** | `gemma4:12b`<br>`qwen3.8:27b`<br>`gpt-oss:20b` | 7.7 GB<br>18 GB<br>14 GB | 256K<br>256K<br>128K | ✅<br>✅<br>✅ | 🧠 High reasoning power, complex coding & agent tasks |
| **64 GB+ Unified / VRAM** (Workstation) | **Qwen 3 Coder Next**<br>**Qwen 3.6 35B** | `qwen3-coder-next`<br>`qwen3.6:35b` | 52 GB<br>23 GB | 256K<br>256K | ✅<br>✅ | 🏆 Full frontier-grade local intelligence |

> [!NOTE]
> **Unified Memory (Apple Silicon M1–M6):** macOS dynamically shares RAM between CPU and GPU. A 16 GB Mac can dedicate ~12 GB directly to model weights and KV cache, making it one of the most efficient local AI platforms available.

---

## 🏗️ System Architecture

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
               │  • Deterministic hardware compatibility score │
               │  • Verified Model Registry (Oct 2026 data)    │
               │  • Authoritative vs Estimated memory bounds   │
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
               │  • Direct /api/chat streaming client          │
               │  • Built-in Ollama & Model Readiness check    │
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
| :--- | :--- | :--- |
| **Ollama** | Local Daemon | Runs locally on port `11434`. Pulls weights, manages GGUF quants, and executes hardware-accelerated tensor math on Metal/CUDA/Vulkan. |
| **Open-Weight Models** | Intelligence Layer | Neural network weights (e.g., `gemma4:12b`, `qwen3.5:9b`). Runs completely offline inside Ollama. |
| **Hack Day Starter** | Generator & Recommender | Profiles hardware, filters models, and builds custom starter ZIPs in-memory. Does **not** proxy inference or transmit prompts. |
| **Generated Project** | Your Application | Independent TypeScript codebase. Runs directly on your machine with zero external SDKs or telemetry. |

---

## 🛠️ Starter Archetypes

### 1. Local Chat (`hack-day-starter-chat-<model>`)
* **Best for:** Chatbots, personal offline copilots, document Q&A, and conversational prototyping.
* **Key Capabilities:**
  * **Zero runtime dependencies:** Uses native Node.js 18+ global `fetch`.
  * **Interactive CLI loop:** Multi-turn conversational memory with seamless terminal I/O.
  * **Smart readiness check:** Verifies the Ollama daemon and local model existence *before* prompting the user.
  * **Graceful shutdown:** Clean EOF handling on `Ctrl+C` or typing `exit`.

### 2. Autonomous Tool-Calling Agent (`hack-day-starter-agent-<model>`)
* **Best for:** Multi-step autonomous agents, calculation engines, and structured function execution.
* **Strict Safety Gate:** Only selectable when the model is verified to support native tool calling (`model.capabilities.tools === true`).
* **Key Capabilities:**
  * **Autonomous ReAct Loop:** Model generates structured `tool_calls` → runtime executes tool → sends `{ role: "tool", content: result }` back to model → model synthesizes natural language conclusion.
  * **Safe Math Engine:** Ships with `calculator.ts`, a pure recursive-descent arithmetic parser (**0% `eval()`**, **0% `new Function()`**).
  * **Extensible Architecture:** Add new tools in minutes using standard JSON Schema definitions.

---

## 💻 Real End-to-End Execution Trace: Gemma 4 12B Agent

Here is the exact terminal output from the generated tool-calling agent running against local Ollama with `gemma4:12b`:

```bash
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
1. **User Prompt:** Submitted a natural-language multi-step arithmetic request.
2. **Autonomous Tool Call:** `gemma4:12b` recognized it required a calculation and emitted a structured tool call: `calculate({"expression": "(342 * 19) / 4"})`.
3. **Safe Evaluation:** `src/tools/calculator.ts` evaluated the expression mathematically without invoking any shell or arbitrary JavaScript execution.
4. **Tool Context Feeding:** The output `1624.5` was sent back to the model as a `tool` role message.
5. **Final Synthesis:** Gemma 4 synthesized the final, human-readable answer.

---

## 🔍 Verified Model Registry (Live Ollama Source Snapshot)

Unlike static blog posts that become outdated within weeks, Hack Day Starter uses a **Verified Model Registry** tracking 23 model entries categorized by capability verification, runtime testing status, and lifecycle. The complete catalog with manifest byte sizes and interactive filters is browsable on the [Verified Model Registry](https://hack-day-starter.vercel.app/model-registry) page:

| Model | Creator | Ollama Tag | Display Size | Context | Tools | Verification Status |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **Gemma 4 12B** | Google | `gemma4:12b` | 7.7 GB | 256K | ✅ | Official Spec: 16 GB |
| **Gemma 4 E4B** | Google | `gemma4:e4b` | 6.6 GB | 128K | ✅ | Official Spec: 8 GB |
| **Llama 3.2 3B** | Meta | `llama3.2:3b` | 2.0 GB | 128K | ✅ | Runtime Verified |
| **Llama 3.1 8B** | Meta | `llama3.1:8b` | 4.9 GB | 128K | ✅ | Runtime Verified |
| **Qwen 3.5 9B** | Alibaba | `qwen3.5:9b` | 6.6 GB | 256K | ✅ | Source Verified |
| **Qwen 3.5 4B** | Alibaba | `qwen3.5:4b` | 3.4 GB | 256K | ✅ | Source Verified |
| **Qwen 2.5 Coder 7B** | Alibaba | `qwen2.5-coder:7b` | 4.7 GB | 32K | ✅ | Source Verified |
| **Mistral NeMo 12B** | Mistral | `mistral-nemo:12b` | 7.1 GB | 128K | ✅ | Source Verified |
| **Qwen 3.8 27B** | Alibaba | `qwen3.8:27b` | 18 GB | 256K | ✅ | Source Verified |
| **Qwen 3.6 35B** | Alibaba | `qwen3.6:35b` | 23 GB | 256K | ✅ | Source Verified |
| **GPT-OSS 20B** | Community | `gpt-oss:20b` | 14 GB | 128K | ✅ | Source Verified |
| **Phi-4 Mini** | Microsoft | `phi4-mini` | 2.5 GB | 128K | ✅ | Source Verified |
| **Nemotron 3 Nano 4B** | NVIDIA | `nemotron-3-nano:4b` | 2.8 GB | 256K | ✅ | Source Verified |
| **LFM 2.5 8B** | Liquid | `lfm2.5:8b` | 5.2 GB | 32K | ❌ | Source Verified |
| **Devstral Small 2** | Mistral | `devstral-small-2:latest` | 15 GB | 32K | ✅ | Source Verified |
| **DeepSeek R1 1.5B** | DeepSeek | `deepseek-r1:1.5b` | 1.1 GB | 128K | ❌ | Source Verified |

---

## 🚦 Ollama & Model Readiness UX (Zero Stack Traces)

First-time local AI developers frequently run into confusing crashes:
* `FetchError: connect ECONNREFUSED 127.0.0.1:11434`
* `model 'xyz' not found, try pulling it first`

Generated projects ship with an integrated **Readiness Check** (`src/readiness.ts`). Before any prompt is processed, it checks:

1. **Is Ollama Running?**  
   If the daemon is offline, it prints a clean, formatted guide:
   ```text
   ===============================================================
   ⚠️  OLLAMA IS NOT REACHABLE
   ---------------------------------------------------------------
   Could not connect to Ollama at: http://localhost:11434
   
   To run this starter, please:
   1. Install Ollama: https://ollama.com/download
   2. Start the Ollama application or run 'ollama serve'
   3. Restart this starter: npm run dev
   ===============================================================
   ```
2. **Is the Model Installed?**  
   If the weights are missing, it provides the exact copy-paste command:
   ```text
   ===============================================================
   ⚠️  MODEL NOT INSTALLED: gemma4:12b
   ---------------------------------------------------------------
   Ollama is running, but 'gemma4:12b' is not downloaded yet.
   
   To download this model, run:
     ollama pull gemma4:12b
   
   Once download finishes, restart this starter:
     npm run dev
   ===============================================================
   ```

---

## 🔒 Security & Privacy Commitments

1. **No External API Keys:** Inference executes locally through your local Ollama instance. Prompts, code, and documents are processed on your machine rather than sent to third-party cloud APIs.
2. **Deterministic & Safe Generation:** The generator uses pure template composition. It does not invoke opaque third-party cloud LLMs to write code.
3. **No Dynamic Code Evaluation:** `src/tools/calculator.ts` strictly rejects any input containing letters, semicolons, backticks, or non-arithmetic characters. It never touches `eval()` or `new Function()`.
4. **Registry Enforcement:** The API only generates starters for models registered in `VERIFIED_MODEL_REGISTRY`. Arbitrary, unverified model tags are rejected.

---

## 🚀 Step-by-Step Installation & Quickstart

### Method 1: Using the Web App Profiler (Recommended)

```bash
# 1. Clone this repository
git clone https://github.com/TechGenDM/hack-day-starter.git
cd hack-day-starter

# 2. Install dependencies
npm install

# 3. Launch the web profiler
npm run dev

# 4. Open http://localhost:3000 in your browser
#    - Review your hardware recommendations
#    - Select Chat or Agent starter
#    - Click "Download Starter (.ZIP)"
```

### Method 2: Running Your Downloaded Starter Project

```bash
# 1. Unzip your generated project
unzip hack-day-starter-agent-gemma4.zip -d my-ai-agent
cd my-ai-agent

# 2. Pull the model weights locally
ollama pull gemma4:12b

# 3. Install dev dependencies (TypeScript & tsx)
npm install

# 4. Start your local AI!
npm run dev
```

---

## 🧪 Comprehensive Automated Test Suite (36/36 Passing)

The codebase includes an extensive automated test suite covering recommendation logic, live data syncing, generator determinism, AST security auditing, runtime readiness diagnostics, score transparency, and starter setup flow contracts:

```bash
npm test
```

```text
✔ R1: Both starter types ship the readiness module and use it in index.ts
✔ R2 (chat): Ollama unavailable → friendly message, download URL, no raw error
✔ R2 (agent): Ollama unavailable → friendly message, download URL, no raw error
✔ R3 (chat): model missing → exact 'ollama pull qwen3.5:9b', no substitution
✔ R3 (agent): model missing → exact 'ollama pull gemma4:12b', no substitution
✔ R4: Chat — ready → readiness message, then unchanged chat behavior with exact tag
✔ R5: Agent — ready → unchanged model → calculator tool → result → model loop
✔ R6: readiness module matches exact tags only (':latest' normalization for bare names)
✔ A: Gemma 4 E4B metadata matches verified source snapshot
✔ B: Gemma 4 12B metadata matches verified source snapshot
✔ C: Qwen 3.5 4B metadata matches verified source snapshot
✔ D: Qwen 3.5 9B metadata matches verified source snapshot
✔ E: GPT-OSS 20B metadata matches verified source snapshot
✔ F: Capability fields match source snapshot
✔ G: Ollama display sizes and short digests match source snapshot
✔ H: Current model discovery finds newly added model families including Qwen 3.8
✔ I: Retired / unavailable models are never recommended
✔ J: Stale metadata cannot be presented as 'current' or recommended
✔ K: 24 GB Apple Silicon recommends only models that pass current hardware policy
✔ L: 8 GB CPU-only does not receive artificially inflated model-capacity bonuses
✔ M: Tool-calling selection depends on verified capability data
✔ N: Discrepancy detector flags discrepancies when curated registry disagrees with observations
✔ O: Runtime verified models and runtime pending models are strictly distinguished
✔ P: Recommendation transparency and score factor accuracy
✔ A: Chat starter generation produces standard file set
✔ B: Agent starter generation produces tool-calling file set
✔ C: Exact selected Ollama tag is injected into config, code, and README
✔ D: README contains exact setup commands in sequence
✔ E: Agent generation rejects a no-tools model with exact error message
✔ F: Generated file paths are valid relative paths and JSON files parse cleanly
✔ G: Generated project is 100% deterministic across multiple runs
✔ H: Retired, unverified, or arbitrary models cannot bypass safety gates
✔ I: Generated templates do not access invalid readline.clearLine or cursorTo
✔ J: Calculator tool security audit — zero eval, zero Function, strict validation, correct arithmetic
✔ K: Starter API route enforces strict model safety and capability verification
✔ L: Starter Workbench setup flow prerequisites and command contract

ℹ tests 36
ℹ suites 0
ℹ pass 36
ℹ fail 0
```

---

## ❓ Frequently Asked Questions (FAQ)

### Q1: Can I run an AI model locally without a dedicated GPU?
**Yes.** Modern open-weight small language models (such as `phi4-mini` at 2.5 GB or `qwen3.5:4b` at 3.4 GB) run efficiently on standard modern x86/ARM CPUs using Ollama's SIMD and AVX-512 optimizations. On Apple Silicon (M1–M6), the CPU and GPU share high-bandwidth Unified Memory, giving desktop-grade performance on thin laptops.

### Q2: How much RAM do I need for local AI?
* **Minimum:** 8 GB RAM allows comfortable execution of 2B–4B parameter models.
* **Sweet Spot:** 16 GB RAM runs 7B–12B models (e.g., `gemma4:12b` or `qwen3.5:9b`) at full speed with generous context windows.
* **Power User:** 32 GB–64 GB RAM unlocks 27B–35B parameter reasoning models and coding specialists.

### Q3: Why run models locally instead of using cloud APIs like OpenAI or Anthropic?
1. **Local Privacy & Data Control:** Prompts, code, and documents run directly on your machine instead of being transmitted to third-party cloud servers.
2. **Zero Incurred Usage Fees:** No subscription tiers, no per-token billing, and no credit card required.
3. **Offline Resilience:** Functions completely disconnected from external networks (airplanes, field work, secure offline environments).
4. **No Cloud Rate Limits:** Requests are bound only by your local hardware capabilities, without artificial vendor request caps or token-per-minute throttling.

### Q4: What is the difference between Ollama and Hack Day Starter?
* **Ollama** is the runtime engine (analogous to the Node.js runtime or Docker daemon) that manages model execution.
* **Hack Day Starter** is the developer bootstrapper that profiles your machine, recommends the best model for your exact hardware, and scaffolds a complete TypeScript application with zero runtime dependencies.

### Q5: How does tool-calling work without an internet connection?
The open-weight model is trained to recognize when a query requires a tool. It outputs a structured JSON object specifying the tool name and arguments. Your local TypeScript runtime executes the function on your machine (e.g., querying a local database or running a math parser) and returns the output to the model to generate the final response.

---

## 📁 Repository Structure

```text
├── app/
│   ├── api/recommend/route.ts      # Hardware scoring & model recommendation API
│   ├── api/starter/route.ts        # Starter generation & model safety gating API
│   ├── globals.css                 # Dark theme & UI layout styling
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
│   ├── recommend.test.ts           # Tests A–P: 16 recommendation, transparency & registry tests
│   ├── starter.test.ts             # Tests A–L: 12 starter generation, security & setup flow tests
│   └── readiness.test.ts           # Tests R1–R6: 8 readiness & runtime integration tests
├── package.json
├── LICENSE                         # MIT License
└── README.md
```

---

## 🤝 Contributing

Contributions to improve hardware profiling heuristics, expand verified model registry snapshots, or add new starter templates are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/model-sync`
3. Ensure all tests pass: `npm test`
4. Submit a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.  
Built with ❤️ for **Hacktoberfest 2026 — Weekend Challenge: Build for a Friend**.
