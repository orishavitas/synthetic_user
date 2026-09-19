import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { HealthBridgeClient, HealthBridgeError, resolveTimeRange } from "./healthBridgeClient.js";

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
  const message = error instanceof HealthBridgeError ? error.message : String(error);
  return { content: [{ type: "text" as const, text: message }], isError: true as const };
}

/** Wraps a bridge call so failures (sync or async) surface as a tool error result instead of a protocol-level throw. */
function safely<T>(fn: () => Promise<T>) {
  return Promise.resolve().then(fn).then(jsonResult).catch(errorResult);
}

export function registerHealthTools(server: McpServer, bridge: HealthBridgeClient) {
  server.registerTool(
    "check_health_connect_status",
    {
      description:
        "Check whether the Health Connect companion app on the phone is reachable and which " +
        "data types the user has granted permission to read.",
      inputSchema: {},
    },
    async () => safely(() => bridge.getStatus()),
  );

  server.registerTool(
    "get_steps",
    {
      description: "Get total step count and hourly buckets for a time range from Google Health Connect.",
      inputSchema: rangeShape,
    },
    async ({ start, end }) => safely(() => bridge.getSteps(resolveTimeRange(start, end))),
  );

  server.registerTool(
    "get_heart_rate_samples",
    {
      description: "Get raw heart rate samples (beats per minute) for a time range.",
      inputSchema: rangeShape,
    },
    async ({ start, end }) => safely(() => bridge.getHeartRate(resolveTimeRange(start, end))),
  );

  server.registerTool(
    "get_sleep_sessions",
    {
      description: "Get sleep sessions, including sleep stage breakdowns, for a time range.",
      inputSchema: rangeShape,
    },
    async ({ start, end }) => safely(() => bridge.getSleepSessions(resolveTimeRange(start, end))),
  );

  server.registerTool(
    "get_weight_records",
    {
      description: "Get recorded body weight measurements (kg) for a time range.",
      inputSchema: rangeShape,
    },
    async ({ start, end }) => safely(() => bridge.getWeightRecords(resolveTimeRange(start, end))),
  );

  server.registerTool(
    "get_active_calories",
    {
      description: "Get total active calories burned (kcal) for a time range.",
      inputSchema: rangeShape,
    },
    async ({ start, end }) => safely(() => bridge.getActiveCalories(resolveTimeRange(start, end))),
  );

  server.registerTool(
    "get_distance",
    {
      description: "Get total distance traveled (meters) for a time range.",
      inputSchema: rangeShape,
    },
    async ({ start, end }) => safely(() => bridge.getDistance(resolveTimeRange(start, end))),
  );

  server.registerTool(
    "get_exercise_sessions",
    {
      description: "Get logged workout/exercise sessions for a time range.",
      inputSchema: rangeShape,
    },
    async ({ start, end }) => safely(() => bridge.getExerciseSessions(resolveTimeRange(start, end))),
  );
}
