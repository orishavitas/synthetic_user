# Synthetic User Framework -- Executive Brief

**Audience:** CTO, CPO, Product Lead
**Date:** February 2026
**Owner:** Ori Shavit

---

## 1. Executive Summary

We have built an AI-powered synthetic user that autonomously navigates SeemoreData's production UI, simulates real customer personas, and generates usability reports complete with video recordings, UX issue lists, and quantitative scorecards. This gives us on-demand, repeatable usability testing without scheduling sessions, recruiting participants, or waiting days for results.

---

## 2. The Problem

SeemoreData ships product changes frequently. Traditional usability testing requires recruiting real users, scheduling sessions, running them manually, and synthesizing findings -- a process that takes days to weeks per round. At our pace, most features ship without structured usability feedback. When issues surface, they come from customer support tickets or churn signals, long after the damage is done.

We have multiple personas (FinOps leads, Data Platform Engineers) who experience the product very differently, but we rarely test from both perspectives. Blind spots accumulate.

---

## 3. The Solution

The synthetic user is an AI agent that behaves like a real person using SeemoreData. It opens a browser, logs in, and attempts to complete a real task -- just like a customer would. It sees the screen, decides what to do next based on its persona's knowledge and goals, takes action, and records everything.

After the session, a separate AI analyzes the full recording and produces a structured usability report: what went wrong, where the user got confused, how severe each issue is, and what to fix.

---

## 4. How It Works

1. **Configure a test.** Select a persona (e.g., FinOps Lead) and a task flow (e.g., "find and optimize the most expensive query"). Run a single CLI command.

2. **The agent navigates autonomously.** It opens a real browser, logs into SeemoreData, and works through the task step by step. At each step, a vision model describes what is on screen, and a reasoning model decides what to do next -- as that persona would.

3. **Safety guardrails prevent real changes.** The system blocks any action that would mutate production data (Apply, Save, Delete, etc.). The agent is read-only by design.

4. **Everything is recorded.** Every step produces a screenshot, a decision log (what the agent saw, thought, felt, and did), and full video of the session.

5. **An AI analyst generates the report.** After the session, a separate LLM pass reviews the full evidence trail and produces a UX issues list with severity ratings, a quantitative scorecard, and actionable recommendations.

---

## 5. What It Tests (V1 Scope)

**Three core flows:**
- **Query Optimization** -- Can the user find expensive queries and understand the Query Agent's suggestions?
- **Compute Recommendations** -- Can the user review SmartPulse recommendations and add a manual scheduling slot?
- **Autoclustering Analysis** -- Can the user evaluate clustering recommendations and decide which to adopt?

**Two personas:**
- **FinOps Lead (Sarah Chen)** -- Senior, cost-focused, impatient with jargon, wants dollar impact. Strong on budgets, weak on query internals.
- **Data Platform Engineer (Marcus Rivera)** -- Mid-level, methodical, wants technical depth before acting. Strong on SQL and warehouse config, weak on business framing.

These two personas stress-test different aspects of the UI: clarity of business value vs. technical transparency.

---

## 6. Key Capabilities

- Autonomous browser navigation with no scripted steps -- the agent figures out the path on its own
- Persona-driven behavior: knowledge gaps, patience levels, frustration triggers all shape decisions
- Multi-model AI architecture: GPT-4o for visual understanding, Claude for persona reasoning and analysis, Gemini reserved for future scale
- Full video recording of every session
- Timestamped screenshots at every decision point
- Safety guardrails that block all mutating actions in production
- Structured UX issue reports with severity, heuristic mapping, and fix recommendations
- Quantitative scorecard: task completion, step count, friction points, confusion moments
- Confidence scoring on every issue to separate real UX problems from AI artifacts
- Config-driven: adding new personas, flows, or guardrail rules requires only JSON changes

---

## 7. What It Does NOT Do

- **Does not replace real user testing.** Synthetic users supplement, not substitute. They catch structural usability issues and regressions, but real users still surface intent mismatches, trust concerns, and workflow integration problems that AI cannot model.
- **Does not make changes in production.** All mutating actions (Apply, Save, Delete, Confirm) are blocked by guardrails. The agent is read-only.
- **Does not claim certainty.** Every detected issue carries a confidence rating (High / Medium / Low). Low-confidence findings may reflect AI confusion rather than real UX problems. Human review of reports is expected.
- **Does not test performance, accessibility, or visual design.** V1 focuses on task-flow usability and information architecture.

---

## 8. Expected Value

**Faster feedback loops.** Run a usability test in minutes, not weeks. Get a structured report the same day a feature ships.

**Continuous UX regression testing.** Catch usability regressions early by running the same flows after every significant UI change.

**Persona-specific insights.** Understand how the same screen reads to a cost-focused executive vs. a technical engineer -- without recruiting both.

**Reduced cost of usability testing.** Each run costs roughly $0.50-2.00 in API fees. No participant incentives, no scheduling overhead, no facilitator time.

**Artifact-rich evidence.** Every finding comes with a video clip, screenshot, and the agent's reasoning -- making it easy to share with designers and engineers.

---

## 9. Current Status

V1 is built and code-complete. The system compiles, all layers are integrated, and the CLI is functional.

**What is needed before the first real run:**
- SeemoreData test account credentials added to the environment config
- A smoke test with a low step count (5 steps) to validate login flow and selector accuracy
- Minor selector tuning based on the actual production UI (login form fields, button labels)
- Review of the first generated report to calibrate prompt quality

**Estimated time to first real run:** 1-2 hours of configuration and tuning.

---

## 10. Roadmap / Future Possibilities

- **Scheduled runs** -- cron-based execution after every deploy or on a nightly cadence
- **CI/CD integration** -- run synthetic user tests as part of the release pipeline, fail the build on critical UX regressions
- **More personas** -- executive (VP-level), new customer (onboarding), power user, skeptical evaluator
- **More flows** -- anomaly investigation, onboarding, dashboard exploration, settings configuration
- **Multi-agent evaluation** -- run Observer and Critic agents alongside the User agent for deeper analysis
- **Cross-run pattern detection** -- aggregate findings across dozens of runs to surface systemic issues
- **Real vs. synthetic comparison** -- benchmark synthetic user findings against real user testing data to calibrate confidence scores
- **Gemini at scale** -- use cost-effective models for bulk parallel runs across many persona/flow combinations

---

## 11. Investment Required

**API costs per run:** Approximately $0.50-2.00, depending on the number of steps and models used. A typical 30-step run makes ~30 vision calls (GPT-4o), ~30 reasoning calls (Claude), and 1 analysis call (Claude).

**Infrastructure:** None. Runs from the developer's machine via CLI. No servers, no deployment, no cloud infrastructure.

**Dependencies:** Three LLM API keys (OpenAI, Anthropic, Google) and a SeemoreData test account.

**Maintenance:** Adding new test flows or personas requires only JSON configuration files. No code changes needed for routine expansion.
