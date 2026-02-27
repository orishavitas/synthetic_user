import { readFileSync } from "fs";
import { resolve } from "path";
import { z } from "zod";
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

const ModelConfigSchema = z.object({
  provider: z.enum(["openai", "anthropic", "google"]),
  model: z.string(),
});

export type ModelConfig = z.infer<typeof ModelConfigSchema>;

const ModelsConfigSchema = z.object({
  vision: ModelConfigSchema,
  reasoning: ModelConfigSchema,
  analysis: ModelConfigSchema,
  bulk: ModelConfigSchema,
});

export type ModelsConfig = z.infer<typeof ModelsConfigSchema>;

export function loadModelsConfig(): ModelsConfig {
  const filePath = resolve(configDir, "config", "models.json");
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  return ModelsConfigSchema.parse(raw);
}
