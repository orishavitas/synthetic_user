-- Run this once against your Neon database (Neon console SQL editor, or `psql "$DATABASE_URL" -f db/schema.sql`).
--
-- Single-user store: the phone periodically uploads a rolling window of Health Connect
-- data (see android-companion/.../SyncWorker.kt) and these tables hold the latest known
-- state per bucket/sample/session, upserted on each sync so re-uploading an overlapping
-- window is a no-op rather than a duplicate.

CREATE TABLE IF NOT EXISTS steps_buckets (
    start_time TIMESTAMPTZ PRIMARY KEY,
    end_time   TIMESTAMPTZ NOT NULL,
    count      BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS heart_rate_samples (
    sample_time TIMESTAMPTZ PRIMARY KEY,
    bpm         INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sleep_sessions (
    start_time TIMESTAMPTZ NOT NULL,
    end_time   TIMESTAMPTZ NOT NULL,
    stages     JSONB NOT NULL DEFAULT '[]',
    PRIMARY KEY (start_time, end_time)
);

CREATE TABLE IF NOT EXISTS weight_records (
    record_time TIMESTAMPTZ PRIMARY KEY,
    kg          DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS active_calories_buckets (
    start_time TIMESTAMPTZ PRIMARY KEY,
    end_time   TIMESTAMPTZ NOT NULL,
    kcal       DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS distance_buckets (
    start_time TIMESTAMPTZ PRIMARY KEY,
    end_time   TIMESTAMPTZ NOT NULL,
    meters     DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS exercise_sessions (
    start_time     TIMESTAMPTZ NOT NULL,
    end_time       TIMESTAMPTZ NOT NULL,
    exercise_type  TEXT NOT NULL,
    title          TEXT,
    PRIMARY KEY (start_time, end_time)
);
