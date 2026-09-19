import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSql } from "../db/client.js";
import {
  upsertActiveCaloriesBuckets,
  upsertDistanceBuckets,
  upsertExerciseSessions,
  upsertHeartRateSamples,
  upsertSleepSessions,
  upsertStepsBuckets,
  upsertWeightRecords,
} from "../db/queries.js";
import { isAuthorized } from "../src/auth.js";

interface SyncPayload {
  steps?: { buckets: { start: string; end: string; count: number }[] };
  heartRate?: { samples: { time: string; bpm: number }[] };
  sleep?: { sessions: { start: string; end: string; stages: unknown }[] };
  weight?: { records: { time: string; kg: number }[] };
  activeCalories?: { buckets: { start: string; end: string; kcal: number }[] };
  distance?: { buckets: { start: string; end: string; meters: number }[] };
  exercise?: { sessions: { start: string; end: string; exerciseType: string; title?: string | null }[] };
}

/** Called by the Android companion app's periodic WorkManager sync job — see android-companion/. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  if (!isAuthorized(req, process.env.SYNC_API_KEY)) {
    res.status(401).json({ error: "Missing or invalid bearer token." });
    return;
  }

  const body = (req.body ?? {}) as SyncPayload;
  const sql = getSql();

  try {
    await Promise.all([
      body.steps?.buckets ? upsertStepsBuckets(sql, body.steps.buckets) : null,
      body.heartRate?.samples ? upsertHeartRateSamples(sql, body.heartRate.samples) : null,
      body.sleep?.sessions ? upsertSleepSessions(sql, body.sleep.sessions) : null,
      body.weight?.records ? upsertWeightRecords(sql, body.weight.records) : null,
      body.activeCalories?.buckets ? upsertActiveCaloriesBuckets(sql, body.activeCalories.buckets) : null,
      body.distance?.buckets ? upsertDistanceBuckets(sql, body.distance.buckets) : null,
      body.exercise?.sessions ? upsertExerciseSessions(sql, body.exercise.sessions) : null,
    ]);
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error handling sync request:", error);
    res.status(500).json({ error: (error as Error).message ?? String(error) });
  }
}
