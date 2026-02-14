import { z } from "zod";

export const FlowSchema = z.object({
  name: z.string(),
  startUrl: z.string(),
  goal: z.string(),
  success: z.string(),
  guardrailOverrides: z
    .object({
      allowedButtonTexts: z.array(z.string()).optional(),
      blockedButtonTexts: z.array(z.string()).optional(),
      blockedSelectors: z.array(z.string()).optional(),
    })
    .optional(),
  maxSteps: z.number().default(30),
});

export type Flow = z.infer<typeof FlowSchema>;
