import "dotenv/config";
import { Command } from "commander";
import { resolve } from "path";
import { loadPersona, loadFlow, loadGuardrails } from "./config/loader.js";
import { launchBrowser, closeBrowser } from "./browser/browser.js";
import { loginToSeemoreData } from "./browser/login.js";
import { Guardrails } from "./agent/guardrails.js";
import { RunLogger } from "./recording/logger.js";
import { runAgentLoop } from "./agent/loop.js";
import { analyzeRun } from "./analysis/analyzer.js";
import { generateReport } from "./analysis/report.js";

const program = new Command();

program
  .name("synthetic-user")
  .description("AI-powered synthetic user for SeemoreData usability testing")
  .requiredOption("--persona <id>", "Persona ID (finops or data-engineer)")
  .requiredOption("--flow <name>", "Flow name (query-optimization, compute-recommendations, autoclustering-analysis)")
  .option("--max-steps <n>", "Override max steps", parseInt)
  .action(async (opts) => {
    const { persona: personaId, flow: flowName, maxSteps } = opts;

    console.log(`\n=== Synthetic User Test Run ===`);
    console.log(`Persona: ${personaId}`);
    console.log(`Flow: ${flowName}\n`);

    // Load configs
    const persona = loadPersona(personaId);
    const flow = loadFlow(flowName);
    if (maxSteps) flow.maxSteps = maxSteps;
    const guardrailsConfig = loadGuardrails();

    // Create run directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
    const runId = `${timestamp}_${personaId}_${flowName}`;
    const runDir = resolve("runs", runId);

    // Initialize components
    const logger = new RunLogger(runDir);
    const guardrails = new Guardrails(guardrailsConfig, flow.guardrailOverrides);

    // Launch browser
    const session = await launchBrowser(runDir);

    try {
      // Login
      await loginToSeemoreData(session.page);

      // Run the agent loop
      const result = await runAgentLoop(session, persona, flow, guardrails, logger);

      // Save logs
      logger.save();

      // Close browser and get video file
      const videoFile = await closeBrowser(session);

      // Analyze the run
      console.log("\n=== Analyzing session... ===");
      const analysis = await analyzeRun(
        logger.getDecisions(),
        logger.getGuardrailEvents(),
        persona,
        flow,
        result.exitReason
      );

      // Generate report
      const report = generateReport(
        runDir,
        runId,
        personaId,
        flowName,
        analysis.issues,
        analysis.scorecard,
        videoFile
      );

      console.log(`\n=== Report generated ===`);
      console.log(`Issues found: ${report.issues.length}`);
      console.log(`Task completed: ${report.scorecard.taskCompleted}`);
      console.log(`Output: ${runDir}`);
    } catch (e) {
      console.error("Run failed:", e);
      logger.save();
      await closeBrowser(session);
      process.exit(1);
    }
  });

program.parse();
