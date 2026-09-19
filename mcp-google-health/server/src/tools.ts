import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { getSql } from "../db/client.js";
import {
  latestSyncTimestamps,
  queryActiveCaloriesRange,
  queryDistanceRange,
  queryExerciseSessionsRange,
  queryHeartRateRange,
  querySleepSessionsRange,
  queryStepsRange,
  queryWeightRange,
} from "../db/queries.js";
import { resolveTimeRange } from "./time.js";

const rangeShape = {
  start: z
    .string()
    .optional()
    .describe("ISO 8601 start time. Defaults to 24 hours before `end`."),
  end: z
    .string()
    .optional()
    .describe("ISO 8601 end time. Defaults to now."),
};

function jsonResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(error: unknown) {
  return { content: [{ type: "text" as const, text: String((error as Error)?.message ?? error) }], isError: true as const };
}

/** Wraps a query so failures (sync or async) surface as a tool error result instead of a protocol-level throw. */
function safely<T>(fn: () => Promise<T>) {
  return Promise.resolve().then(fn).then(jsonResult).catch(errorResult);
}

export function registerHealthTools(server: McpServer) {
  server.registerTool(
    "check_sync_status",
    {
      description:
        "Get the most recent timestamp synced from the phone for each health metric. " +
        "Data is periodically pushed from the phone (roughly every 15 minutes when it has " +
        "connectivity), not read live, so check this if an answer seems stale.",
      inputSchema: {},
    },
    async () => safely(() => latestSyncTimestamps(getSql())),
  );

  server.registerTool(
    "get_steps",
    {
      description:
        "Get total step count and hourly buckets for a time range, last synced from Google Health Connect.",
      inputSchema: rangeShape,
    },
    async ({ start, end }) => {
      const range = resolveTimeRange(start, end);
      return safely(() => queryStepsRange(getSql(), range.start, range.end));
    },
  );

  server.registerTool(
    "get_heart_rate_samples",
    {
      description: "Get raw heart rate samples (beats per minute) for a time range.",
      inputSchema: rangeShape,
    },
    async ({ start, end }) => {
      const range = resolveTimeRange(start, end);
      return safely(() => queryHeartRateRange(getSql(), range.start, range.end));
    },
  );

  server.registerTool(
    "get_sleep_sessions",
    {
      description: "Get sleep sessions, including sleep stage breakdowns, for a time range.",
      inputSchema: rangeShape,
    },
    async ({ start, end }) => {
      const range = resolveTimeRange(start, end);
      return safely(() => querySleepSessionsRange(getSql(), range.start, range.end));
    },
  );

  server.registerTool(
    "get_weight_records",
    {
      description: "Get recorded body weight measurements (kg) for a time range.",
      inputSchema: rangeShape,
    },
    async ({ start, end }) => {
      const range = resolveTimeRange(start, end);
      return safely(() => queryWeightRange(getSql(), range.start, range.end));
    },
  );

  server.registerTool(
    "get_active_calories",
    {
      description: "Get total active calories burned (kcal) for a time range.",
      inputSchema: rangeShape,
    },
    async ({ start, end }) => {
      const range = resolveTimeRange(start, end);
      return safely(() => queryActiveCaloriesRange(getSql(), range.start, range.end));
    },
  );

  server.registerTool(
    "get_distance",
    {
      description: "Get total distance traveled (meters) for a time range.",
      inputSchema: rangeShape,
    },
    async ({ start, end }) => {
      const range = resolveTimeRange(start, end);
      return safely(() => queryDistanceRange(getSql(), range.start, range.end));
    },
  );

  server.registerTool(
    "get_exercise_sessions",
    {
      description: "Get logged workout/exercise sessions for a time range.",
      inputSchema: rangeShape,
    },
    async ({ start, end }) => {
      const range = resolveTimeRange(start, end);
      return safely(() => queryExerciseSessionsRange(getSql(), range.start, range.end));
    },
  );
}
