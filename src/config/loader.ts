import { readFileSync } from "fs";
import { resolve } from "path";
import { PersonaSchema, FlowSchema, GuardrailsConfigSchema } from "../types/index.js";
import type { Persona, Flow, GuardrailsConfig } from "../types/index.js";

const configDir = resolve(__dirname, "..");

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
