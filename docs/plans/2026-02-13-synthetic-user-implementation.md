# Synthetic User Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an AI-powered synthetic user that autonomously navigates SeemoreData's UI, simulates real personas, and produces usability reports with video recordings.

**Architecture:** Single-agent see-think-act loop. Playwright drives the browser and records video. Vision model (GPT-4o) interprets screenshots. Reasoning model (Claude) makes decisions as a persona. Post-run analyzer generates UX reports.

**Tech Stack:** TypeScript, Node.js, Playwright, Anthropic SDK, OpenAI SDK, Google Generative AI SDK, Zod, dotenv

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `src/main.ts` (empty entry point)

**Step 1: Initialize the project**

Run:
```bash
cd C:\Users\OriShavit\documents\github\synthetic_user
npm init -y
```

**Step 2: Install dependencies**

Run:
```bash
npm install playwright @anthropic-ai/sdk openai @google/generative-ai zod dotenv commander
npm install -D typescript @types/node tsx
npx playwright install chromium
```

**Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "declaration": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "runs"]
}
```

**Step 4: Create .env.example**

```
# SeemoreData credentials
SEEMOREDATA_URL=https://app.seemoredata.com
SEEMOREDATA_EMAIL=
SEEMOREDATA_PASSWORD=

# LLM API keys
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_AI_API_KEY=
```

**Step 5: Create .gitignore**

```
node_modules/
dist/
runs/
.env
```

**Step 6: Create empty entry point**

Create `src/main.ts`:
```typescript
console.log("synthetic-user CLI — not yet implemented");
```

**Step 7: Verify it runs**

Run: `npx tsx src/main.ts`
Expected: prints "synthetic-user CLI — not yet implemented"

**Step 8: Commit**

```bash
git add package.json tsconfig.json .env.example .gitignore src/main.ts package-lock.json
git commit -m "chore: scaffold project with dependencies and config"
```

---

### Task 2: Zod Schemas & Types

Define all shared types and validation schemas upfront so every module has a single source of truth.

**Files:**
- Create: `src/types/action.ts`
- Create: `src/types/decision.ts`
- Create: `src/types/persona.ts`
- Create: `src/types/flow.ts`
- Create: `src/types/guardrails.ts`
- Create: `src/types/report.ts`
- Create: `src/types/index.ts`

**Step 1: Create action schema**

Create `src/types/action.ts`:
```typescript
import { z } from "zod";

export const ActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("click"), selector: z.string() }),
  z.object({ type: z.literal("type"), selector: z.string(), text: z.string() }),
  z.object({ type: z.literal("scroll"), direction: z.enum(["up", "down"]) }),
  z.object({ type: z.literal("navigate"), url: z.string() }),
  z.object({ type: z.literal("wait"), seconds: z.number() }),
  z.object({ type: z.literal("done"), reason: z.string() }),
  z.object({ type: z.literal("blocked"), reason: z.string() }),
]);

export type Action = z.infer<typeof ActionSchema>;
```

**Step 2: Create decision schema**

Create `src/types/decision.ts`:
```typescript
import { z } from "zod";
import { ActionSchema } from "./action.js";

export const DecisionSchema = z.object({
  step: z.number(),
  timestamp: z.string(),
  url: z.string(),
  screenshot: z.string(),
  observation: z.string(),
  reasoning: z.string(),
  emotion: z.string(),
  action: ActionSchema,
  guardrailBlocked: z.boolean(),
});

export type Decision = z.infer<typeof DecisionSchema>;
```

**Step 3: Create persona schema**

Create `src/types/persona.ts`:
```typescript
import { z } from "zod";

export const PersonaSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  seniority: z.string(),
  companyContext: z.string(),
  goalOrientation: z.string(),
  domainKnowledge: z.object({
    strong: z.array(z.string()),
    moderate: z.array(z.string()),
    low: z.array(z.string()),
  }),
  skillGaps: z.array(z.string()),
  behaviorTraits: z.array(z.string()),
  patienceLevel: z.enum(["low", "medium", "high"]),
  explorationStyle: z.enum(["linear", "exploratory"]),
  trustInAutomation: z.enum(["low", "medium", "high"]),
  frustrationTriggers: z.array(z.string()),
  typicalQuestions: z.array(z.string()),
  flowGoals: z.record(z.string(), z.string()),
});

export type Persona = z.infer<typeof PersonaSchema>;
```

**Step 4: Create flow schema**

Create `src/types/flow.ts`:
```typescript
import { z } from "zod";

export const FlowSchema = z.object({
  name: z.string(),
  startUrl: z.string(),
  goal: z.string(),
  success: z.string(),
  guardrailOverrides: z
    .object({
      allowedButtonTexts: z.array(z.string()).optional(),
      blockedButtonTexts: z.array(z.string()).optional(),
      blockedSelectors: z.array(z.string()).optional(),
    })
    .optional(),
  maxSteps: z.number().default(30),
});

export type Flow = z.infer<typeof FlowSchema>;
```

**Step 5: Create guardrails schema**

Create `src/types/guardrails.ts`:
```typescript
import { z } from "zod";

export const GuardrailsConfigSchema = z.object({
  blockedButtonTexts: z.array(z.string()),
  blockedSelectors: z.array(z.string()),
  blockedUrlPatterns: z.array(z.string()),
  allowedDomains: z.array(z.string()),
});

export type GuardrailsConfig = z.infer<typeof GuardrailsConfigSchema>;
```

**Step 6: Create report schema**

Create `src/types/report.ts`:
```typescript
import { z } from "zod";

export const UxIssueSchema = z.object({
  title: z.string(),
  severity: z.enum(["critical", "high", "medium", "low"]),
  flowStep: z.number(),
  screenshot: z.string(),
  whatHappened: z.string(),
  whyItsAnIssue: z.string(),
  recommendation: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
});

export const ScorecardSchema = z.object({
  taskCompleted: z.enum(["yes", "no", "partial"]),
  stepsToCompletion: z.number(),
  frictionPoints: z.number(),
  guardrailHits: z.number(),
  confusionMoments: z.number(),
  flowEfficiency: z.string(),
});

export const ReportSchema = z.object({
  runId: z.string(),
  persona: z.string(),
  flow: z.string(),
  timestamp: z.string(),
  issues: z.array(UxIssueSchema),
  scorecard: ScorecardSchema,
  videoPath: z.string(),
  screenshotsDir: z.string(),
});

export type UxIssue = z.infer<typeof UxIssueSchema>;
export type Scorecard = z.infer<typeof ScorecardSchema>;
export type Report = z.infer<typeof ReportSchema>;
```

**Step 7: Create barrel export**

Create `src/types/index.ts`:
```typescript
export * from "./action.js";
export * from "./decision.js";
export * from "./persona.js";
export * from "./flow.js";
export * from "./guardrails.js";
export * from "./report.js";
```

**Step 8: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 9: Commit**

```bash
git add src/types/
git commit -m "feat: add Zod schemas for all shared types"
```

---

### Task 3: Persona & Flow Config Files

**Files:**
- Create: `src/personas/finops.json`
- Create: `src/personas/data-engineer.json`
- Create: `src/flows/query-optimization.json`
- Create: `src/flows/compute-recommendations.json`
- Create: `src/flows/autoclustering-analysis.json`
- Create: `src/config/guardrails.json`
- Create: `src/config/models.json`
- Create: `src/config/loader.ts`

**Step 1: Create FinOps persona**

Create `src/personas/finops.json`:
```json
{
  "id": "finops",
  "name": "Sarah Chen",
  "role": "FinOps Lead",
  "seniority": "Senior",
  "companyContext": "Mid-size tech company with growing Snowflake spend, reports to VP Finance",
  "goalOrientation": "Cost reduction, budget accountability, reporting to finance",
  "domainKnowledge": {
    "strong": ["cost concepts", "billing", "budgets", "cloud spend attribution"],
    "moderate": ["SQL basics", "query concepts", "warehouse sizing"],
    "low": ["query execution plans", "clustering keys", "data engineering internals"]
  },
  "skillGaps": [
    "Cannot read query execution plans",
    "Does not understand clustering key selection",
    "Unfamiliar with warehouse auto-suspend mechanics"
  ],
  "behaviorTraits": [
    "Impatient with technical jargon",
    "Wants clear dollar impact for every action",
    "Looks for quick wins",
    "Scans dashboards before drilling into details"
  ],
  "patienceLevel": "low",
  "explorationStyle": "linear",
  "trustInAutomation": "medium",
  "frustrationTriggers": [
    "Technical language without business context",
    "No dollar amounts shown",
    "Too many steps to reach an answer",
    "Unclear what action to take"
  ],
  "typicalQuestions": [
    "How much can I save?",
    "What is driving this cost?",
    "Which query is costing us the most?",
    "Can I just turn this off?"
  ],
  "flowGoals": {
    "query-optimization": "Find the most expensive query and understand if the Query Agent can reduce its cost",
    "compute-recommendations": "Review SmartPulse recommendations and understand the dollar impact before adding a manual slot",
    "autoclustering-analysis": "Understand if autoclustering recommendations will save money and decide which ones are worth it"
  }
}
```

**Step 2: Create Data Engineer persona**

Create `src/personas/data-engineer.json`:
```json
{
  "id": "data-engineer",
  "name": "Marcus Rivera",
  "role": "Data Platform Engineer",
  "seniority": "Mid-level",
  "companyContext": "Manages Snowflake infrastructure for a data team of 15, responsible for performance and reliability",
  "goalOrientation": "Performance optimization, resource efficiency, reliability",
  "domainKnowledge": {
    "strong": ["SQL", "query plans", "warehouse configuration", "Snowflake architecture"],
    "moderate": ["cost attribution", "FinOps concepts", "budget reporting"],
    "low": ["business finance framing", "executive reporting", "ROI calculations"]
  },
  "skillGaps": [
    "Does not naturally connect technical optimizations to dollar savings",
    "May overlook business impact when focused on performance",
    "Not familiar with FinOps terminology"
  ],
  "behaviorTraits": [
    "Methodical and thorough",
    "Wants to understand root cause before acting",
    "Reads details and documentation carefully",
    "Explores all options before deciding",
    "Comfortable with technical complexity"
  ],
  "patienceLevel": "high",
  "explorationStyle": "exploratory",
  "trustInAutomation": "low",
  "frustrationTriggers": [
    "Lack of technical detail",
    "Cannot see the underlying query or config",
    "Recommendations without explanation",
    "No way to verify before applying"
  ],
  "typicalQuestions": [
    "What is the execution plan?",
    "Will this break anything?",
    "What is the query doing under the hood?",
    "Can I see the before and after?"
  ],
  "flowGoals": {
    "query-optimization": "Find a problematic query, understand its execution characteristics, and evaluate Query Agent suggestions technically",
    "compute-recommendations": "Review SmartPulse recommendations with attention to performance impact, not just cost, and test a manual slot",
    "autoclustering-analysis": "Evaluate each autoclustering recommendation on technical merit — table size, query patterns, expected performance gain"
  }
}
```

**Step 3: Create flow configs**

Create `src/flows/query-optimization.json`:
```json
{
  "name": "query-optimization",
  "startUrl": "/queries",
  "goal": "Find the most expensive, long-running query and check if the Seemore Query Agent can suggest optimizations for it.",
  "success": "Agent has reviewed optimization suggestions from the Query Agent.",
  "guardrailOverrides": {
    "blockedButtonTexts": ["Apply", "Execute", "Run Optimization"]
  },
  "maxSteps": 30
}
```

Create `src/flows/compute-recommendations.json`:
```json
{
  "name": "compute-recommendations",
  "startUrl": "/compute",
  "goal": "Find a warehouse that has SmartPulse recommendations, review the recommendations, and add a one-time manual slot.",
  "success": "Agent has added a manual slot and reviewed recommendations.",
  "guardrailOverrides": {
    "allowedButtonTexts": ["Add Manual Slot", "Add Slot"],
    "blockedButtonTexts": ["Apply Configuration", "Apply Changes", "Save Configuration"]
  },
  "maxSteps": 30
}
```

Create `src/flows/autoclustering-analysis.json`:
```json
{
  "name": "autoclustering-analysis",
  "startUrl": "/autoclustering",
  "goal": "Generate an autoclustering analysis, go through the recommendations, and decide whether each recommendation is worth using or not.",
  "success": "Agent has reviewed all recommendations and made a decision on each.",
  "guardrailOverrides": {
    "blockedButtonTexts": ["Apply Clustering", "Apply Changes", "Apply All"]
  },
  "maxSteps": 30
}
```

**Step 4: Create guardrails config**

Create `src/config/guardrails.json`:
```json
{
  "blockedButtonTexts": [
    "Apply", "Save", "Confirm", "Enable", "Disable", "Delete", "Submit",
    "Apply Changes", "Save Changes", "Confirm Changes"
  ],
  "blockedSelectors": [],
  "blockedUrlPatterns": ["/apply", "/save", "/confirm", "/delete"],
  "allowedDomains": ["app.seemoredata.com", "seemoredata.com"]
}
```

**Step 5: Create models config**

Create `src/config/models.json`:
```json
{
  "vision": { "provider": "openai", "model": "gpt-4o" },
  "reasoning": { "provider": "anthropic", "model": "claude-sonnet-4-5-20250929" },
  "analysis": { "provider": "anthropic", "model": "claude-sonnet-4-5-20250929" },
  "bulk": { "provider": "google", "model": "gemini-2.0-flash" }
}
```

**Step 6: Create config loader**

Create `src/config/loader.ts`:
```typescript
import { readFileSync } from "fs";
import { resolve } from "path";
import { PersonaSchema, FlowSchema, GuardrailsConfigSchema } from "../types/index.js";
import type { Persona, Flow, GuardrailsConfig } from "../types/index.js";

const configDir = resolve(import.meta.dirname, "..");

export function loadPersona(personaId: string): Persona {
  const filePath = resolve(configDir, "personas", `${personaId}.json`);
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  return PersonaSchema.parse(raw);
}

export function loadFlow(flowName: string): Flow {
  const filePath = resolve(configDir, "flows", `${flowName}.json`);
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  return FlowSchema.parse(raw);
}

export function loadGuardrails(): GuardrailsConfig {
  const filePath = resolve(configDir, "config", "guardrails.json");
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  return GuardrailsConfigSchema.parse(raw);
}

export interface ModelConfig {
  provider: "openai" | "anthropic" | "google";
  model: string;
}

export interface ModelsConfig {
  vision: ModelConfig;
  reasoning: ModelConfig;
  analysis: ModelConfig;
  bulk: ModelConfig;
}

export function loadModelsConfig(): ModelsConfig {
  const filePath = resolve(configDir, "config", "models.json");
  return JSON.parse(readFileSync(filePath, "utf-8")) as ModelsConfig;
}
```

**Step 7: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 8: Commit**

```bash
git add src/personas/ src/flows/ src/config/
git commit -m "feat: add persona, flow, guardrails, and model configs with loader"
```

---

### Task 4: LLM Provider Clients & Model Router

**Files:**
- Create: `src/llm/providers/anthropic.ts`
- Create: `src/llm/providers/openai.ts`
- Create: `src/llm/providers/google.ts`
- Create: `src/llm/router.ts`

**Step 1: Create Anthropic client**

Create `src/llm/providers/anthropic.ts`:
```typescript
import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export async function callAnthropic(
  systemPrompt: string,
  userMessage: string,
  model: string
): Promise<string> {
  const response = await getClient().messages.create({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });
  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type from Anthropic");
  return block.text;
}
```

**Step 2: Create OpenAI client**

Create `src/llm/providers/openai.ts`:
```typescript
import OpenAI from "openai";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export async function callOpenAIVision(
  systemPrompt: string,
  textMessage: string,
  screenshotBase64: string,
  model: string
): Promise<string> {
  const response = await getClient().chat.completions.create({
    model,
    max_tokens: 4096,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: textMessage },
          {
            type: "image_url",
            image_url: { url: `data:image/png;base64,${screenshotBase64}`, detail: "high" },
          },
        ],
      },
    ],
  });
  return response.choices[0].message.content ?? "";
}
```

**Step 3: Create Google client**

Create `src/llm/providers/google.ts`:
```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!client) {
    client = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY ?? "");
  }
  return client;
}

export async function callGemini(
  systemPrompt: string,
  userMessage: string,
  model: string
): Promise<string> {
  const genModel = getClient().getGenerativeModel({
    model,
    systemInstruction: systemPrompt,
  });
  const result = await genModel.generateContent(userMessage);
  return result.response.text();
}
```

**Step 4: Create model router**

Create `src/llm/router.ts`:
```typescript
import { loadModelsConfig, type ModelConfig } from "../config/loader.js";
import { callAnthropic } from "./providers/anthropic.js";
import { callOpenAIVision } from "./providers/openai.js";
import { callGemini } from "./providers/google.js";

export type TaskType = "vision" | "reasoning" | "analysis" | "bulk";

const modelsConfig = loadModelsConfig();

function getModelConfig(taskType: TaskType): ModelConfig {
  return modelsConfig[taskType];
}

export async function routeVision(
  systemPrompt: string,
  textMessage: string,
  screenshotBase64: string
): Promise<string> {
  const config = getModelConfig("vision");
  if (config.provider === "openai") {
    return callOpenAIVision(systemPrompt, textMessage, screenshotBase64, config.model);
  }
  throw new Error(`Vision not supported for provider: ${config.provider}`);
}

export async function routeReasoning(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const config = getModelConfig("reasoning");
  switch (config.provider) {
    case "anthropic":
      return callAnthropic(systemPrompt, userMessage, config.model);
    case "openai":
      return callOpenAIVision(systemPrompt, userMessage, "", config.model);
    case "google":
      return callGemini(systemPrompt, userMessage, config.model);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

export async function routeAnalysis(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const config = getModelConfig("analysis");
  switch (config.provider) {
    case "anthropic":
      return callAnthropic(systemPrompt, userMessage, config.model);
    case "openai":
      return callOpenAIVision(systemPrompt, userMessage, "", config.model);
    case "google":
      return callGemini(systemPrompt, userMessage, config.model);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}
```

**Step 5: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 6: Commit**

```bash
git add src/llm/
git commit -m "feat: add LLM provider clients and model router"
```

---

### Task 5: Browser Layer (Playwright)

**Files:**
- Create: `src/browser/browser.ts`
- Create: `src/browser/actions.ts`

**Step 1: Create browser manager**

Create `src/browser/browser.ts`:
```typescript
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { mkdirSync } from "fs";
import { resolve } from "path";

export interface BrowserSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  runDir: string;
  screenshotsDir: string;
}

export async function launchBrowser(runDir: string): Promise<BrowserSession> {
  const screenshotsDir = resolve(runDir, "screenshots");
  mkdirSync(screenshotsDir, { recursive: true });

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: runDir, size: { width: 1920, height: 1080 } },
  });
  const page = await context.newPage();

  return { browser, context, page, runDir, screenshotsDir };
}

export async function takeScreenshot(
  session: BrowserSession,
  stepNumber: number
): Promise<{ path: string; base64: string }> {
  const filename = `step-${String(stepNumber).padStart(3, "0")}.png`;
  const filepath = resolve(session.screenshotsDir, filename);
  const buffer = await session.page.screenshot({ fullPage: false, path: filepath });
  return { path: filename, base64: buffer.toString("base64") };
}

export async function closeBrowser(session: BrowserSession): Promise<string | null> {
  await session.context.close(); // triggers video save
  await session.browser.close();

  // Find the video file that Playwright created
  const { readdirSync } = await import("fs");
  const files = readdirSync(session.runDir).filter((f) => f.endsWith(".webm"));
  return files.length > 0 ? files[0] : null;
}
```

**Step 2: Create actions module**

Create `src/browser/actions.ts`:
```typescript
import type { Page } from "playwright";
import type { Action } from "../types/index.js";

export async function executeAction(page: Page, action: Action): Promise<void> {
  switch (action.type) {
    case "click":
      await page.click(action.selector, { timeout: 10000 });
      break;
    case "type":
      await page.fill(action.selector, action.text);
      break;
    case "scroll":
      await page.mouse.wheel(0, action.direction === "down" ? 500 : -500);
      break;
    case "navigate":
      await page.goto(action.url, { waitUntil: "networkidle" });
      break;
    case "wait":
      await page.waitForTimeout(action.seconds * 1000);
      break;
    case "done":
    case "blocked":
      // These are exit signals, not browser actions
      break;
  }
}

export async function waitForPageSettle(page: Page): Promise<void> {
  try {
    await page.waitForLoadState("networkidle", { timeout: 5000 });
  } catch {
    // Timeout is acceptable — page may have persistent connections
  }
}

export async function getPageState(page: Page): Promise<{ url: string; title: string }> {
  return {
    url: page.url(),
    title: await page.title(),
  };
}
```

**Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 4: Commit**

```bash
git add src/browser/
git commit -m "feat: add Playwright browser layer with video and screenshot support"
```

---

### Task 6: Recording Layer (Logger)

**Files:**
- Create: `src/recording/logger.ts`

**Step 1: Create the logger**

Create `src/recording/logger.ts`:
```typescript
import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import type { Decision, Action } from "../types/index.js";

export interface ActionLogEntry {
  step: number;
  timestamp: string;
  action: Action;
  url: string;
  guardrailBlocked: boolean;
}

export interface GuardrailEvent {
  step: number;
  timestamp: string;
  intendedAction: Action;
  reason: string;
  screenshot: string;
  expectedEndOfFlow: boolean;
}

export class RunLogger {
  private decisions: Decision[] = [];
  private actions: ActionLogEntry[] = [];
  private guardrailEvents: GuardrailEvent[] = [];
  private runDir: string;

  constructor(runDir: string) {
    this.runDir = runDir;
    mkdirSync(runDir, { recursive: true });
  }

  logDecision(decision: Decision): void {
    this.decisions.push(decision);
  }

  logAction(entry: ActionLogEntry): void {
    this.actions.push(entry);
  }

  logGuardrailEvent(event: GuardrailEvent): void {
    this.guardrailEvents.push(event);
  }

  getDecisions(): Decision[] {
    return this.decisions;
  }

  getActions(): ActionLogEntry[] {
    return this.actions;
  }

  getGuardrailEvents(): GuardrailEvent[] {
    return this.guardrailEvents;
  }

  save(): void {
    writeFileSync(
      resolve(this.runDir, "decision-log.json"),
      JSON.stringify(this.decisions, null, 2)
    );
    writeFileSync(
      resolve(this.runDir, "action-log.json"),
      JSON.stringify(this.actions, null, 2)
    );
    if (this.guardrailEvents.length > 0) {
      writeFileSync(
        resolve(this.runDir, "guardrail-events.json"),
        JSON.stringify(this.guardrailEvents, null, 2)
      );
    }
  }
}
```

**Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add src/recording/
git commit -m "feat: add recording layer for action, decision, and guardrail logs"
```

---

### Task 7: Guardrails System

**Files:**
- Create: `src/agent/guardrails.ts`

**Step 1: Create the guardrails module**

Create `src/agent/guardrails.ts`:
```typescript
import type { Page } from "playwright";
import type { Action } from "../types/index.js";
import type { GuardrailsConfig } from "../types/index.js";
import type { Flow } from "../types/index.js";

export interface GuardrailCheck {
  blocked: boolean;
  reason: string;
}

export class Guardrails {
  private config: GuardrailsConfig;
  private flowOverrides: Flow["guardrailOverrides"];

  constructor(config: GuardrailsConfig, flowOverrides?: Flow["guardrailOverrides"]) {
    this.config = config;
    this.flowOverrides = flowOverrides;
  }

  async checkAction(page: Page, action: Action): Promise<GuardrailCheck> {
    if (action.type === "done" || action.type === "blocked" || action.type === "wait") {
      return { blocked: false, reason: "" };
    }

    if (action.type === "navigate") {
      return this.checkNavigation(action.url);
    }

    if (action.type === "click") {
      return this.checkClick(page, action.selector);
    }

    return { blocked: false, reason: "" };
  }

  private checkNavigation(url: string): GuardrailCheck {
    // Check URL patterns
    for (const pattern of this.config.blockedUrlPatterns) {
      if (url.includes(pattern)) {
        return { blocked: true, reason: `URL matches blocked pattern: ${pattern}` };
      }
    }

    // Check domain boundary
    if (url.startsWith("http")) {
      try {
        const hostname = new URL(url).hostname;
        const allowed = this.config.allowedDomains.some(
          (d) => hostname === d || hostname.endsWith(`.${d}`)
        );
        if (!allowed) {
          return { blocked: true, reason: `Navigation outside allowed domains: ${hostname}` };
        }
      } catch {
        return { blocked: true, reason: `Invalid URL: ${url}` };
      }
    }

    return { blocked: false, reason: "" };
  }

  private async checkClick(page: Page, selector: string): Promise<GuardrailCheck> {
    // Check blocked selectors
    for (const blockedSelector of this.config.blockedSelectors) {
      if (selector === blockedSelector) {
        return { blocked: true, reason: `Selector matches blocklist: ${selector}` };
      }
    }

    // Merge global + flow-specific blocked texts
    const blockedTexts = [...this.config.blockedButtonTexts];
    if (this.flowOverrides?.blockedButtonTexts) {
      blockedTexts.push(...this.flowOverrides.blockedButtonTexts);
    }

    // Remove flow-allowed texts from blocklist
    const allowedTexts = this.flowOverrides?.allowedButtonTexts ?? [];

    // Get the text of the element being clicked
    try {
      const elementText = await page.$eval(selector, (el) => el.textContent?.trim() ?? "");

      // Check if explicitly allowed by flow override
      for (const allowed of allowedTexts) {
        if (elementText.toLowerCase().includes(allowed.toLowerCase())) {
          return { blocked: false, reason: "" };
        }
      }

      // Check if blocked
      for (const blocked of blockedTexts) {
        if (elementText.toLowerCase().includes(blocked.toLowerCase())) {
          return {
            blocked: true,
            reason: `Button text matches blocklist: "${elementText}" contains "${blocked}"`,
          };
        }
      }
    } catch {
      // If we can't read the element text, allow the action
    }

    return { blocked: false, reason: "" };
  }
}
```

**Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add src/agent/guardrails.ts
git commit -m "feat: add guardrails system with action blocklist and domain boundary"
```

---

### Task 8: Agent Loop — The Core

**Files:**
- Create: `src/agent/prompts.ts`
- Create: `src/agent/loop.ts`

**Step 1: Create prompt templates**

Create `src/agent/prompts.ts`:
```typescript
import type { Persona, Flow, Decision } from "../types/index.js";

export function buildVisionPrompt(): string {
  return `You are a UI analysis assistant. Describe what you see on the screen in detail.
Focus on:
- Page layout and main content areas
- Interactive elements (buttons, links, inputs, dropdowns, tabs)
- Data displayed (tables, charts, numbers, labels)
- Navigation elements and current location
- Any alerts, notifications, or status messages
- Loading states, errors, or empty states

Be factual and specific. Include exact text of buttons and labels.
Respond in plain text, no markdown.`;
}

export function buildReasoningPrompt(persona: Persona, flow: Flow): string {
  return `You are simulating a synthetic user for usability testing. You ARE this person:

## Your Identity
- Name: ${persona.name}
- Role: ${persona.role} (${persona.seniority})
- Context: ${persona.companyContext}

## Your Knowledge
- Strong: ${persona.domainKnowledge.strong.join(", ")}
- Moderate: ${persona.domainKnowledge.moderate.join(", ")}
- Weak/Unknown: ${persona.domainKnowledge.low.join(", ")}

## Your Skill Gaps
${persona.skillGaps.map((g) => `- ${g}`).join("\n")}

## Your Behavior
${persona.behaviorTraits.map((t) => `- ${t}`).join("\n")}
- Patience: ${persona.patienceLevel}
- Exploration style: ${persona.explorationStyle}
- Trust in automation: ${persona.trustInAutomation}

## What Frustrates You
${persona.frustrationTriggers.map((t) => `- ${t}`).join("\n")}

## Your Current Task
Flow: ${flow.name}
Goal: ${flow.goal}
Success: ${flow.success}
Your personal goal: ${persona.flowGoals[flow.name] ?? flow.goal}

## Instructions
Given what you see on screen and your action history, decide what to do next.
Think AS this persona — with their knowledge gaps, patience level, and behavior style.

Respond in this exact JSON format:
{
  "observation": "What you see on the current screen",
  "reasoning": "What you think you should do and why (as this persona)",
  "emotion": "How you feel right now (neutral, curious, confused, frustrated, satisfied, etc.) and why",
  "action": { "type": "click|type|scroll|navigate|wait|done|blocked", ...params }
}

Action types:
- click: { "type": "click", "selector": "CSS selector" }
- type: { "type": "type", "selector": "CSS selector", "text": "text to type" }
- scroll: { "type": "scroll", "direction": "up|down" }
- navigate: { "type": "navigate", "url": "URL" }
- wait: { "type": "wait", "seconds": 2 }
- done: { "type": "done", "reason": "why the task is complete" }
- blocked: { "type": "blocked", "reason": "why you can't proceed" }

IMPORTANT: For CSS selectors, use visible text-based selectors when possible:
- button:has-text("Button Text")
- a:has-text("Link Text")
- [placeholder="Search..."]
- text="Exact text"`;
}

export function buildReasoningUserMessage(
  screenDescription: string,
  history: Decision[],
  guardrailFeedback?: string
): string {
  let message = `## Current Screen\n${screenDescription}\n\n`;

  if (history.length > 0) {
    message += `## Action History (last ${Math.min(history.length, 10)} steps)\n`;
    const recentHistory = history.slice(-10);
    for (const step of recentHistory) {
      message += `Step ${step.step}: ${step.action.type} → ${step.emotion}\n`;
      message += `  Observation: ${step.observation}\n`;
    }
    message += "\n";
  }

  if (guardrailFeedback) {
    message += `## Guardrail Feedback\n${guardrailFeedback}\n\n`;
  }

  message += "## What do you do next?\nRespond with the JSON format specified in your instructions.";
  return message;
}
```

**Step 2: Create the agent loop**

Create `src/agent/loop.ts`:
```typescript
import type { Persona, Flow, Decision, Action } from "../types/index.js";
import type { BrowserSession } from "../browser/browser.js";
import { takeScreenshot } from "../browser/browser.js";
import { executeAction, waitForPageSettle, getPageState } from "../browser/actions.js";
import { routeVision, routeReasoning } from "../llm/router.js";
import { buildVisionPrompt, buildReasoningPrompt, buildReasoningUserMessage } from "./prompts.js";
import { Guardrails, type GuardrailCheck } from "./guardrails.js";
import { RunLogger } from "../recording/logger.js";
import { ActionSchema } from "../types/index.js";

interface AgentLoopResult {
  exitReason: "done" | "blocked" | "max_steps" | "guardrail_critical";
  totalSteps: number;
  finalMessage: string;
}

export async function runAgentLoop(
  session: BrowserSession,
  persona: Persona,
  flow: Flow,
  guardrails: Guardrails,
  logger: RunLogger
): Promise<AgentLoopResult> {
  const decisions: Decision[] = [];
  const systemVision = buildVisionPrompt();
  const systemReasoning = buildReasoningPrompt(persona, flow);

  // Navigate to starting URL
  const baseUrl = process.env.SEEMOREDATA_URL ?? "https://app.seemoredata.com";
  const startUrl = `${baseUrl}${flow.startUrl}`;
  await session.page.goto(startUrl, { waitUntil: "networkidle" });

  let guardrailFeedback: string | undefined;

  for (let step = 1; step <= flow.maxSteps; step++) {
    console.log(`\n--- Step ${step}/${flow.maxSteps} ---`);

    // SEE: capture screenshot and page state
    const screenshot = await takeScreenshot(session, step);
    const pageState = await getPageState(session.page);
    console.log(`  URL: ${pageState.url}`);

    // SEE: vision model describes the screen
    const screenDescription = await routeVision(
      systemVision,
      "Describe what you see on this screen.",
      screenshot.base64
    );
    console.log(`  Vision: ${screenDescription.substring(0, 100)}...`);

    // THINK: reasoning model decides next action
    const reasoningResponse = await routeReasoning(
      systemReasoning,
      buildReasoningUserMessage(screenDescription, decisions, guardrailFeedback)
    );
    guardrailFeedback = undefined; // Reset after use

    // Parse the LLM response
    let parsed: { observation: string; reasoning: string; emotion: string; action: Action };
    try {
      const jsonMatch = reasoningResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      const raw = JSON.parse(jsonMatch[0]);
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

    console.log(`  Action: ${parsed.action.type}`);
    console.log(`  Emotion: ${parsed.emotion}`);

    // Check guardrails before acting
    const guardrailCheck: GuardrailCheck = await guardrails.checkAction(
      session.page,
      parsed.action
    );

    // Log the decision
    const decision: Decision = {
      step,
      timestamp: new Date().toISOString(),
      url: pageState.url,
      screenshot: screenshot.path,
      observation: parsed.observation,
      reasoning: parsed.reasoning,
      emotion: parsed.emotion,
      action: parsed.action,
      guardrailBlocked: guardrailCheck.blocked,
    };
    decisions.push(decision);
    logger.logDecision(decision);
    logger.logAction({
      step,
      timestamp: decision.timestamp,
      action: parsed.action,
      url: pageState.url,
      guardrailBlocked: guardrailCheck.blocked,
    });

    // Handle guardrail block
    if (guardrailCheck.blocked) {
      console.log(`  GUARDRAIL BLOCKED: ${guardrailCheck.reason}`);
      logger.logGuardrailEvent({
        step,
        timestamp: decision.timestamp,
        intendedAction: parsed.action,
        reason: guardrailCheck.reason,
        screenshot: screenshot.path,
        expectedEndOfFlow: parsed.action.type === "done",
      });
      guardrailFeedback = `Your previous action was blocked by a safety guardrail: ${guardrailCheck.reason}. You cannot perform this action. Continue with an alternative approach or declare done/blocked.`;
      continue;
    }

    // Handle exit conditions
    if (parsed.action.type === "done") {
      console.log(`\n=== Flow complete: ${parsed.action.reason} ===`);
      return { exitReason: "done", totalSteps: step, finalMessage: parsed.action.reason };
    }
    if (parsed.action.type === "blocked") {
      console.log(`\n=== Flow blocked: ${parsed.action.reason} ===`);
      return { exitReason: "blocked", totalSteps: step, finalMessage: parsed.action.reason };
    }

    // ACT: execute the action
    try {
      await executeAction(session.page, parsed.action);
      await waitForPageSettle(session.page);
    } catch (e) {
      console.error(`  Action failed: ${e}`);
      guardrailFeedback = `Your previous action failed with error: ${e}. Try a different approach.`;
    }
  }

  console.log("\n=== Max steps reached ===");
  return { exitReason: "max_steps", totalSteps: flow.maxSteps, finalMessage: "Maximum steps reached" };
}
```

**Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 4: Commit**

```bash
git add src/agent/
git commit -m "feat: add agent loop with see-think-act cycle and prompt templates"
```

---

### Task 9: Login Flow

**Files:**
- Create: `src/browser/login.ts`

**Step 1: Create login module**

Create `src/browser/login.ts`:
```typescript
import type { Page } from "playwright";

export async function loginToSeemoreData(page: Page): Promise<void> {
  const baseUrl = process.env.SEEMOREDATA_URL ?? "https://app.seemoredata.com";
  const email = process.env.SEEMOREDATA_EMAIL;
  const password = process.env.SEEMOREDATA_PASSWORD;

  if (!email || !password) {
    throw new Error("SEEMOREDATA_EMAIL and SEEMOREDATA_PASSWORD must be set in .env");
  }

  console.log("Logging in to SeemoreData...");
  await page.goto(baseUrl, { waitUntil: "networkidle" });

  // Fill login form — selectors may need adjustment for the actual login page
  await page.fill('input[type="email"], input[name="email"], #email', email);
  await page.fill('input[type="password"], input[name="password"], #password', password);
  await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")');

  // Wait for login to complete
  await page.waitForURL((url) => !url.pathname.includes("login"), { timeout: 30000 });
  console.log("Login successful.");
}
```

**Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add src/browser/login.ts
git commit -m "feat: add login flow for SeemoreData"
```

---

### Task 10: Analysis & Report Generation

**Files:**
- Create: `src/analysis/analyzer.ts`
- Create: `src/analysis/report.ts`

**Step 1: Create the analyzer**

Create `src/analysis/analyzer.ts`:
```typescript
import { routeAnalysis } from "../llm/router.js";
import type { Decision } from "../types/index.js";
import type { Persona, Flow } from "../types/index.js";
import type { UxIssue, Scorecard } from "../types/index.js";
import type { GuardrailEvent } from "../recording/logger.js";

interface AnalysisResult {
  issues: UxIssue[];
  scorecard: Scorecard;
}

export async function analyzeRun(
  decisions: Decision[],
  guardrailEvents: GuardrailEvent[],
  persona: Persona,
  flow: Flow,
  exitReason: string
): Promise<AnalysisResult> {
  const systemPrompt = `You are a senior UX researcher analyzing a usability test session.
A synthetic user (AI persona) navigated a SaaS product. Your job is to identify real UX issues
from the session data.

IMPORTANT: Distinguish between:
- Real UX issues (things that would confuse a real user with this persona's background)
- Agent confusion (the AI misunderstood something that a real user would not)

Rate your confidence accordingly. Only flag issues you believe a real user would also experience.

Use standard usability heuristics:
- Visibility of system status
- Match between system and real world
- User control and freedom
- Consistency and standards
- Error prevention
- Recognition rather than recall
- Flexibility and efficiency of use
- Aesthetic and minimalist design
- Help users recognize, diagnose, and recover from errors
- Help and documentation`;

  const userMessage = `## Persona
Role: ${persona.role} (${persona.name})
Knowledge: Strong in ${persona.domainKnowledge.strong.join(", ")}; Weak in ${persona.domainKnowledge.low.join(", ")}
Patience: ${persona.patienceLevel}
Frustration triggers: ${persona.frustrationTriggers.join(", ")}

## Flow
Name: ${flow.name}
Goal: ${flow.goal}
Exit reason: ${exitReason}

## Session Data (${decisions.length} steps)
${decisions
  .map(
    (d) =>
      `Step ${d.step}: [${d.emotion}] ${d.observation}\n  Reasoning: ${d.reasoning}\n  Action: ${d.action.type}${d.guardrailBlocked ? " (BLOCKED)" : ""}`
  )
  .join("\n\n")}

## Guardrail Events
${guardrailEvents.length === 0 ? "None" : guardrailEvents.map((g) => `Step ${g.step}: ${g.reason}`).join("\n")}

## Instructions
Analyze this session and respond with this exact JSON:
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
}`;

  const response = await routeAnalysis(systemPrompt, userMessage);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in analysis response");
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      issues: parsed.issues ?? [],
      scorecard: parsed.scorecard ?? {
        taskCompleted: "partial",
        stepsToCompletion: decisions.length,
        frictionPoints: 0,
        guardrailHits: guardrailEvents.length,
        confusionMoments: 0,
        flowEfficiency: "unknown",
      },
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
}
```

**Step 2: Create report generator**

Create `src/analysis/report.ts`:
```typescript
import { writeFileSync } from "fs";
import { resolve } from "path";
import type { Report, UxIssue, Scorecard } from "../types/index.js";

export function generateReport(
  runDir: string,
  runId: string,
  persona: string,
  flow: string,
  issues: UxIssue[],
  scorecard: Scorecard,
  videoFile: string | null
): Report {
  const report: Report = {
    runId,
    persona,
    flow,
    timestamp: new Date().toISOString(),
    issues,
    scorecard,
    videoPath: videoFile ?? "video.webm",
    screenshotsDir: "screenshots/",
  };

  // Save JSON report
  writeFileSync(resolve(runDir, "report.json"), JSON.stringify(report, null, 2));

  // Save Markdown report
  const md = buildMarkdownReport(report);
  writeFileSync(resolve(runDir, "report.md"), md);

  return report;
}

function buildMarkdownReport(report: Report): string {
  let md = `# Usability Test Report\n\n`;
  md += `**Run ID:** ${report.runId}\n`;
  md += `**Persona:** ${report.persona}\n`;
  md += `**Flow:** ${report.flow}\n`;
  md += `**Date:** ${report.timestamp}\n\n`;

  md += `---\n\n## Scorecard\n\n`;
  md += `| Metric | Value |\n|---|---|\n`;
  md += `| Task Completed | ${report.scorecard.taskCompleted} |\n`;
  md += `| Steps to Completion | ${report.scorecard.stepsToCompletion} |\n`;
  md += `| Friction Points | ${report.scorecard.frictionPoints} |\n`;
  md += `| Guardrail Hits | ${report.scorecard.guardrailHits} |\n`;
  md += `| Confusion Moments | ${report.scorecard.confusionMoments} |\n`;
  md += `| Flow Efficiency | ${report.scorecard.flowEfficiency} |\n\n`;

  md += `---\n\n## UX Issues (${report.issues.length})\n\n`;

  if (report.issues.length === 0) {
    md += `No issues detected.\n\n`;
  } else {
    for (const [i, issue] of report.issues.entries()) {
      md += `### ${i + 1}. ${issue.title}\n\n`;
      md += `- **Severity:** ${issue.severity}\n`;
      md += `- **Step:** ${issue.flowStep}\n`;
      md += `- **Screenshot:** ${issue.screenshot}\n`;
      md += `- **Confidence:** ${issue.confidence}\n\n`;
      md += `**What happened:** ${issue.whatHappened}\n\n`;
      md += `**Why it's an issue:** ${issue.whyItsAnIssue}\n\n`;
      md += `**Recommendation:** ${issue.recommendation}\n\n`;
      md += `---\n\n`;
    }
  }

  md += `## Artifacts\n\n`;
  md += `- Video: [${report.videoPath}](${report.videoPath})\n`;
  md += `- Screenshots: [${report.screenshotsDir}](${report.screenshotsDir})\n`;

  return md;
}
```

**Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 4: Commit**

```bash
git add src/analysis/
git commit -m "feat: add post-run analyzer and report generator"
```

---

### Task 11: CLI Entry Point (main.ts)

**Files:**
- Modify: `src/main.ts`

**Step 1: Write the CLI entry point**

Replace `src/main.ts` with:
```typescript
import "dotenv/config";
import { Command } from "commander";
import { resolve } from "path";
import { loadPersona, loadFlow, loadGuardrails } from "./config/loader.js";
import { launchBrowser, closeBrowser } from "./browser/browser.js";
import { loginToSeemoreData } from "./browser/login.js";
import { Guardrails } from "./agent/guardrails.js";
import { RunLogger } from "./recording/logger.js";
import { runAgentLoop } from "./agent/loop.js";
import { analyzeRun } from "./analysis/analyzer.js";
import { generateReport } from "./analysis/report.js";

const program = new Command();

program
  .name("synthetic-user")
  .description("AI-powered synthetic user for SeemoreData usability testing")
  .requiredOption("--persona <id>", "Persona ID (finops or data-engineer)")
  .requiredOption("--flow <name>", "Flow name (query-optimization, compute-recommendations, autoclustering-analysis)")
  .option("--max-steps <n>", "Override max steps", parseInt)
  .action(async (opts) => {
    const { persona: personaId, flow: flowName, maxSteps } = opts;

    console.log(`\n=== Synthetic User Test Run ===`);
    console.log(`Persona: ${personaId}`);
    console.log(`Flow: ${flowName}\n`);

    // Load configs
    const persona = loadPersona(personaId);
    const flow = loadFlow(flowName);
    if (maxSteps) flow.maxSteps = maxSteps;
    const guardrailsConfig = loadGuardrails();

    // Create run directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
    const runId = `${timestamp}_${personaId}_${flowName}`;
    const runDir = resolve("runs", runId);

    // Initialize components
    const logger = new RunLogger(runDir);
    const guardrails = new Guardrails(guardrailsConfig, flow.guardrailOverrides);

    // Launch browser
    const session = await launchBrowser(runDir);

    try {
      // Login
      await loginToSeemoreData(session.page);

      // Run the agent loop
      const result = await runAgentLoop(session, persona, flow, guardrails, logger);

      // Save logs
      logger.save();

      // Close browser and get video file
      const videoFile = await closeBrowser(session);

      // Analyze the run
      console.log("\n=== Analyzing session... ===");
      const analysis = await analyzeRun(
        logger.getDecisions(),
        logger.getGuardrailEvents(),
        persona,
        flow,
        result.exitReason
      );

      // Generate report
      const report = generateReport(
        runDir,
        runId,
        personaId,
        flowName,
        analysis.issues,
        analysis.scorecard,
        videoFile
      );

      console.log(`\n=== Report generated ===`);
      console.log(`Issues found: ${report.issues.length}`);
      console.log(`Task completed: ${report.scorecard.taskCompleted}`);
      console.log(`Output: ${runDir}`);
    } catch (e) {
      console.error("Run failed:", e);
      logger.save();
      await closeBrowser(session);
      process.exit(1);
    }
  });

program.parse();
```

**Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 3: Verify CLI help**

Run: `npx tsx src/main.ts --help`
Expected: shows usage with --persona and --flow options

**Step 4: Commit**

```bash
git add src/main.ts
git commit -m "feat: add CLI entry point wiring all layers together"
```

---

### Task 12: End-to-End Smoke Test

**Files:**
- Create: `.env` (local only, not committed)

**Step 1: Create .env with real credentials**

Copy `.env.example` to `.env` and fill in:
- `SEEMOREDATA_URL`
- `SEEMOREDATA_EMAIL`
- `SEEMOREDATA_PASSWORD`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`

**Step 2: Run a smoke test with low max-steps**

Run:
```bash
npx tsx src/main.ts --persona finops --flow query-optimization --max-steps 5
```

Expected:
- Browser opens, navigates to SeemoreData, logs in
- Agent takes 5 steps (or finishes early)
- `runs/` directory created with screenshots, logs, video, and report
- Console shows step-by-step progress

**Step 3: Review output**

Check the `runs/<run-id>/` directory:
- `report.md` — readable usability report
- `report.json` — structured data
- `screenshots/` — PNG per step
- `video.webm` — session recording
- `decision-log.json` — full agent reasoning
- `action-log.json` — actions taken

**Step 4: Fix any issues found during smoke test**

Adjust selectors, prompts, or timing as needed based on the actual SeemoreData UI.

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: adjustments from smoke test"
```

---

## Summary

| Task | What | Key files |
|---|---|---|
| 1 | Project scaffolding | package.json, tsconfig.json, .env.example |
| 2 | Zod schemas & types | src/types/*.ts |
| 3 | Persona & flow configs | src/personas/*.json, src/flows/*.json, src/config/*.json |
| 4 | LLM clients & router | src/llm/**/*.ts |
| 5 | Browser layer | src/browser/*.ts |
| 6 | Recording layer | src/recording/logger.ts |
| 7 | Guardrails system | src/agent/guardrails.ts |
| 8 | Agent loop (core) | src/agent/loop.ts, src/agent/prompts.ts |
| 9 | Login flow | src/browser/login.ts |
| 10 | Analysis & reporting | src/analysis/*.ts |
| 11 | CLI entry point | src/main.ts |
| 12 | Smoke test | .env + manual run |

Tasks are ordered bottom-up: foundations first (types, configs), then infrastructure (LLM, browser, recording), then core logic (guardrails, agent loop), then integration (CLI, smoke test). Each task compiles independently and gets its own commit.
