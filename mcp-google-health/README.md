# Google Health Connect MCP bridge (cloud-hosted)

Lets Claude (mobile or desktop) read your phone's Google Health Connect data —
steps, heart rate, sleep, weight, active calories, distance, exercise
sessions — through an MCP connector that's reachable 24/7 from anywhere,
with no laptop or tunnel required.

## Architecture

Health Connect data lives **only on the Android device** — Google doesn't
offer a live cloud API for it. So instead of Claude reaching into your
phone in real time, the phone periodically **pushes** a snapshot to a
cloud backend, and Claude reads from that backend:

```
┌───────────────────────┐  HTTPS POST /api/sync   ┌──────────────────────────┐   MCP (Streamable HTTP)   ┌────────────┐
│ Android companion app  │ ───────────────────────▶│ Vercel: api/sync, api/mcp│◀─────────────────────────│ Claude     │
│ (Health Connect SDK +  │  every ~15 min, any     │  + Neon Postgres         │  https://your-app         │ (mobile or │
│  WorkManager)           │  network (WiFi/cell)    │  android-companion/      │  .vercel.app/mcp          │  desktop)  │
└───────────────────────┘                          └──────────────────────────┘                            └────────────┘
```

- **`android-companion/`** — an Android app that requests Health Connect
  read permissions and runs a WorkManager job every ~15 minutes (the OS
  minimum for periodic background work) that uploads a rolling 48-hour
  window of data to your Vercel deployment. No local server, no LAN
  pairing, no port exposure — it works over any internet connection.
- **`server/`** — a Vercel serverless project (`api/sync.ts`, `api/mcp.ts`)
  backed by Neon Postgres. `/api/sync` receives the phone's uploads;
  `/api/mcp` is the MCP endpoint Claude connects to, which reads back
  whatever was last synced.

**Tradeoff of this design**: data can lag by up to ~15–20 minutes (Android
won't run background jobs more often than that) rather than being truly
live. Given the metrics involved (steps, sleep, heart rate, etc.), that's
a reasonable trade for "always reachable, no infrastructure to babysit."

## 1. Deploy the server to Vercel

You mentioned you already have domains on Vercel, so:

1. **Add Neon Postgres**: in your Vercel project, go to **Storage → Create
   Database → Neon** (or connect an existing Neon project). This
   automatically sets the `DATABASE_URL` environment variable.
2. **Run the schema once** against that database:
   ```bash
   psql "$DATABASE_URL" -f mcp-google-health/server/db/schema.sql
   ```
   (Get the connection string from the Neon dashboard, or `vercel env pull`
   after step 1.)
3. **Set two more environment variables** in Vercel (Project Settings →
   Environment Variables):
   - `MCP_API_KEY` — a long random string; protects `/api/mcp` (Claude's
     connector needs this).
   - `SYNC_API_KEY` — a different long random string; protects `/api/sync`
     (the phone needs this).
4. **Deploy**:
   ```bash
   cd mcp-google-health/server
   npm install
   npx vercel deploy --prod
   ```
   (or connect the repo in the Vercel dashboard for git-based deploys).
   You'll get a permanent URL like `https://your-project.vercel.app`, or
   attach one of your existing domains to it.

## 2. Install the Android companion app

Requires Android Studio (this project can't be built/tested in this
sandbox — there's no Android SDK here, so treat the Kotlin as
written-but-unverified until you build it).

1. Open `android-companion/` in Android Studio, let it sync.
2. Install the **Health Connect** app from Google Play if your phone is on
   Android 9–13. Android 14+ has it built in.
3. Run the app on a physical device (Health Connect doesn't behave well on
   emulators). Tap **Grant Health Connect access** and approve the
   permissions.
4. Enter your Vercel deployment URL (e.g. `https://your-project.vercel.app`)
   and the `SYNC_API_KEY` you set in step 1.3, then tap **Save & enable
   periodic sync**. Use **Sync now** to trigger an immediate upload and
   confirm it works before waiting on the 15-minute schedule.

The app doesn't need to stay open — WorkManager runs the sync job in the
background on its own schedule, including across reboots.

## 3. Add the connector in Claude mobile

**Settings → Connectors → Add connector**:

- URL: `https://your-project.vercel.app/api/mcp`
- If Claude's connector setup asks for an API key/auth header, use
  `Authorization: Bearer <MCP_API_KEY>`.

Ask Claude something like "how many steps have I taken today?" — it reads
whatever the phone most recently synced. If an answer seems stale, ask
Claude to run `check_sync_status` first — it reports the last synced
timestamp per metric.

## Tools exposed

| Tool | Data |
|---|---|
| `check_sync_status` | Last synced timestamp per metric (data is pushed periodically, not read live) |
| `get_steps` | Total steps + hourly buckets |
| `get_heart_rate_samples` | Raw BPM samples |
| `get_sleep_sessions` | Sleep sessions with stage breakdowns |
| `get_weight_records` | Body weight (kg) |
| `get_active_calories` | Active calories burned (kcal) |
| `get_distance` | Distance traveled (meters) |
| `get_exercise_sessions` | Logged workouts |

All take optional `start`/`end` ISO-8601 timestamps; both default to the
trailing 24 hours when omitted. Range matching is bucket/session-level
(hourly for steps/calories/distance), so sub-hour queries are approximate.

## Security notes

- The Android app only ever **reads** Health Connect data; it never writes.
- `/api/sync` and `/api/mcp` both fail closed: if `SYNC_API_KEY` /
  `MCP_API_KEY` aren't set, every request is rejected rather than allowed
  through.
- This is a single-user design (no multi-account support) — anyone with
  `MCP_API_KEY` can read all synced health data, so treat it like a
  password.
- Rotate a key by changing it in Vercel's env vars and, for `SYNC_API_KEY`,
  re-entering it in the Android app's settings.
