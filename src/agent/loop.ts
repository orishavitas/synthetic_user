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
