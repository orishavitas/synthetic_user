import { z } from "zod";

export const ActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("click"), selector: z.string() }),
  z.object({ type: z.literal("type"), selector: z.string(), text: z.string() }),
  z.object({ type: z.literal("scroll"), direction: z.enum(["up", "down"]) }),
  z.object({ type: z.literal("navigate"), url: z.string() }),
  z.object({ type: z.literal("wait"), seconds: z.number() }),
  z.object({ type: z.literal("done"), reason: z.string() }),
  z.object({ type: z.literal("blocked"), reason: z.string() }),
]);

export type Action = z.infer<typeof ActionSchema>;
