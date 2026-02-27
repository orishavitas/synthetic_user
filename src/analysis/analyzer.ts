import { routeAnalysis } from "../llm/router.js";
import { UxIssueSchema, ScorecardSchema } from "../types/index.js";
import type { UxIssue, Scorecard } from "../types/index.js";
import type { Decision } from "../types/index.js";
import type { Persona, Flow } from "../types/index.js";
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

  const response = await routeAnalysis(systemPrompt, userMessage);

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
}
