# Handoff: Google Health Connect MCP bridge

Status as of this session: architecture is built and the server half is
tested; nothing has been deployed or run on a real device yet. Read
`README.md` first for the full architecture/setup story — this file is
just the punch list for whoever picks this up next.

## What's done

- **`server/`** (Vercel serverless + Neon Postgres): all TypeScript
  typechecks (`npm run typecheck`), and `api/mcp.ts` / `api/sync.ts` were
  smoke-tested against a real local `http.createServer` harness (not just
  mocks) — auth rejection, `tools/list` returning all 8 tools, and the
  sync endpoint's auth + "DATABASE_URL not set" error path all verified
  working. **Never deployed to Vercel, never hit a real Neon database.**
- **`android-companion/`**: written against the current documented Health
  Connect / WorkManager / OkHttp APIs (verified via web search this
  session, not against real docs offline). **Never compiled** — this
  sandbox has no Android SDK. Treat every Kotlin file as "should be right"
  rather than "known working."

## TODO, in order

1. **Deploy the server** (`mcp-google-health/README.md` §1):
   - Add Neon Postgres to the Vercel project (Storage tab).
   - Run `db/schema.sql` against it once.
   - Set `MCP_API_KEY` and `SYNC_API_KEY` env vars in Vercel.
   - `vercel deploy --prod`.
   - Sanity check: `curl https://<deployment>/api/health` → `{"ok":true}`.

2. **Build `android-companion/` in Android Studio** — this is the first
   real compile. Expect at least one Gradle/API mismatch to shake out
   (dependency versions were picked from web search, not from a working
   build). Likely trouble spots if something breaks:
   - `androidx.health.connect:connect-client:1.1.0` API surface
     (`HealthConnectRepository.kt`) — class/method names were confirmed
     via docs fetch, but untested against the real SDK jar.
   - `activity-alias` + `PermissionController` permission-rationale wiring
     in `AndroidManifest.xml`.
   - WorkManager + OkHttp dependency resolution in
     `app/build.gradle.kts`.

3. **End-to-end test on a real device**:
   - Grant Health Connect permissions in the app.
   - Enter the Vercel URL + `SYNC_API_KEY`, tap "Sync now".
   - Confirm rows land in Neon (`select * from steps_buckets;` etc.).
   - Call `/api/mcp` `tools/call` for `get_steps` and confirm it reads
     back what was just synced.

4. **Add the connector in the Claude mobile app** and ask a real question
   ("how many steps today?"). Confirm `check_sync_status` reports a
   recent timestamp, not stale/null.

5. **Nice-to-haves, not blocking**: replace the placeholder launcher icon
   (`@android:drawable/sym_def_app_icon` in the manifest) with a real one;
   consider whether `EXERCISE_TYPE_NAMES` in `HealthConnectRepository.kt`
   needs more codes mapped (currently only ~8 of Health Connect's 80+
   exercise types are named, rest fall back to `CODE_<n>`).

## Known limitations (by design, not bugs)

- Data lags up to ~15–20 minutes (Android's minimum periodic WorkManager
  interval) — this is a push-sync design, not live.
- Single-user only: no auth beyond the two shared API keys.
- Range queries are bucket/session-granularity (hourly for
  steps/calories/distance), so sub-hour queries are approximate.
