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
