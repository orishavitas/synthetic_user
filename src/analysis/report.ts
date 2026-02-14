import { writeFileSync } from "fs";
import { resolve } from "path";
import type { Report, UxIssue, Scorecard } from "../types/index.js";

export function generateReport(
  runDir: string,
  runId: string,
  persona: string,
  flow: string,
  issues: UxIssue[],
  scorecard: Scorecard,
  videoFile: string | null
): Report {
  const report: Report = {
    runId,
    persona,
    flow,
    timestamp: new Date().toISOString(),
    issues,
    scorecard,
    videoPath: videoFile ?? "video.webm",
    screenshotsDir: "screenshots/",
  };

  // Save JSON report
  writeFileSync(resolve(runDir, "report.json"), JSON.stringify(report, null, 2));

  // Save Markdown report
  const md = buildMarkdownReport(report);
  writeFileSync(resolve(runDir, "report.md"), md);

  return report;
}

function buildMarkdownReport(report: Report): string {
  let md = `# Usability Test Report\n\n`;
  md += `**Run ID:** ${report.runId}\n`;
  md += `**Persona:** ${report.persona}\n`;
  md += `**Flow:** ${report.flow}\n`;
  md += `**Date:** ${report.timestamp}\n\n`;

  md += `---\n\n## Scorecard\n\n`;
  md += `| Metric | Value |\n|---|---|\n`;
  md += `| Task Completed | ${report.scorecard.taskCompleted} |\n`;
  md += `| Steps to Completion | ${report.scorecard.stepsToCompletion} |\n`;
  md += `| Friction Points | ${report.scorecard.frictionPoints} |\n`;
  md += `| Guardrail Hits | ${report.scorecard.guardrailHits} |\n`;
  md += `| Confusion Moments | ${report.scorecard.confusionMoments} |\n`;
  md += `| Flow Efficiency | ${report.scorecard.flowEfficiency} |\n\n`;

  md += `---\n\n## UX Issues (${report.issues.length})\n\n`;

  if (report.issues.length === 0) {
    md += `No issues detected.\n\n`;
  } else {
    for (const [i, issue] of report.issues.entries()) {
      md += `### ${i + 1}. ${issue.title}\n\n`;
      md += `- **Severity:** ${issue.severity}\n`;
      md += `- **Step:** ${issue.flowStep}\n`;
      md += `- **Screenshot:** ${issue.screenshot}\n`;
      md += `- **Confidence:** ${issue.confidence}\n\n`;
      md += `**What happened:** ${issue.whatHappened}\n\n`;
      md += `**Why it's an issue:** ${issue.whyItsAnIssue}\n\n`;
      md += `**Recommendation:** ${issue.recommendation}\n\n`;
      md += `---\n\n`;
    }
  }

  md += `## Artifacts\n\n`;
  md += `- Video: [${report.videoPath}](${report.videoPath})\n`;
  md += `- Screenshots: [${report.screenshotsDir}](${report.screenshotsDir})\n`;

  return md;
}
