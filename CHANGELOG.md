# Changelog

## 2026-02-27 — Fortification (bug fixes)

### Fixed
- `tsconfig.json`: Align module system to CommonJS, fix `__dirname` + NodeNext contradiction
- `src/llm/providers/openai.ts`: Add `callOpenAIText` for text-only calls; stop sending empty image URL
- `src/llm/providers/google.ts`: Validate `GOOGLE_AI_API_KEY` at client init
- `src/config/loader.ts`: Add Zod validation to `loadModelsConfig()`
- `src/browser/browser.ts`: Make `headless` configurable via `HEADLESS` env var
- `src/browser/login.ts`: Use `locator().first()` to fix Playwright strict mode violation on login
- `src/agent/loop.ts` + `prompts.ts`: Replace greedy regex JSON extraction with `<json>` delimiter; add consecutive guardrail block escape (exits after 3 in a row)
- `src/analysis/analyzer.ts`: Same delimiter fix + Zod validation on analysis output
- `src/analysis/report.ts` + `src/types/report.ts`: Guard null video path
- `docs/operations-guide.md`: Fix `GOOGLE_API_KEY` → `GOOGLE_AI_API_KEY`

## 2026-02-13 — Initial Build

### Added
- Full synthetic user framework: browser layer, agent loop, LLM providers, guardrails, recording, analysis, CLI
- Personas: `finops`, `data-engineer`
- Flows: `query-optimization`, `compute-recommendations`, `autoclustering-analysis`
- Operations guide (`docs/operations-guide.md`)
- Executive brief (`docs/executive-brief.md`)
