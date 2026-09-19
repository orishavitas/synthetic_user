export interface TimeRange {
  start: string;
  end: string;
}

export class InvalidTimeRangeError extends Error {}

/** Defaults to the trailing 24 hours when the caller omits a range. */
export function resolveTimeRange(start?: string, end?: string): TimeRange {
  const endDate = end ? new Date(end) : new Date();
  const startDate = start
    ? new Date(start)
    : new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

  if (Number.isNaN(startDate.getTime())) {
    throw new InvalidTimeRangeError(`Invalid start time: ${start}`);
  }
  if (Number.isNaN(endDate.getTime())) {
    throw new InvalidTimeRangeError(`Invalid end time: ${end}`);
  }

  return { start: startDate.toISOString(), end: endDate.toISOString() };
}
