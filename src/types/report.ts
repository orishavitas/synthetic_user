import { z } from "zod";

export const UxIssueSchema = z.object({
  title: z.string(),
  severity: z.enum(["critical", "high", "medium", "low"]),
  flowStep: z.number(),
  screenshot: z.string(),
  whatHappened: z.string(),
  whyItsAnIssue: z.string(),
  recommendation: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
});

export const ScorecardSchema = z.object({
  taskCompleted: z.enum(["yes", "no", "partial"]),
  stepsToCompletion: z.number(),
  frictionPoints: z.number(),
  guardrailHits: z.number(),
  confusionMoments: z.number(),
  flowEfficiency: z.string(),
});

export const ReportSchema = z.object({
  runId: z.string(),
  persona: z.string(),
  flow: z.string(),
  timestamp: z.string(),
  issues: z.array(UxIssueSchema),
  scorecard: ScorecardSchema,
  videoPath: z.string(),
  screenshotsDir: z.string(),
});

export type UxIssue = z.infer<typeof UxIssueSchema>;
export type Scorecard = z.infer<typeof ScorecardSchema>;
export type Report = z.infer<typeof ReportSchema>;
