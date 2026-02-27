# Synthetic User — Architecture

## What It Does

The synthetic user opens a browser, logs into SeemoreData, and navigates the product as if it were a real person with a specific role, knowledge level, and personality. After the session, it writes a UX report describing what a real user in that role would have found confusing or frustrating.

## The See-Think-Act Loop

Every step of a test run follows this cycle:

```
Screenshot → Vision Model → Reasoning Model → Guardrails → Browser Action → Log
```

1. **See** — Take a full-page screenshot. Send it to the vision model (GPT-4o). The model describes what it sees in plain text: layout, buttons, data, errors.

2. **Think** — Send the screen description + action history to the reasoning model (Claude Sonnet). The model responds as the persona, deciding what to do next. Response is JSON wrapped in `<json>` tags.

3. **Guardrails** — Before acting, check the proposed action against the blocklist (dangerous button texts, blocked URL patterns, domains). If blocked, feed the reason back to the reasoning model on the next step.

4. **Act** — Execute the browser action via Playwright (click, type, scroll, navigate, wait).

5. **Log** — Record the full decision (observation, reasoning, emotion, action, guardrail result) to `decision-log.json`.

Repeat until: `done` (agent declares success), `blocked` (agent can't proceed), `max_steps` reached, or `guardrail_critical` (3 consecutive blocks).

## Layer Map

```
src/
├── main.ts              — CLI entrypoint, wires all layers
├── agent/
│   ├── loop.ts          — See-think-act cycle
│   ├── guardrails.ts    — Action safety checks
│   └── prompts.ts       — System prompts for vision and reasoning models
├── browser/
│   ├── browser.ts       — Launch/close Playwright browser, take screenshots
│   ├── actions.ts       — Execute actions (click, type, scroll, navigate, wait)
│   └── login.ts         — SeemoreData login flow
├── llm/
│   ├── router.ts        — Routes tasks to correct provider/model
│   └── providers/
│       ├── anthropic.ts — Anthropic SDK wrapper
│       ├── openai.ts    — OpenAI SDK wrapper (vision + text)
│       └── google.ts    — Google Generative AI wrapper
├── recording/
│   └── logger.ts        — Writes decision-log.json, action-log.json, guardrail-events.json
├── analysis/
│   ├── analyzer.ts      — Post-run LLM analysis of session logs
│   └── report.ts        — Generates report.md and report.json
├── config/
│   ├── loader.ts        — Loads and validates persona, flow, guardrails, models configs
│   ├── guardrails.json  — Global blocked texts, selectors, URL patterns, allowed domains
│   └── models.json      — Which LLM provider/model to use for each task type
├── personas/            — JSON persona configs (finops, data-engineer)
├── flows/               — JSON flow configs (query-optimization, etc.)
└── types/               — Zod schemas + TypeScript types for all domain objects
```

## Config-Driven Design

No code changes are needed to add a persona or flow:

- **Personas** (`src/personas/*.json`) define: role, knowledge gaps, behavior traits, patience level, per-flow goals
- **Flows** (`src/flows/*.json`) define: start URL, goal, success criteria, max steps, guardrail overrides
- **Models** (`src/config/models.json`) define: which provider/model handles vision, reasoning, analysis, bulk tasks
- **Guardrails** (`src/config/guardrails.json`) define: globally blocked button texts, selectors, URL patterns, allowed domains

## Output Structure

Each run creates a folder in `runs/`:

```
runs/2026-02-27T14-30-00_finops_query-optimization/
├── *.webm                  — Session video recording
├── screenshots/
│   ├── step-001.png
│   └── ...
├── decision-log.json       — Full reasoning trace, one entry per step
├── action-log.json         — Compact action history
├── guardrail-events.json   — Blocks that fired during the run
├── report.json             — Structured analysis output
└── report.md               — Human-readable UX report
```

## Guardrail System

Guardrails fire before every action. Checks (in order):
1. Navigation: Is the destination URL in `allowedDomains`? Does it match a `blockedUrlPatterns` entry?
2. Click: Does the target element's text match `blockedButtonTexts`? (with per-flow `allowedButtonTexts` override)
3. Everything else: allowed by default

A blocked action is logged and fed back to the reasoning model as context. After 3 consecutive blocks, the run exits with `guardrail_critical`.

## Model Routing

| Task | Default Provider | Model |
|------|-----------------|-------|
| Vision (screen description) | OpenAI | gpt-4o |
| Reasoning (persona decisions) | Anthropic | claude-sonnet-4-6 |
| Analysis (post-run UX analysis) | Anthropic | claude-sonnet-4-6 |
| Bulk (future use) | Google | gemini-pro |

All routing is in `src/config/models.json` — no code changes to swap models.
