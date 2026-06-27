# Pre-Flight

**Instant pre-quote intelligence for engineering drawings.** Drop a 2D drawing (PDF/PNG) — and optionally its STEP model — and get, in seconds, the judgement a managed sourcing flow makes you wait on a human for:

1. **A quote-readiness score (0–100)** — a checklist of exactly what's missing or ambiguous that would slow a supplier quote.
2. **A drawing ↔ CAD consistency check** — parses the STEP bounding box and cross-checks it against the drawing's stated overall size, catching wrong-revision models and inch/mm mix-ups. *The check extraction-only tools skip.*
3. **Conservative DFM risk flags** — clearly labelled heuristic, to confirm with a supplier.

It reads the specs too (process, material, tolerances, finish), but extraction isn't the differentiator — the judgement layer on top of it is.

## Why this exists

On managed sourcing platforms, the moment after you upload a part is the moment everything goes quiet: the AI extracts your specs, then you wait on a human for everything that follows. The single biggest cause of a *slow* quote is an **incomplete or ambiguous drawing** — a missing datum, no quantity, an unstated material — which forces a round-trip with the supplier.

Pre-Flight closes that gap with instant, pre-quote intelligence. It doesn't replace a human-reviewed quote; it makes the RFQ **supplier-ready on second zero** so the quote comes back faster. Every readiness check reads a *fact* off the drawing (not an estimate), so the result holds up to a manufacturing reviewer.

## Architecture (Clean Architecture + DI)

Dependencies point inward only. The core knows nothing about Next.js, React, or any LLM.

```
 delivery (Next.js App Router, antd)        <- frameworks & drivers
   |_ src/app, src/app/api/analyze
 composition root (manual DI)               <- wiring
   |_ src/composition/container.ts
 infrastructure (adapters)                  <- implements the ports
   |_ src/infrastructure/ai      (Vercel AI SDK: extractor, risk analyzer, provider registry)
   |_ src/infrastructure/cad     (dependency-free STEP bounding-box reader)
   |_ src/infrastructure/ingest  (upload normalization)
 core/application (use case + ports)        <- orchestration, depends on interfaces
   |_ AnalyzeDrawing, SpecExtractorPort, RiskAnalyzerPort, CadGeometryPort, DrawingIngestPort
 core/domain (entities + policies)          <- pure business rules, zero dependencies
   |_ ExtractedSpec, ReadinessReport, ReadinessPolicy, ConsistencyPolicy
```

Pipeline: `ingest -> (extract specs (LLM) ‖ read STEP bbox) -> assess DFM risk (LLM) -> cross-check drawing vs model -> score readiness`.

### Swappable LLM, by design

The AI SDK lives only in the infrastructure layer, behind `SpecExtractorPort` / `RiskAnalyzerPort`. Switching model or provider is an **env change**, never a code change:

```bash
AI_PROVIDER=google     AI_MODEL=gemini-3.5-flash    # default
AI_PROVIDER=anthropic  AI_MODEL=claude-sonnet-4-6   # one line to switch
```

Because the use case depends on interfaces, the business logic is unit-tested with fake adapters and **no network** (see `test/analyze-drawing.spec.ts`).

## Stack

Next.js 16 · React 19 · TypeScript · [Vercel AI SDK](https://ai-sdk.dev) (`ai` + `@ai-sdk/google` / `@ai-sdk/anthropic`) · Zod (structured output) · Ant Design 6 · Vitest.

## Run locally

```bash
npm install
cp .env.example .env.local      # then paste your GOOGLE_GENERATIVE_AI_API_KEY
npm run dev                     # http://localhost:3000
```

```bash
npm test          # unit tests (no API key needed)
npm run build     # production build
```

## What it is / isn't

- **Is:** instant, pre-quote *intelligence* — readiness, completeness, conservative DFM flags.
- **Isn't:** a binding price quote or a replacement for a vetted supplier. Cost is deliberately not estimated; the value is in catching the gaps that slow a real quote.

---

Built by Jeet. Theme tokens mirror Jiga's app so the workflow feels native to their product.
