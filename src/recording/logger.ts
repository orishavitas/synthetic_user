import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import type { Decision, Action } from "../types/index.js";

export interface ActionLogEntry {
  step: number;
  timestamp: string;
  action: Action;
  url: string;
  guardrailBlocked: boolean;
}

export interface GuardrailEvent {
  step: number;
  timestamp: string;
  intendedAction: Action;
  reason: string;
  screenshot: string;
  expectedEndOfFlow: boolean;
}

export class RunLogger {
  private decisions: Decision[] = [];
  private actions: ActionLogEntry[] = [];
  private guardrailEvents: GuardrailEvent[] = [];
  private runDir: string;

  constructor(runDir: string) {
    this.runDir = runDir;
    mkdirSync(runDir, { recursive: true });
  }

  logDecision(decision: Decision): void {
    this.decisions.push(decision);
  }

  logAction(entry: ActionLogEntry): void {
    this.actions.push(entry);
  }

  logGuardrailEvent(event: GuardrailEvent): void {
    this.guardrailEvents.push(event);
  }

  getDecisions(): Decision[] {
    return this.decisions;
  }

  getActions(): ActionLogEntry[] {
    return this.actions;
  }

  getGuardrailEvents(): GuardrailEvent[] {
    return this.guardrailEvents;
  }

  save(): void {
    writeFileSync(
      resolve(this.runDir, "decision-log.json"),
      JSON.stringify(this.decisions, null, 2)
    );
    writeFileSync(
      resolve(this.runDir, "action-log.json"),
      JSON.stringify(this.actions, null, 2)
    );
    if (this.guardrailEvents.length > 0) {
      writeFileSync(
        resolve(this.runDir, "guardrail-events.json"),
        JSON.stringify(this.guardrailEvents, null, 2)
      );
    }
  }
}
