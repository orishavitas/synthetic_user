import { z } from "zod";

export const GuardrailsConfigSchema = z.object({
  blockedButtonTexts: z.array(z.string()),
  blockedSelectors: z.array(z.string()),
  blockedUrlPatterns: z.array(z.string()),
  allowedDomains: z.array(z.string()),
});

export type GuardrailsConfig = z.infer<typeof GuardrailsConfigSchema>;
