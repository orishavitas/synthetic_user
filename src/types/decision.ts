import { z } from "zod";
import { ActionSchema } from "./action.js";

export const DecisionSchema = z.object({
  step: z.number(),
  timestamp: z.string(),
  url: z.string(),
  screenshot: z.string(),
  observation: z.string(),
  reasoning: z.string(),
  emotion: z.string(),
  action: ActionSchema,
  guardrailBlocked: z.boolean(),
});

export type Decision = z.infer<typeof DecisionSchema>;
