import type { Sql } from "./client.js";

function toIso(value: unknown): string {
  return new Date(value as string).toISOString();
}

// ---- Upserts (called from api/sync.ts) ----------------------------------

export async function upsertStepsBuckets(
  sql: Sql,
  buckets: { start: string; end: string; count: number }[],
) {
  await Promise.all(
    buckets.map(
      (b) => sql`
        INSERT INTO steps_buckets (start_time, end_time, count)
        VALUES (${b.start}, ${b.end}, ${b.count})
        ON CONFLICT (start_time) DO UPDATE SET end_time = EXCLUDED.end_time, count = EXCLUDED.count
      `,
    ),
  );
}

export async function upsertHeartRateSamples(sql: Sql, samples: { time: string; bpm: number }[]) {
  await Promise.all(
    samples.map(
      (s) => sql`
        INSERT INTO heart_rate_samples (sample_time, bpm)
        VALUES (${s.time}, ${s.bpm})
        ON CONFLICT (sample_time) DO UPDATE SET bpm = EXCLUDED.bpm
      `,
    ),
  );
}

export async function upsertSleepSessions(
  sql: Sql,
  sessions: { start: string; end: string; stages: unknown }[],
) {
  await Promise.all(
    sessions.map(
      (s) => sql`
        INSERT INTO sleep_sessions (start_time, end_time, stages)
        VALUES (${s.start}, ${s.end}, ${JSON.stringify(s.stages)})
        ON CONFLICT (start_time, end_time) DO UPDATE SET stages = EXCLUDED.stages
      `,
    ),
  );
}

export async function upsertWeightRecords(sql: Sql, records: { time: string; kg: number }[]) {
  await Promise.all(
    records.map(
      (r) => sql`
        INSERT INTO weight_records (record_time, kg)
        VALUES (${r.time}, ${r.kg})
        ON CONFLICT (record_time) DO UPDATE SET kg = EXCLUDED.kg
      `,
    ),
  );
}

export async function upsertActiveCaloriesBuckets(
  sql: Sql,
  buckets: { start: string; end: string; kcal: number }[],
) {
  await Promise.all(
    buckets.map(
      (b) => sql`
        INSERT INTO active_calories_buckets (start_time, end_time, kcal)
        VALUES (${b.start}, ${b.end}, ${b.kcal})
        ON CONFLICT (start_time) DO UPDATE SET end_time = EXCLUDED.end_time, kcal = EXCLUDED.kcal
      `,
    ),
  );
}

export async function upsertDistanceBuckets(
  sql: Sql,
  buckets: { start: string; end: string; meters: number }[],
) {
  await Promise.all(
    buckets.map(
      (b) => sql`
        INSERT INTO distance_buckets (start_time, end_time, meters)
        VALUES (${b.start}, ${b.end}, ${b.meters})
        ON CONFLICT (start_time) DO UPDATE SET end_time = EXCLUDED.end_time, meters = EXCLUDED.meters
      `,
    ),
  );
}

export async function upsertExerciseSessions(
  sql: Sql,
  sessions: { start: string; end: string; exerciseType: string; title?: string | null }[],
) {
  await Promise.all(
    sessions.map(
      (s) => sql`
        INSERT INTO exercise_sessions (start_time, end_time, exercise_type, title)
        VALUES (${s.start}, ${s.end}, ${s.exerciseType}, ${s.title ?? null})
        ON CONFLICT (start_time, end_time) DO UPDATE SET exercise_type = EXCLUDED.exercise_type, title = EXCLUDED.title
      `,
    ),
  );
}

// ---- Range reads (called from MCP tools) ---------------------------------
// Buckets/sessions are matched by overlap with [start, end), since our stored
// granularity is hourly buckets / whole sessions rather than sub-hour precision.

export async function queryStepsRange(sql: Sql, start: string, end: string) {
  const rows = (await sql`
    SELECT start_time, end_time, count FROM steps_buckets
    WHERE start_time < ${end} AND end_time > ${start}
    ORDER BY start_time
  `) as { start_time: unknown; end_time: unknown; count: string }[];

  const buckets = rows.map((r) => ({
    start: toIso(r.start_time),
    end: toIso(r.end_time),
    count: Number(r.count),
  }));
  return { totalSteps: buckets.reduce((sum, b) => sum + b.count, 0), buckets };
}

export async function queryHeartRateRange(sql: Sql, start: string, end: string) {
  const rows = (await sql`
    SELECT sample_time, bpm FROM heart_rate_samples
    WHERE sample_time >= ${start} AND sample_time <= ${end}
    ORDER BY sample_time
  `) as { sample_time: unknown; bpm: number }[];

  return { samples: rows.map((r) => ({ time: toIso(r.sample_time), bpm: r.bpm })) };
}

export async function querySleepSessionsRange(sql: Sql, start: string, end: string) {
  const rows = (await sql`
    SELECT start_time, end_time, stages FROM sleep_sessions
    WHERE start_time < ${end} AND end_time > ${start}
    ORDER BY start_time
  `) as { start_time: unknown; end_time: unknown; stages: unknown }[];

  return {
    sessions: rows.map((r) => ({
      start: toIso(r.start_time),
      end: toIso(r.end_time),
      stages: r.stages,
    })),
  };
}

export async function queryWeightRange(sql: Sql, start: string, end: string) {
  const rows = (await sql`
    SELECT record_time, kg FROM weight_records
    WHERE record_time >= ${start} AND record_time <= ${end}
    ORDER BY record_time
  `) as { record_time: unknown; kg: number }[];

  return { records: rows.map((r) => ({ time: toIso(r.record_time), kg: r.kg })) };
}

export async function queryActiveCaloriesRange(sql: Sql, start: string, end: string) {
  const rows = (await sql`
    SELECT kcal FROM active_calories_buckets
    WHERE start_time < ${end} AND end_time > ${start}
  `) as { kcal: number }[];

  return { totalKcal: rows.reduce((sum, r) => sum + Number(r.kcal), 0) };
}

export async function queryDistanceRange(sql: Sql, start: string, end: string) {
  const rows = (await sql`
    SELECT meters FROM distance_buckets
    WHERE start_time < ${end} AND end_time > ${start}
  `) as { meters: number }[];

  return { totalMeters: rows.reduce((sum, r) => sum + Number(r.meters), 0) };
}

export async function latestSyncTimestamps(sql: Sql) {
  const [row] = (await sql`
    SELECT
      (SELECT max(end_time) FROM steps_buckets) AS steps,
      (SELECT max(sample_time) FROM heart_rate_samples) AS heart_rate,
      (SELECT max(end_time) FROM sleep_sessions) AS sleep,
      (SELECT max(record_time) FROM weight_records) AS weight,
      (SELECT max(end_time) FROM active_calories_buckets) AS active_calories,
      (SELECT max(end_time) FROM distance_buckets) AS distance,
      (SELECT max(end_time) FROM exercise_sessions) AS exercise
  `) as {
    steps: unknown;
    heart_rate: unknown;
    sleep: unknown;
    weight: unknown;
    active_calories: unknown;
    distance: unknown;
    exercise: unknown;
  }[];

  const iso = (v: unknown) => (v ? toIso(v) : null);
  return {
    steps: iso(row.steps),
    heartRate: iso(row.heart_rate),
    sleep: iso(row.sleep),
    weight: iso(row.weight),
    activeCalories: iso(row.active_calories),
    distance: iso(row.distance),
    exercise: iso(row.exercise),
  };
}

export async function queryExerciseSessionsRange(sql: Sql, start: string, end: string) {
  const rows = (await sql`
    SELECT start_time, end_time, exercise_type, title FROM exercise_sessions
    WHERE start_time < ${end} AND end_time > ${start}
    ORDER BY start_time
  `) as { start_time: unknown; end_time: unknown; exercise_type: string; title: string | null }[];

  return {
    sessions: rows.map((r) => ({
      start: toIso(r.start_time),
      end: toIso(r.end_time),
      exerciseType: r.exercise_type,
      title: r.title,
    })),
  };
}
