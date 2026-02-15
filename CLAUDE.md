# CLAUDE.md — Project Instructions

## Project Overview
This is a synthetic user framework for automated usability testing of SeemoreData. It uses AI personas to navigate the product UI and generate UX reports.

## Tech Stack
- TypeScript / Node.js
- Playwright (browser automation)
- Anthropic SDK, OpenAI SDK, Google Generative AI SDK
- Zod (validation), Commander (CLI), dotenv

## Key Directories
- `src/agent/` — Core agent loop, guardrails, prompts
- `src/browser/` — Playwright browser management, actions, login
- `src/llm/` — LLM provider clients and model router
- `src/analysis/` — Post-run analyzer and report generator
- `src/recording/` — Session logging
- `src/types/` — Zod schemas for all shared types
- `src/config/` — Config loader
- `src/personas/` — Persona JSON configs
- `src/flows/` — Flow JSON configs
- `docs/` — Design docs, plans, executive brief, operations guide
- `runs/` — Output directory for test runs (gitignored)

## How to Help Users

### Always:
- Explain things in simple, plain language
- After explaining something, ask if further clarification is needed
- Offer to help with next steps
- When showing commands, explain what they do before running them

### When the user wants to run a test:
1. First check if `.env` exists and has credentials configured
2. Walk them through setup if not (reference docs/operations-guide.md)
3. Suggest starting with a short run: `--max-steps 5`
4. After the run, help them find and understand the report

### When the user wants to add a new persona:
1. Create a new JSON file in src/personas/
2. Follow the structure of existing personas (finops.json, data-engineer.json)
3. Add flow-specific goals for each flow

### When the user wants to add a new flow:
1. Create a new JSON file in src/flows/
2. Define: name, startUrl, goal, success criteria, guardrail overrides, maxSteps
3. Update persona configs with goals for the new flow

### When something breaks:
1. Check the console error output first
2. Check the decision-log.json in the run folder
3. Common issues: login selectors need updating, API key missing, element not found
4. Always explain what went wrong in simple terms before suggesting a fix

## Important Rules
- NEVER commit or expose .env files
- NEVER run tests without user confirmation
- The synthetic user must NEVER apply changes in production (guardrails enforce this)
- Always suggest `--max-steps 5` for first/test runs
- Module format is CommonJS — use __dirname not import.meta.dirname
