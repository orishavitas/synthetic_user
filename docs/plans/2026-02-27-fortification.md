# Synthetic User Fortification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 10 critical/important bugs identified in the code review so the system can complete a real end-to-end test run against SeemoreData, then complete the documentation trio.

**Architecture:** This is a bug-fix-first pass — no new abstractions, no generalization. Every change is surgical and targets exactly the identified defect. The system stays SeemoreData-specific. After all 10 bugs are fixed, three documentation files are created/updated.

**Tech Stack:** TypeScript, Node.js (CommonJS), Playwright, Zod, Commander, Anthropic/OpenAI/Google SDKs, tsx (runtime), tsc (type checker)

---

## Bug Fixes

### Task 1: Fix module system contradiction (tsconfig.json)

**Problem:** `tsconfig.json` declares `"module": "NodeNext"` but `package.json` uses `"type": "commonjs"` and all source files use `__dirname`. This combination works by accident under `tsx` but will break `tsc` output.

**Files:**
- Modify: `tsconfig.json`

**Step 1: Verify the contradiction**

```bash
cat tsconfig.json
cat package.json | grep '"type"'
```
Expected: tsconfig shows `"module": "NodeNext"`, package.json shows `"type": "commonjs"`

**Step 2: Fix tsconfig.json**

Change lines 4-5 from:
```json
"module": "NodeNext",
"moduleResolution": "NodeNext",
```
To:
```json
"module": "CommonJS",
"moduleResolution": "Node",
```

**Step 3: Verify TypeScript still compiles cleanly**

```bash
npx tsc --noEmit
```
Expected: No errors. If errors appear, check that all `.js` extensions on imports are still valid under CommonJS (they are — tsc allows them).

**Step 4: Commit**

```bash
git add tsconfig.json
git commit -m "fix: align tsconfig module system with CommonJS package type"
```

---

### Task 2: Fix OpenAI provider — add text-only call path

**Problem:** `callOpenAIVision` is called for text-only tasks (reasoning, analysis) with `screenshotBase64 = ""`, which sends a malformed `data:image/png;base64,` image URL to the API.

**Files:**
- Modify: `src/llm/providers/openai.ts`
- Modify: `src/llm/router.ts`

**Step 1: Add `callOpenAIText` to the OpenAI provider**

In `src/llm/providers/openai.ts`, add after the existing `callOpenAIVision` function:

```typescript
export async function callOpenAIText(
  systemPrompt: string,
  textMessage: string,
  model: string
): Promise<string> {
  const response = await getClient().chat.completions.create({
    model,
    max_tokens: 4096,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: textMessage },
    ],
  });
  return response.choices[0].message.content ?? "";
}
```

**Step 2: Update router.ts to use callOpenAIText for text-only routes**

In `src/llm/router.ts`:

1. Add import of `callOpenAIText`:
```typescript
import { callOpenAIVision, callOpenAIText } from "./providers/openai.js";
```

2. In `routeReasoning`, change the `openai` case from:
```typescript
case "openai":
  return callOpenAIVision(systemPrompt, userMessage, "", config.model);
```
To:
```typescript
case "openai":
  return callOpenAIText(systemPrompt, userMessage, config.model);
```

3. In `routeAnalysis`, make the same change:
```typescript
case "openai":
  return callOpenAIText(systemPrompt, userMessage, config.model);
```

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

**Step 4: Commit**

```bash
git add src/llm/providers/openai.ts src/llm/router.ts
git commit -m "fix: add text-only OpenAI call path, stop sending empty image URL"
```

---

### Task 3: Fix Google provider — validate API key at startup

**Problem:** `new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY ?? "")` silently accepts an empty string. Auth failure only surfaces at call time with a cryptic error.

**Files:**
- Modify: `src/llm/providers/google.ts`

**Step 1: Add key validation in getClient()**

Replace the existing `getClient()` function:

```typescript
function getClient(): GoogleGenerativeAI {
  if (!client) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GOOGLE_AI_API_KEY is not set. Add it to your .env file or remove Google from models.json."
      );
    }
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

**Step 3: Commit**

```bash
git add src/llm/providers/google.ts
git commit -m "fix: validate GOOGLE_AI_API_KEY at client init, not at call time"
```

---

### Task 4: Fix config loader — validate models.json with Zod

**Problem:** `loadModelsConfig()` uses `JSON.parse(...) as ModelsConfig` — a bare type cast with no runtime validation. A bad `models.json` silently produces wrong values used throughout the session.

**Files:**
- Modify: `src/config/loader.ts`

**Step 1: Add a Zod schema for ModelsConfig**

In `src/config/loader.ts`, add these imports at the top:
```typescript
import { z } from "zod";
```

Then replace the existing `ModelConfig` and `ModelsConfig` interfaces and `loadModelsConfig` function with:

```typescript
const ModelConfigSchema = z.object({
  provider: z.enum(["openai", "anthropic", "google"]),
  model: z.string(),
});

export type ModelConfig = z.infer<typeof ModelConfigSchema>;

const ModelsConfigSchema = z.object({
  vision: ModelConfigSchema,
  reasoning: ModelConfigSchema,
  analysis: ModelConfigSchema,
  bulk: ModelConfigSchema,
});

export type ModelsConfig = z.infer<typeof ModelsConfigSchema>;

export function loadModelsConfig(): ModelsConfig {
  const filePath = resolve(configDir, "config", "models.json");
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  return ModelsConfigSchema.parse(raw);
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

**Step 3: Commit**

```bash
git add src/config/loader.ts
git commit -m "fix: add Zod validation to loadModelsConfig, remove unsafe type cast"
```

---

### Task 5: Fix browser — make headless configurable

**Problem:** `chromium.launch({ headless: false })` is hardcoded. Fails in CI or any environment without a display server.

**Files:**
- Modify: `src/browser/browser.ts`

**Step 1: Read headless from environment**

In `src/browser/browser.ts`, change line 17 from:
```typescript
const browser = await chromium.launch({ headless: false });
```
To:
```typescript
const headless = process.env.HEADLESS === "true";
const browser = await chromium.launch({ headless });
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

**Step 3: Commit**

```bash
git add src/browser/browser.ts
git commit -m "fix: make headless mode configurable via HEADLESS env var"
```

---

### Task 6: Fix login — remove ambiguous multi-selector

**Problem:** `page.fill('input[type="email"], input[name="email"], #email', ...)` throws Playwright strict mode violation when multiple selectors match (which they will for a standard HTML email field that has both `type="email"` and `name="email"`).

**Files:**
- Modify: `src/browser/login.ts`

**Step 1: Replace multi-selector fill calls with locator().first()**

Replace the entire body of `loginToSeemoreData` with:

```typescript
export async function loginToSeemoreData(page: Page): Promise<void> {
  const baseUrl = process.env.SEEMOREDATA_URL ?? "https://app.seemoredata.com";
  const email = process.env.SEEMOREDATA_EMAIL;
  const password = process.env.SEEMOREDATA_PASSWORD;

  if (!email || !password) {
    throw new Error("SEEMOREDATA_EMAIL and SEEMOREDATA_PASSWORD must be set in .env");
  }

  console.log("Logging in to SeemoreData...");
  await page.goto(baseUrl, { waitUntil: "networkidle" });

  // Use locator().first() to avoid strict mode violations when multiple selectors match
  await page.locator('input[type="email"], input[name="email"], #email').first().fill(email);
  await page.locator('input[type="password"], input[name="password"], #password').first().fill(password);
  await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")').first().click();

  // Wait for redirect away from login page
  await page.waitForURL((url) => !url.pathname.includes("login"), { timeout: 30000 });
  console.log("Login successful.");
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

**Step 3: Commit**

```bash
git add src/browser/login.ts
git commit -m "fix: use locator().first() to avoid strict mode violations on login selectors"
```

---

### Task 7: Fix agent loop — robust JSON extraction + consecutive block escape

**Problem 1:** `reasoningResponse.match(/\{[\s\S]*\}/)` greedy regex fails when the LLM wraps JSON in markdown or includes multiple JSON objects. Claude commonly does both.

**Problem 2:** Consecutive guardrail blocks burn `maxSteps` with no real actions taken, and `guardrail_critical` exit reason is unreachable dead code.

**Files:**
- Modify: `src/agent/prompts.ts`
- Modify: `src/agent/loop.ts`

**Step 1: Update the reasoning prompt to use delimiters**

In `src/agent/prompts.ts`, in `buildReasoningPrompt`, find the line:
```
Respond in this exact JSON format:
```

Change it and the surrounding JSON block instruction to:

```typescript
  return `...
## Instructions
Given what you see on screen and your action history, decide what to do next.
Think AS this persona — with their knowledge gaps, patience level, and behavior style.

Wrap your response in <json> tags like this:
<json>
{
  "observation": "What you see on the current screen",
  "reasoning": "What you think you should do and why (as this persona)",
  "emotion": "How you feel right now (neutral, curious, confused, frustrated, satisfied, etc.) and why",
  "action": { "type": "click|type|scroll|navigate|wait|done|blocked", ...params }
}
</json>

Action types:
- click: { "type": "click", "selector": "CSS selector" }
- type: { "type": "type", "selector": "CSS selector", "text": "text to type" }
- scroll: { "type": "scroll", "direction": "up|down" }
- navigate: { "type": "navigate", "url": "URL" }
- wait: { "type": "wait", "seconds": 2 }
- done: { "type": "done", "reason": "why the task is complete" }
- blocked: { "type": "blocked", "reason": "why you can't proceed" }

IMPORTANT: Output ONLY the <json>...</json> block. No other text outside the tags.
...`;
```

(Keep all the identity/knowledge/behavior sections unchanged — only the Instructions section changes.)

**Step 2: Update JSON extraction in loop.ts**

In `src/agent/loop.ts`:

1. Replace the JSON parsing block (lines ~61-78) with:

```typescript
    // Parse the LLM response — extract from <json> delimiters
    let parsed: { observation: string; reasoning: string; emotion: string; action: Action };
    try {
      const jsonMatch = reasoningResponse.match(/<json>([\s\S]*?)<\/json>/);
      if (!jsonMatch) throw new Error("No <json> block found in response");
      const raw = JSON.parse(jsonMatch[1].trim());
      parsed = {
        observation: raw.observation ?? "",
        reasoning: raw.reasoning ?? "",
        emotion: raw.emotion ?? "",
        action: ActionSchema.parse(raw.action),
      };
    } catch (e) {
      console.error(`  Failed to parse LLM response: ${e}`);
      parsed = {
        observation: screenDescription,
        reasoning: "Failed to parse reasoning",
        emotion: "confused",
        action: { type: "blocked", reason: "Failed to parse LLM response" },
      };
    }
```

2. Add a consecutive block counter before the loop:

```typescript
  let consecutiveBlocks = 0;
```

3. In the guardrail block handler (after `if (guardrailCheck.blocked)`), replace `continue` with:

```typescript
      consecutiveBlocks++;
      if (consecutiveBlocks >= 3) {
        console.log("\n=== Guardrail critical: 3 consecutive blocks, stopping ===");
        logger.save();
        return { exitReason: "guardrail_critical", totalSteps: step, finalMessage: guardrailCheck.reason };
      }
      continue;
```

4. After the action execution block (the `try { await executeAction... }` block), reset the counter:

```typescript
    consecutiveBlocks = 0;
```

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

**Step 4: Commit**

```bash
git add src/agent/prompts.ts src/agent/loop.ts
git commit -m "fix: use <json> delimiter extraction, add consecutive guardrail block escape"
```

---

### Task 8: Fix analyzer — robust JSON extraction + Zod validation of output

**Problem 1:** Same greedy regex issue as the agent loop — Claude's analysis response may include markdown or preamble.

**Problem 2:** `parsed.issues` and `parsed.scorecard` are used without Zod validation. A hallucinated field name produces a silently malformed report.

**Files:**
- Modify: `src/analysis/analyzer.ts`

**Step 1: Update the analysis prompt to use delimiters**

In `analyzeRun`, find the `## Instructions` section in `userMessage`. Change it to:

```typescript
  const userMessage = `...
## Instructions
Analyze this session and wrap your response in <json> tags:
<json>
{
  "issues": [
    {
      "title": "concise issue title",
      "severity": "critical|high|medium|low",
      "flowStep": <step number>,
      "screenshot": "step-NNN.png",
      "whatHappened": "description",
      "whyItsAnIssue": "usability heuristic violated",
      "recommendation": "suggested fix",
      "confidence": "high|medium|low"
    }
  ],
  "scorecard": {
    "taskCompleted": "yes|no|partial",
    "stepsToCompletion": <number>,
    "frictionPoints": <number>,
    "guardrailHits": <number>,
    "confusionMoments": <number>,
    "flowEfficiency": "X steps taken vs Y estimated optimal"
  }
}
</json>

Output ONLY the <json>...</json> block. No other text.`;
```

**Step 2: Import Zod schemas and replace the parsing block**

Add imports at the top of `analyzer.ts`:
```typescript
import { UxIssueSchema, ScorecardSchema } from "../types/index.js";
```

Replace the `try/catch` parsing block (lines ~90-117) with:

```typescript
  try {
    const jsonMatch = response.match(/<json>([\s\S]*?)<\/json>/);
    if (!jsonMatch) throw new Error("No <json> block in analysis response");
    const parsed = JSON.parse(jsonMatch[1].trim());
    return {
      issues: UxIssueSchema.array().parse(parsed.issues ?? []),
      scorecard: ScorecardSchema.parse(parsed.scorecard),
    };
  } catch (e) {
    console.error("Failed to parse analysis response:", e);
    return {
      issues: [],
      scorecard: {
        taskCompleted: "partial",
        stepsToCompletion: decisions.length,
        frictionPoints: 0,
        guardrailHits: guardrailEvents.length,
        confusionMoments: 0,
        flowEfficiency: "unknown",
      },
    };
  }
```

**Step 3: Verify UxIssueSchema and ScorecardSchema are exported from types/index.ts**

```bash
grep -n "UxIssueSchema\|ScorecardSchema" src/types/index.ts src/types/report.ts
```
Expected: Both schemas are defined and exported. If not exported from `index.ts`, add them.

**Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

**Step 5: Commit**

```bash
git add src/analysis/analyzer.ts src/types/index.ts src/types/report.ts
git commit -m "fix: delimiter-based JSON extraction and Zod validation in analyzer"
```

---

### Task 9: Fix report — guard video path

**Problem:** `videoPath: videoFile ?? "video.webm"` writes a broken markdown link when `closeBrowser` returns `null` (no `.webm` file found).

**Files:**
- Modify: `src/analysis/report.ts`

**Step 1: Guard the video link in buildMarkdownReport**

In `buildMarkdownReport`, find:
```typescript
  md += `- Video: [${report.videoPath}](${report.videoPath})\n`;
```

Replace with:
```typescript
  if (report.videoPath) {
    md += `- Video: [${report.videoPath}](${report.videoPath})\n`;
  } else {
    md += `- Video: not recorded\n`;
  }
```

**Step 2: Update the Report type to allow null videoPath**

In `src/types/report.ts`, find the `videoPath` field in the schema:
```typescript
videoPath: z.string(),
```
Change to:
```typescript
videoPath: z.string().nullable(),
```

**Step 3: Update generateReport to pass null cleanly**

In `src/analysis/report.ts`, the `videoFile` parameter is already `string | null`. Change:
```typescript
videoPath: videoFile ?? "video.webm",
```
To:
```typescript
videoPath: videoFile,
```

**Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors. Fix any type errors that surface (likely in report.ts where videoPath was assumed string).

**Step 5: Commit**

```bash
git add src/analysis/report.ts src/types/report.ts
git commit -m "fix: guard video path in report, allow null instead of broken fallback"
```

---

### Task 10: Fix operations guide — correct GOOGLE_AI_API_KEY env var name

**Problem:** `docs/operations-guide.md` line 59 shows `GOOGLE_API_KEY` but the provider code and `.env.example` use `GOOGLE_AI_API_KEY`. This causes silent credential failure.

**Files:**
- Modify: `docs/operations-guide.md`

**Step 1: Fix the env var name**

In `docs/operations-guide.md`, find:
```
GOOGLE_API_KEY=your-google-key-here
```
Replace with:
```
GOOGLE_AI_API_KEY=your-google-key-here
```

**Step 2: Commit**

```bash
git add docs/operations-guide.md
git commit -m "fix: correct GOOGLE_AI_API_KEY env var name in operations guide"
```

---

## Documentation

### Task 11: Complete the trio — CHANGELOG.md and memory/MEMORY.md

**Files:**
- Create: `CHANGELOG.md`
- Create: `memory/MEMORY.md`

**Step 1: Create CHANGELOG.md at project root**

```markdown
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
```

**Step 2: Create memory/MEMORY.md**

```bash
mkdir -p memory
```

```markdown
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
```

**Step 3: Commit**

```bash
git add CHANGELOG.md memory/MEMORY.md
git commit -m "docs: add CHANGELOG.md and memory/MEMORY.md to complete project trio"
```

---

### Task 12: Expand CLAUDE.md and create ARCHITECTURE.md

**Files:**
- Modify: `CLAUDE.md`
- Create: `docs/ARCHITECTURE.md`

**Step 1: Expand CLAUDE.md**

Add the following sections to the existing `CLAUDE.md` (append after the current content):

```markdown
## Module System Rules
- **CommonJS only.** `package.json` has `"type": "commonjs"`.
- Use `__dirname` for path resolution. Never `import.meta.dirname`.
- `tsconfig.json` must stay `"module": "CommonJS"`, `"moduleResolution": "Node"`.
- Runtime: `npx tsx src/main.ts ...` (not `node dist/...`)

## JSON Extraction Pattern
Both the agent loop and analyzer use `<json>` delimiters, not regex:
```typescript
const match = response.match(/<json>([\s\S]*?)<\/json>/);
const data = JSON.parse(match[1].trim());
```
The prompts (`buildReasoningPrompt`, `analyzeRun`) instruct the model to wrap output in `<json>` tags.
Never revert to greedy regex (`/\{[\s\S]*\}/`).

## How to Add a Persona
1. Create `src/personas/<id>.json` — follow structure of `finops.json`
2. Add `flowGoals` for each existing flow
3. No code changes needed

## How to Add a Flow
1. Create `src/flows/<name>.json` — follow structure of `autoclustering-analysis.json`
2. Set `startUrl`, `goal`, `success`, `maxSteps`, optional `guardrailOverrides`
3. Add `flowGoals.<name>` to each persona JSON
4. No code changes needed

## How to Debug a Failed Run
1. Check console output for the error message
2. Open `runs/<run-id>/decision-log.json` — each step shows observation, reasoning, emotion, action
3. Check `runs/<run-id>/guardrail-events.json` if guardrail blocks are suspected
4. Screenshots are in `runs/<run-id>/screenshots/` — correlate with step numbers in the log
5. Video is `runs/<run-id>/*.webm` — open in Chrome or VLC

## Known Fragile Points (check memory/MEMORY.md for full list)
- Login selectors in `src/browser/login.ts` may need updating if the SeemoreData auth page changes
- `<json>` delimiter relies on the LLM following instructions — watch for parse failures in decision-log
- Guardrail text matching blocks any button containing blocked words (e.g., "Apply" blocks "Apply Filter")

## Smoke Test Command
```bash
npx tsx src/main.ts --persona finops --flow query-optimization --max-steps 5
```
This should complete without errors and produce a report in `runs/`.
```

**Step 2: Create docs/ARCHITECTURE.md**

```markdown
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
```

**Step 3: Verify TypeScript still compiles after all changes**

```bash
npx tsc --noEmit
```
Expected: No errors.

**Step 4: Commit**

```bash
git add CLAUDE.md docs/ARCHITECTURE.md
git commit -m "docs: expand CLAUDE.md with contributor guide, add ARCHITECTURE.md internals doc"
```

---

## Final Verification

### Task 13: Full compile check and smoke test prep

**Step 1: Final TypeScript compile**

```bash
npx tsc --noEmit
```
Expected: Zero errors.

**Step 2: Verify CLI still loads**

```bash
npx tsx src/main.ts --help
```
Expected: Help text showing `--persona`, `--flow`, `--max-steps` options. No startup errors.

**Step 3: Confirm all 13 commits are present**

```bash
git log --oneline -15
```
Expected: 13 new commits above the original `4488604` baseline.

**Step 4: Note for smoke test**

The actual smoke test (`npx tsx src/main.ts --persona finops --flow query-optimization --max-steps 5`) requires live SeemoreData credentials in `.env`. This is NOT part of this plan — it requires a human operator with credentials. Document in the run that Task 12 (smoke test) remains pending and note the command to run it.
