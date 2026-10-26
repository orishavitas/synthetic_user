# AI Agents for User Testing (SeemoreData) — Conversation Notes

## User request
**Find me skills for building an AI agents to make user testing for seemoredata**

## Assistant response — Skills checklist

### 1) UX & User Testing Foundations (non-negotiable)
- User testing methodologies (moderated, unmoderated, exploratory, task-based)
- Usability heuristics (Nielsen, cognitive load, error prevention)
- Defining success metrics (task completion, time-on-task, friction points)
- Writing realistic user tasks & scenarios (esp. B2B / data personas)
- Understanding bias in testing (false positives from “polite” agents)

### 2) AI / LLM Core Skills
- Prompt engineering (role-based, goal-oriented, constraint-driven prompts)
- Multi-agent design (e.g. “User Agent”, “Observer Agent”, “Critic Agent”)
- Tool-augmented reasoning (when + how to use it)
- Model selection tradeoffs (larger vs smaller/faster models)
- Controlling hallucinations & overconfidence in feedback
- *Nice to have:* fine-tuning or prompt libraries per persona (Data Engineer, RevOps, FinOps, etc.)

### 3) Synthetic User & Persona Modeling
- Translating real personas into behavioral constraints
- Simulating domain knowledge gaps (e.g. “knows Snowflake basics but not cost attribution”)
- Modeling intent vs confusion vs frustration
- Variability techniques (same persona, different moods / urgency / goals)
- Edge-case persona creation (power users, skeptics, execs)

Example persona prompt:
> “Cost-conscious FinOps lead under pressure after a surprise Snowflake bill spike”

### 4) Product & Domain Understanding (SeemoreData-specific)
- Data infra concepts (warehouses, queries, lineage, cost drivers)
- SeemoreData features context (Anomalies, Smart Pulse, Auto Shutdown, etc.)
- Mapping business questions → product flows  
  - “Why did my cost spike?” → anomaly → root cause → recommendation
- Knowing where users don’t trust automation and need explanation

### 5) Agent Orchestration & Architecture
- Designing agent workflows (sequential vs parallel agents)
- Memory management (session vs long-term learning)
- Tool usage by agents (UI screenshots, logs, event data)
- Failure handling (agent stuck, misunderstands UI)
- Reproducibility (comparable runs)

Common setup:
- **User Agent** → performs tasks
- **Observer Agent** → logs friction & confusion
- **Analyst Agent** → summarizes insights & patterns

### 6) Frontend & Interaction Capture
- Reading UI state (DOM, accessibility tree, screenshots)
- Simulating clicks, inputs, navigation flows
- Component-level UX issues (disabled states, loading, tooltips)
- Event logging & session replay interpretation

Likely tools:
- Playwright / Cypress
- Screenshot + vision models
- Accessibility APIs

### 7) Insight Synthesis & UX Reporting
- Pattern detection across multiple test runs
- Separating “agent confusion” from real UX issues
- Prioritization (severity × frequency × impact)
- Translating AI findings into UX recommendations
- Confidence scoring (“high confidence friction” vs “weak signal”)

Example output:
> “3/5 FinOps personas failed to understand anomaly scope within 30s → missing hierarchy cue”

### 8) Ethics, Guardrails & Trust
- Transparency: what AI testing can & cannot replace
- Avoiding false certainty (“AI says users hate this”)
- Human-in-the-loop validation workflows
- Bias audits (persona diversity, assumptions)

### 9) Bonus / Advanced Skills
- Reinforcement learning from UX feedback
- Comparing AI test results vs real user test deltas
- Continuous testing pipelines (run on every release)
- Benchmarking UX changes over time

## TL;DR
**UX research + persona modeling + LLM agent design + product domain knowledge + insight synthesis**
