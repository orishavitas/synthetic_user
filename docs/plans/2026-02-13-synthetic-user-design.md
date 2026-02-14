# Synthetic User for SeemoreData — Design Document

**Owner:** Ori Shavit
**Date:** 2026-02-13
**Status:** Approved

---

## 1. Purpose

Build an AI-powered synthetic user that performs automated usability testing against SeemoreData's production UI. The synthetic user simulates real personas (FinOps lead, Data Platform Engineer), navigates the product autonomously, and produces usability reports with UX issues, quantitative metrics, and video recordings.

---

## 2. System Architecture

Five layers, each with a clear responsibility:

```
┌─────────────────────────────────────────────────┐
│  1. PERSONA LAYER                               │
│  Persona configs (FinOps, Data Engineer)         │
│  Goals, domain knowledge, skill gaps, behavior   │
└──────────────────────┬──────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│  2. AGENT LOOP (core)                           │
│  see (screenshot) → think (LLM) → act (action)  │
│  Model router selects LLM per step               │
│  Guardrails block mutating actions               │
└──────────────────────┬──────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│  3. BROWSER LAYER                               │
│  Playwright: navigation, clicks, input, video    │
│  Screenshot capture at each step                 │
└──────────────────────┬──────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│  4. RECORDING LAYER                             │
│  Video recording, timestamped screenshots,       │
│  action log, decision log (why the agent chose)  │
└──────────────────────┬──────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│  5. ANALYSIS & REPORTING LAYER                  │
│  Post-run: LLM analyzes full session             │
│  Output: UX issues + scorecard + video link      │
└─────────────────────────────────────────────────┘
```

Config-driven: target URL, credentials, persona, flow, and LLM settings are all in config files / `.env`.

---

## 3. Agent Loop — Core

The agent loop is a see-think-act cycle that repeats until the flow goal is achieved or a max step limit is reached.

### SEE — Capture current state
- Take a screenshot of the current page
- Extract page URL and page title
- Optionally extract key DOM elements (buttons, links, inputs) for action targeting

### THINK — LLM decides what to do
- Input: screenshot + persona context + flow goal + action history so far
- The LLM responds with:
  - **Observation:** what it sees on screen
  - **Reasoning:** what it thinks it should do next
  - **Emotion/friction:** how the persona feels at this moment
  - **Next action:** what to do (click, type, scroll, wait, done, blocked)
- Model router selects the right LLM per sub-task (vision model for screenshots, Claude for persona reasoning)

### ACT — Playwright executes
- Supported actions: `click(selector)`, `type(selector, text)`, `scroll(direction)`, `navigate(url)`, `wait(seconds)`
- Before executing: check against guardrails blocklist. If blocked, log and skip.
- After executing: wait for page to settle (network idle), then loop back to SEE.

### Exit conditions
- Agent declares `done` — flow goal achieved
- Agent declares `blocked` — can't proceed (UI error, unexpected state)
- Max steps reached (configurable, default 30)
- Guardrail triggered on a critical action

Each step is logged with: timestamp, screenshot, observation, reasoning, emotion, action taken, and result.

---

## 4. Persona Layer

Each persona is a JSON config file that shapes how the agent behaves. Two personas for v1:

### FinOps Lead
- **Role:** FinOps lead responsible for cloud cost optimization
- **Goal orientation:** Cost reduction, budget accountability, reporting to finance
- **Domain knowledge:** Strong on cost concepts, billing, budgets. Moderate on SQL/queries. Low on data engineering internals.
- **Skill gaps:** May not understand query execution plans or clustering keys
- **Behavior traits:** Impatient with technical jargon, wants clear dollar impact, looks for quick wins
- **Typical questions:** "How much can I save?", "What's driving this cost?"

### Data Platform Engineer
- **Role:** Engineer managing warehouse infrastructure and query performance
- **Goal orientation:** Performance optimization, resource efficiency, reliability
- **Domain knowledge:** Strong on SQL, query plans, warehouse config. Moderate on cost attribution. Low on business/finance framing.
- **Skill gaps:** May not connect technical optimizations to dollar savings
- **Behavior traits:** Methodical, wants to understand why before acting, reads details, explores options
- **Typical questions:** "What's the execution plan?", "Will this break anything?"

### Persona config includes
- **Identity:** role, seniority, company context
- **Knowledge model:** what they know well, what they're fuzzy on, what they don't know
- **Behavior:** patience level, exploration style (linear vs exploratory), trust in automation
- **Goals per flow:** what "success" means for this persona in each of the 3 flows
- **Frustration triggers:** what makes this persona confused or annoyed

The persona config is injected into the LLM prompt at the THINK step, so the agent reasons *as* that person.

---

## 5. Guardrails System

Two layers of protection to prevent the synthetic user from making real changes in production.

### Layer 1 — Action blocklist (pre-execution)
A config file listing patterns the agent must never click or submit:
- **Button text:** "Apply", "Save", "Confirm", "Enable", "Disable", "Delete", "Submit"
- **CSS selectors:** specific submit/confirm buttons if needed
- **URL patterns:** any endpoint containing /apply, /save, /confirm

Before Playwright executes any click, the system checks the target element against this list. If matched, the action is blocked, logged, and skipped. The agent receives feedback: "This action was blocked by guardrails" and continues the flow.

### Layer 2 — Navigation boundary (safety net)
The agent is restricted to SeemoreData's domain. Any attempt to navigate outside is blocked.

### What gets logged when a guardrail fires
- Which guardrail triggered
- What the agent intended to do and why
- Screenshot of the moment
- Whether this was the natural end of the flow (expected) or a surprise (potential issue)

### Configurable per flow
Each flow definition can specify its own guardrail overrides. For example, Flow 2 allows "Add manual slot" but blocks "Apply configuration".

---

## 6. Recording Layer

Every test run produces a complete evidence trail.

| Artifact | How | Format |
|---|---|---|
| Video | Playwright built-in video recording | `.webm` file |
| Screenshots | Captured at every step of the agent loop | `.png`, timestamped |
| Action log | Every action the agent took | JSON array |
| Decision log | Agent's observation, reasoning, emotion at each step | JSON array |
| Guardrail events | Every blocked action | JSON array |

### Directory structure per run
```
runs/
  2026-02-13_14-30-00_finops_query-optimization/
    video.webm
    screenshots/
      step-001.png
      step-002.png
      ...
    action-log.json
    decision-log.json
    report.md
    report.json
```

Each run is identified by: `timestamp_persona_flow-name`.

### Decision log entry example
```json
{
  "step": 3,
  "timestamp": "2026-02-13T14:30:12Z",
  "url": "https://app.seemoredata.com/queries",
  "screenshot": "step-003.png",
  "observation": "I see a table of queries. Columns: query ID, warehouse, duration, cost, user, date.",
  "reasoning": "I need to find the most expensive query. I'll click the cost column header to sort descending.",
  "emotion": "neutral — the table layout is clear",
  "action": "click('th[data-column=cost]')",
  "guardrail_blocked": false
}
```

---

## 7. Analysis & Reporting Layer

After a run completes, a separate LLM pass analyzes the full session and generates the report.

### Input to the analyzer
- Full decision log (every observation, reasoning, emotion)
- Action log (what happened)
- Guardrail events
- Screenshots from key moments (friction points, errors, confusion)
- Persona config (to contextualize findings)

### Output

#### Part A: UX Issues List
Each issue includes:
- **Title:** concise description
- **Severity:** Critical / High / Medium / Low
- **Flow step:** where in the flow it occurred
- **Screenshot:** the moment it happened
- **What happened:** what the agent observed and did
- **Why it's an issue:** mapped to usability heuristics (visibility, feedback, error prevention, etc.)
- **Recommendation:** suggested fix
- **Confidence:** High / Medium / Low — how certain this is a real UX issue vs agent confusion

#### Part B: Quantitative Scorecard

| Metric | Description |
|---|---|
| Task completed | Yes / No / Partial |
| Steps to completion | count |
| Friction points detected | count |
| Guardrail hits | count |
| Confusion moments | count (emotion = confused/frustrated) |
| Flow efficiency | steps taken vs optimal path |

#### Part C: Links
- Video recording of the full session
- Link to screenshots folder

**Report format:** Generated as both `report.md` (human-readable) and `report.json` (machine-parseable).

**Model choice for analysis:** Claude — best at synthesizing qualitative insights and writing clear recommendations.

---

## 8. Flow Definitions

Each flow is a config file describing the goal, not a scripted sequence. The agent figures out how to accomplish the goal on its own.

### Flow config structure
- Flow name
- Starting URL
- Goal description (what the persona is trying to achieve)
- Success criteria (how the agent knows it's done)
- Guardrail overrides (flow-specific blocked actions)
- Max steps

### Flow 1: Query Optimization
```
name: query-optimization
start_url: /queries
goal: "Find the most expensive, long-running query and check if the Seemore Query Agent can suggest optimizations for it."
success: "Agent has reviewed optimization suggestions from the Query Agent."
guardrails: Block any action that would apply/execute an optimization.
max_steps: 30
```

### Flow 2: Compute Recommendations
```
name: compute-recommendations
start_url: /compute
goal: "Find a warehouse that has SmartPulse recommendations, review the recommendations, and add a one-time manual slot."
success: "Agent has added a manual slot and reviewed recommendations."
guardrails: Block any action that would apply configuration changes.
max_steps: 30
```

### Flow 3: Autoclustering Analysis
```
name: autoclustering-analysis
start_url: /autoclustering
goal: "Generate an autoclustering analysis, go through the recommendations, and decide whether each recommendation is worth using or not."
success: "Agent has reviewed all recommendations and made a decision on each."
guardrails: Block any action that would apply clustering changes.
max_steps: 30
```

---

## 9. Model Router

A lightweight component that selects the best LLM for each task type.

### Routing table

| Task | Model | Why |
|---|---|---|
| Screenshot understanding | GPT-4o | Fast, accurate vision |
| Persona reasoning (think step) | Claude | Best at role-playing, nuanced reasoning |
| Action decision | Claude | Strong at structured decision-making with constraints |
| Post-run analysis & report writing | Claude | Best at synthesizing qualitative insights |
| Bulk evaluations (future) | Gemini | Cost-effective at scale |

### How it works
- Each step in the system has a `task_type` tag
- The router maps `task_type` → `model + provider`
- Config file defines the defaults, overridable per run

### Config
```json
{
  "vision": { "provider": "openai", "model": "gpt-4o" },
  "reasoning": { "provider": "anthropic", "model": "claude-sonnet-4-5-20250929" },
  "analysis": { "provider": "anthropic", "model": "claude-sonnet-4-5-20250929" },
  "bulk": { "provider": "google", "model": "gemini-2.0-flash" }
}
```

In the agent loop, the THINK step involves two LLM calls:
1. Vision model: "Describe what you see in this screenshot" → structured observation
2. Reasoning model: Given the observation + persona + history → decide next action + emotion

---

## 10. Tech Stack & Project Structure

### Dependencies
- **TypeScript / Node.js** — runtime and language
- **Playwright** — browser automation, screenshots, video recording
- **Anthropic SDK** — Claude API calls
- **OpenAI SDK** — GPT-4o API calls
- **Google Generative AI SDK** — Gemini API calls
- **dotenv** — environment variable management
- **zod** — schema validation for configs and LLM responses

### Project structure
```
synthetic-user/
  src/
    agent/
      loop.ts              # Core see-think-act cycle
      guardrails.ts        # Action blocklist & boundary checks
    personas/
      finops.json          # FinOps lead persona config
      data-engineer.json   # Data Platform Engineer persona config
    flows/
      query-optimization.json
      compute-recommendations.json
      autoclustering-analysis.json
    browser/
      browser.ts           # Playwright setup, video, screenshots
      actions.ts           # Click, type, scroll, navigate, wait
    llm/
      router.ts            # Model router
      providers/
        anthropic.ts       # Claude client
        openai.ts          # GPT-4o client
        google.ts          # Gemini client
    analysis/
      analyzer.ts          # Post-run LLM analysis
      report.ts            # Report generation (md + json)
    recording/
      logger.ts            # Action log, decision log, guardrail log
    config/
      models.json          # Model router defaults
      guardrails.json      # Global action blocklist
  runs/                    # Output directory for test runs
  .env                     # Credentials, API keys (not committed)
  .env.example             # Template for .env
  package.json
  tsconfig.json
```

### CLI interface
```
npx tsx src/main.ts --persona finops --flow query-optimization
```

---

## 11. Target Environment & Auth

- **Target:** Production (configurable URL in `.env` for future staging/local)
- **Auth:** Email/password stored in `.env`, agent logs in through the UI like a real user
- **Trigger:** On-demand CLI (scheduling to be added later)

---

## 12. Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Scope | SeemoreData-specific | No abstraction overhead, go deep on domain |
| Architecture | Single-agent loop | Simple, debuggable, evolvable to multi-agent later |
| UI interaction | Hybrid (Playwright + vision) | Reliable actions + human-like understanding |
| LLM strategy | Multi-model with router | Each model does what it's best at |
| Guardrails | Blocklist + domain boundary | Prevents production changes, configurable per flow |
| Language | TypeScript | Best Playwright integration, strong typing |
| Trigger | On-demand CLI | Simple for v1, scheduling later |
