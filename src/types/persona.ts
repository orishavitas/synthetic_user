import { z } from "zod";

export const PersonaSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  seniority: z.string(),
  companyContext: z.string(),
  goalOrientation: z.string(),
  domainKnowledge: z.object({
    strong: z.array(z.string()),
    moderate: z.array(z.string()),
    low: z.array(z.string()),
  }),
  skillGaps: z.array(z.string()),
  behaviorTraits: z.array(z.string()),
  patienceLevel: z.enum(["low", "medium", "high"]),
  explorationStyle: z.enum(["linear", "exploratory"]),
  trustInAutomation: z.enum(["low", "medium", "high"]),
  frustrationTriggers: z.array(z.string()),
  typicalQuestions: z.array(z.string()),
  flowGoals: z.record(z.string(), z.string()),
});

export type Persona = z.infer<typeof PersonaSchema>;
