# Project Memory — synthetic_user

## Status
- **Build complete:** All 11 implementation tasks done (2026-02-13)
- **Fortification complete:** All 10 bug fixes applied (2026-02-27)
- **Smoke test:** NOT YET RUN — Task 12 still pending

## Key Architecture Decisions

### Module system: CommonJS
`package.json` is `"type": "commonjs"`. `tsconfig.json` must be `"module": "CommonJS"`.
Use `__dirname` throughout. Do NOT use `import.meta.dirname`. Do NOT use `"module": "NodeNext"`.

### JSON extraction: `<json>` delimiter
LLM responses are extracted using `/<json>([\s\S]*?)<\/json>/` not greedy regex.
Both the agent loop and the analyzer use this pattern.
Both prompts instruct the model to wrap output in `<json>` tags.

### Login selectors: `locator().first()`
Standard HTML email fields match multiple selectors simultaneously.
Always use `page.locator(...).first()` not `page.fill(...)` with multi-selector strings.

### Headless mode
Default is `headless: false` (visible browser) for local runs.
Set `HEADLESS=true` in `.env` for CI or server environments.

## Known Fragile Points

1. **Login selectors** — `src/browser/login.ts` — selectors work for standard HTML login forms but may need updating if SeemoreData uses a custom auth component. Check after any auth page change.

2. **JSON delimiter reliance** — Both agent loop and analyzer depend on the LLM wrapping output in `<json>` tags. If a model ignores this instruction, parsing falls back to a `blocked` action or empty analysis. Watch for this in decision-log.

3. **Video file detection** — `closeBrowser` finds `.webm` files by listing the run directory. If Playwright changes its video naming, this breaks silently.

4. **Guardrail text matching** — Guardrail button text checks are case-insensitive substring matches. A button labeled "Apply Filter" will be blocked because it contains "Apply". Review `guardrails.json` blocked texts when adding new flows.

## Environment Variables Required

| Variable | Used By | Notes |
|----------|---------|-------|
| `OPENAI_API_KEY` | `src/llm/providers/openai.ts` | Required — used for vision |
| `ANTHROPIC_API_KEY` | `src/llm/providers/anthropic.ts` | Required — used for reasoning |
| `GOOGLE_AI_API_KEY` | `src/llm/providers/google.ts` | Optional — only if Google in models.json |
| `SEEMOREDATA_URL` | `src/browser/login.ts`, `src/agent/loop.ts` | Defaults to `https://app.seemoredata.com` |
| `SEEMOREDATA_EMAIL` | `src/browser/login.ts` | Required |
| `SEEMOREDATA_PASSWORD` | `src/browser/login.ts` | Required |
| `HEADLESS` | `src/browser/browser.ts` | Set to `true` for CI |

## Next Milestone
Run the smoke test: `npx tsx src/main.ts --persona finops --flow query-optimization --max-steps 5`
