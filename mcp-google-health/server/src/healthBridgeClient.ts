import type { Config } from "./config.js";

export class HealthBridgeError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "HealthBridgeError";
  }
}

export interface TimeRange {
  start: string;
  end: string;
}

/** Defaults to the trailing 24 hours when the caller omits a range. */
export function resolveTimeRange(start?: string, end?: string): TimeRange {
  const endDate = end ? new Date(end) : new Date();
  const startDate = start
    ? new Date(start)
    : new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

  if (Number.isNaN(startDate.getTime())) {
    throw new HealthBridgeError(`Invalid start time: ${start}`);
  }
  if (Number.isNaN(endDate.getTime())) {
    throw new HealthBridgeError(`Invalid end time: ${end}`);
  }

  return { start: startDate.toISOString(), end: endDate.toISOString() };
}

export class HealthBridgeClient {
  constructor(private readonly config: Config) {}

  private async get<T>(path: string, params: Record<string, string> | TimeRange): Promise<T> {
    const url = new URL(`${this.config.bridgeUrl}${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const headers: Record<string, string> = { Accept: "application/json" };
    if (this.config.bridgeApiKey) {
      headers.Authorization = `Bearer ${this.config.bridgeApiKey}`;
    }

    let response: Response;
    try {
      response = await fetch(url, { headers });
    } catch (cause) {
      throw new HealthBridgeError(
        `Could not reach the Health Connect companion app at ${this.config.bridgeUrl}. ` +
          `Make sure the Android app is running and reachable from this machine (${(cause as Error).message}).`,
      );
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new HealthBridgeError(
        `Health Connect bridge returned ${response.status} for ${path}: ${body}`,
        response.status,
      );
    }

    return (await response.json()) as T;
  }

  getStatus() {
    return this.get<{
      authorized: boolean;
      grantedPermissions: string[];
      healthConnectAvailable: boolean;
    }>("/status", {});
  }

  getSteps(range: TimeRange) {
    return this.get<{ totalSteps: number; buckets: { start: string; end: string; count: number }[] }>(
      "/records/steps",
      range,
    );
  }

  getHeartRate(range: TimeRange) {
    return this.get<{ samples: { time: string; bpm: number }[] }>(
      "/records/heart-rate",
      range,
    );
  }

  getSleepSessions(range: TimeRange) {
    return this.get<{
      sessions: {
        start: string;
        end: string;
        stages: { stage: string; start: string; end: string }[];
      }[];
    }>("/records/sleep", range);
  }

  getWeightRecords(range: TimeRange) {
    return this.get<{ records: { time: string; kg: number }[] }>(
      "/records/weight",
      range,
    );
  }

  getActiveCalories(range: TimeRange) {
    return this.get<{ totalKcal: number }>("/records/active-calories", range);
  }

  getDistance(range: TimeRange) {
    return this.get<{ totalMeters: number }>("/records/distance", range);
  }

  getExerciseSessions(range: TimeRange) {
    return this.get<{
      sessions: {
        start: string;
        end: string;
        exerciseType: string;
        title?: string;
      }[];
    }>("/records/exercise", range);
  }
}
