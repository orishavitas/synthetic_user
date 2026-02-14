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
