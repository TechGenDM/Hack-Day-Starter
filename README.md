# 🚀 Hack Day Starter

**Hacktoberfest 2026 — Weekend Challenge: Build for a Friend**

> Stop wasting the first 2–3 hours of your hack day choosing a model and fixing environment issues. Enter your hardware specs, get a vetted open-weight model recommendation for local Ollama execution, and prepare your starter project.

---

## What It Does

1. **Hardware Profiling:** Input your machine's physical capabilities — RAM (GB), GPU acceleration (Apple Silicon / NVIDIA / CPU-only), Operating System, and **Free Disk Space** (not total SSD size).
2. **Verified Model Registry:** Evaluates against current verified local models as of **October 2, 2026** (including Gemma 4, Qwen 3.5, Qwen 3, GPT-OSS, and Phi-4 Mini).
3. **Transparent Memory Guidance:** Clearly separates authoritative manufacturer requirements (`Official memory guidance`) from empirical runtime sizing (`Estimated memory comfort`).
4. **Deterministic Recommendations:** Ranks models by physical compatibility, free disk space headroom, use-case alignment, tool-calling capability, and hardware fit — without calling closed AI APIs.
5. **Model & Starter Selector:** Pick a model to inspect its full metadata (context window, license, verification source, capabilities) and choose your starter archetype (`Local Chat` or `Tool-calling Agent`), with automatic capability validation (e.g. disabling agent starters if the model lacks native tool-calling).

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Framework** | Next.js 16 (App Router + Turbopack) + React 19 + TypeScript |
| **Styling** | Tailwind CSS 4 |
| **Runtime** | Ollama (local model execution) |
| **Model Registry** | Strongly typed Verified Model Registry with source hierarchy |
| **Validation** | Registry freshness & integrity validator |
| **Testing** | Node native test runner via `tsx` |

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Run the automated test suite
npm test

# 3. Start the dev server
npm run dev

# 4. Open in browser
open http://localhost:3000
```

---

## Project Structure

```
├── app/
│   ├── api/recommend/route.ts      # POST endpoint with input validation
│   ├── globals.css                 # Dark theme & select styling
│   ├── layout.tsx                  # Root layout & metadata
│   └── page.tsx                    # Hardware form, recommendations & starter selector
├── lib/
│   ├── types.ts                    # Core TypeScript contracts & capabilities
│   ├── registry.ts                 # Verified Model Registry (primary source: Ollama library)
│   ├── registry-validator.ts       # Registry integrity, freshness & citation audit
│   ├── memory-calculator.ts        # Authoritative vs estimated memory heuristics
│   ├── recommend.ts                # Deterministic recommendation engine
│   └── models.ts                   # Backward-compatibility adapter
├── tests/
│   └── recommend.test.ts           # 9 automated deterministic test cases (A–I)
├── package.json
└── README.md
```

---

## Verified Model Registry (as of October 2, 2026)

| Model | Provider | Tag | Size | Context | Tools | Memory Guidance |
| --- | --- | --- | --- | --- | --- | --- |
| **Gemma 4 12B** | Google | `gemma4:12b` | ~7.8 GB | 128k | ✓ | Official: 16 GB |
| **Gemma 4 e4b** | Google | `gemma4:e4b` | ~2.8 GB | 128k | ✓ | Official: 8 GB |
| **Qwen 3.5 9B** | Alibaba | `qwen3.5:9b` | ~5.6 GB | 128k | ✓ | Estimated: ~9 GB |
| **Qwen 3.5 4B** | Alibaba | `qwen3.5:4b` | ~2.6 GB | 64k | ✓ | Estimated: ~5 GB |
| **Qwen 3 8B** | Alibaba | `qwen3:8b` | ~4.9 GB | 32k | ✓ | Estimated: ~8 GB |
| **GPT-OSS 20B** | Community | `gpt-oss:20b` | ~11.5 GB | 64k | ✓ | Estimated: ~16 GB |
| **Phi-4 Mini** | Microsoft | `phi4-mini` | ~2.4 GB | 128k | ✓ | Estimated: ~4 GB |
| **Qwen 2.5 Coder 1.5B** | Alibaba | `qwen2.5-coder:1.5b` | ~1.0 GB | 32k | ✕ | Estimated: ~3 GB |
| *Gemma 3 12B* | Google | `gemma3:12b` | ~8.1 GB | 8k | ✕ | *Deprecated / Stale (excluded)* |

---

## Test Suite

Run the full deterministic test suite with:

```bash
npm test
```

Tested scenarios include:
- **Test A:** 24 GB RAM + Apple Silicon + macOS + coding (recommends modern capable models e.g. Qwen 3.5 9B / Gemma 4 12B)
- **Test B:** 16 GB RAM + Apple Silicon + macOS + chat (comfortable fit)
- **Test C:** 8 GB RAM + no GPU + Linux + chat (prefers lightweight <= 4 GB models)
- **Test D:** Low free disk space (models with insufficient storage are filtered out)
- **Test E:** Tool-calling capability with models lacking tool support (e.g. Qwen 2.5 Coder 1.5B)
- **Test F:** Newly verified Gemma 4 variants appear with official memory citations
- **Test G:** Current Qwen 3.5 variants appear with transparent estimated memory labels
- **Test H:** 24 GB Apple Silicon does not return stale Gemma 3 when current Gemma 4 is available
- **Test I:** Registry validation utility audit

---

## Roadmap

- [x] **Phase 1:** Core Next.js + Tailwind foundation & baseline recommendation flow
- [x] **Phase 2:** Verified Model Registry (Gemma 4, Qwen 3.5, GPT-OSS), free disk space input, official vs estimated memory guidance, model selector, tool-calling validation
- [ ] **Phase 3:** Starter project code generation (`Local Chat` and `Tool-calling Agent`)
- [ ] **Phase 4:** Live Ollama health check & model pull progress UI

---

## License

MIT
