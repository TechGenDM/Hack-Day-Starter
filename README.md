# 🚀 Hack Day Starter

**Hacktoberfest 2026 — Weekend Challenge: Build for a Friend**

> Stop wasting the first 2–3 hours of your hack day choosing a model and fixing environment issues. Enter your hardware specs, get a recommended open-weight model, and start building.

## What it does

1. You tell it about your laptop (RAM, GPU, OS, use case).
2. It recommends 2–3 open-weight models that will actually run on your hardware.
3. It gives you the exact `ollama pull` command to get started.

## Tech stack

| Layer          | Tech                          |
| -------------- | ----------------------------- |
| Framework      | Next.js 16 + TypeScript       |
| Styling        | Tailwind CSS 4                |
| Model runtime  | Ollama (local)                |
| Model catalog  | Static TypeScript (no DB)     |
| Recommendation | Deterministic scoring (no AI) |

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Run the dev server
npm run dev

# 3. Open the app
open http://localhost:3000
```

## Project structure

```
├── app/
│   ├── api/recommend/route.ts   # POST endpoint for recommendations
│   ├── globals.css              # Global styles + dark theme
│   ├── layout.tsx               # Root layout with SEO metadata
│   └── page.tsx                 # Homepage with hardware form + results
├── lib/
│   ├── types.ts                 # Core TypeScript types
│   ├── models.ts                # Static model catalog (6 models)
│   └── recommend.ts             # Deterministic recommendation engine
├── package.json
└── README.md
```

## How the recommendation works

The engine is **fully deterministic** — no LLM calls, no closed APIs:

1. **Filter** — remove models that need more RAM than you have.
2. **Score** — rank remaining models by use-case fit, RAM headroom, GPU capability, and OS bonus.
3. **Classify** — label each as *excellent*, *good*, or *marginal* compatibility.
4. **Explain** — generate a human-readable reason for each pick.

## Roadmap (future iterations)

- [ ] Project scaffold generation (starter templates per model)
- [ ] Ollama health check (detect if Ollama is running)
- [ ] Model pull progress UI
- [ ] Benchmark / speed estimates
- [ ] Community-contributed model entries

## License

MIT
