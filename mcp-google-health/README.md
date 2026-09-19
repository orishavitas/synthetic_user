# Google Health Connect MCP bridge (dev/local)

Lets Claude (mobile or desktop) read your phone's Google Health Connect data —
steps, heart rate, sleep, weight, active calories, distance, exercise
sessions — through an MCP connector.

## Why two components

Health Connect data lives **only on the Android device** — Google does not
offer a cloud API for it (unlike the older, now-deprecated Google Fit REST
API). Claude's mobile app only speaks to **remote** MCP servers (a public
HTTPS URL), it cannot run a process on your phone or launch a local one on
your computer.

So this is a two-part bridge:

```
┌─────────────────────┐   local HTTP    ┌──────────────────────┐   MCP (Streamable HTTP)   ┌────────────┐
│ Android companion app│ ───────────────▶│ Node MCP server       │◀─────────────────────────│ Claude     │
│ (Health Connect SDK) │  LAN / adb      │ (this machine)        │  tunneled via ngrok/      │ (mobile or │
│  android-companion/  │  reverse        │  server/              │  cloudflared for dev      │  desktop)  │
└─────────────────────┘                 └──────────────────────┘                            └────────────┘
```

1. **`android-companion/`** — a small Android app that requests Health
   Connect read permissions and serves the data over a local HTTP API
   (`http://<phone-ip>:8787`).
2. **`server/`** — a Node/TypeScript MCP server that calls that local API
   and exposes it as MCP tools (`get_steps`, `get_heart_rate_samples`, etc.).
   You run this on your laptop and tunnel it so Claude mobile can reach it.

This setup is **dev/local only**, per how it was scoped: no production
hosting, no Google Cloud OAuth app. Everything runs on your own machine and
phone, on your own network.

## 1. Run the Android companion app

Requires Android Studio (this project can't be built/tested in this
sandbox — there's no Android SDK here, so treat the Kotlin as written-but-
unverified until you build it).

1. Open `android-companion/` as a project in Android Studio. Let it sync
   and generate the Gradle wrapper if prompted.
2. Install the **Health Connect** app from Google Play if your phone is on
   Android 9–13. Android 14+ has it built in.
3. Run the app on a physical device (Health Connect doesn't work well on
   emulators). Grant the health permissions when prompted.
4. Tap **Start bridge server**. The screen shows:
   - the phone's local IP address(es) and port (`8787`)
   - a generated API key

Keep the app open (or at least backgrounded, not force-stopped) — it runs
the bridge in a foreground service so Android won't kill it.

## 2. Run the MCP server

```bash
cd mcp-google-health/server
npm install
cp .env.example .env   # then fill in the values shown on the phone
npm run dev
```

`.env`:

```
HEALTH_BRIDGE_URL=http://192.168.1.23:8787   # from the app screen; or http://127.0.0.1:8787 with adb reverse
HEALTH_BRIDGE_API_KEY=<the key shown in the app>
MCP_API_KEY=<make up your own long random string>
MCP_ALLOWED_HOSTS=your-tunnel-subdomain.ngrok-free.app
PORT=3200
```

- `HEALTH_BRIDGE_URL`/`HEALTH_BRIDGE_API_KEY` — how this server reaches the
  phone.
- `MCP_API_KEY` — protects *this* server. Once tunneled, its URL is public;
  without this, anyone with the link could read your health data.
- `MCP_ALLOWED_HOSTS` — required once you tunnel (see below): the SDK's
  DNS-rebinding protection otherwise rejects requests whose `Host` header
  isn't `localhost`.

If your laptop and phone aren't on the same Wi-Fi network, connect the
phone by USB instead and run `adb reverse tcp:8787 tcp:8787`, then set
`HEALTH_BRIDGE_URL=http://127.0.0.1:8787`.

## 3. Expose it to Claude mobile

Claude mobile needs a public HTTPS URL. This still runs on the same
laptop/machine as the MCP server — a tunnel just dials out from there, it
doesn't need a separate host. Two options:

### Option A — Cloudflare named tunnel (recommended: permanent URL)

Free, and unlike ngrok's free tier the URL doesn't change every restart.
Requires you own a domain added to a (free) Cloudflare account.

```bash
brew install cloudflared   # or see cloudflared's install docs for your OS

cloudflared tunnel login
cloudflared tunnel create health-mcp
cloudflared tunnel route dns health-mcp mcp.yourdomain.com

cp mcp-google-health/server/cloudflared/config.yml.example \
   mcp-google-health/server/cloudflared/config.yml
# edit config.yml: set credentials-file to the path cloudflared printed above

cloudflared tunnel run health-mcp
```

Set `MCP_ALLOWED_HOSTS=mcp.yourdomain.com` in `.env` and restart `npm run dev`.
Your connector URL is now permanently `https://mcp.yourdomain.com/mcp`.

### Option B — Quick tunnel (no domain needed, ephemeral URL)

Same tradeoff as ngrok — zero setup, but the URL changes every time you
restart it, so you'll need to re-add the connector in Claude mobile each time.

```bash
cloudflared tunnel --url http://localhost:3200
# or: ngrok http 3200
```

Take the `https://...trycloudflare.com` (or `...ngrok-free.app`) URL it
prints, set its bare hostname as `MCP_ALLOWED_HOSTS` in `.env`, and restart
`npm run dev`.

### Add the connector

In the Claude mobile app: **Settings → Connectors → Add connector**, and enter:

- URL: `https://<your-tunnel-domain>/mcp`
- If Claude's connector setup asks for an API key/auth header, use
  `Authorization: Bearer <MCP_API_KEY>`.

Ask Claude something like "how many steps have I taken today?" — it should
call `get_steps` and read the answer back from your phone.

## Tools exposed

| Tool | Data |
|---|---|
| `check_health_connect_status` | Whether the phone app is reachable and which permissions are granted |
| `get_steps` | Total steps + hourly buckets |
| `get_heart_rate_samples` | Raw BPM samples |
| `get_sleep_sessions` | Sleep sessions with stage breakdowns |
| `get_weight_records` | Body weight (kg) |
| `get_active_calories` | Active calories burned (kcal) |
| `get_distance` | Distance traveled (meters) |
| `get_exercise_sessions` | Logged workouts |

All take optional `start`/`end` ISO-8601 timestamps; both default to the
trailing 24 hours when omitted.

## Security notes

- The Android app only ever **reads** Health Connect data; it never writes.
- The local bridge (`android-companion`) uses plain HTTP by design — it's
  meant for your own LAN/USB only. Don't port-forward it to the internet.
- The MCP server should always sit behind `MCP_API_KEY` once tunneled.
- Quick tunnels (ngrok free tier, `cloudflared tunnel --url`) are ephemeral —
  the URL changes each restart, so you'll need to re-add the connector in
  Claude mobile when that happens. A named Cloudflare tunnel (Option A
  above) avoids this if you have a domain to spare.
- Going beyond dev/local (a permanent hosted MCP server, real Google OAuth,
  etc.) is a materially bigger project — a real backend, HTTPS certs, and
  either the deprecated Google Fit API or a proper mobile-to-cloud sync
  path for Health Connect data. Ask if/when you want to take that on.
