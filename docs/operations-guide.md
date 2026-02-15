# Synthetic User — Operations Guide

## What Is This?

The synthetic user is an automated testing tool that pretends to be a real person using SeemoreData. It opens a browser, logs in, clicks around the product like a human would, and then writes a report about any usability problems it found. Think of it as a robot tester that gives you honest feedback about the user experience.

## Before You Start (One-Time Setup)

### Step 1: Get Your API Keys

API keys are like passwords that let our system talk to AI services. The synthetic user needs AI to decide what to click and how to evaluate what it sees, so you need to give it access to at least one AI provider.

You need up to 3 keys:

1. **OpenAI API Key** (required)
   - Go to: https://platform.openai.com/api-keys
   - Sign in (or create an account), then click "Create new secret key"
   - Copy the key — you will only see it once

2. **Anthropic API Key** (required)
   - Go to: https://console.anthropic.com/settings/keys
   - Sign in (or create an account), then click "Create Key"
   - Copy the key — you will only see it once

3. **Google AI API Key** (optional for now)
   - Go to: https://aistudio.google.com/apikey
   - Sign in and click "Create API Key"
   - Copy the key
   - **Note:** This key is only needed for future bulk runs. You can skip it for now.

If you need help getting any of these keys, just ask.

### Step 2: Get SeemoreData Test Account Credentials

To run a test, the synthetic user needs to log into SeemoreData. For this, you need:

- **The app URL** — the web address where SeemoreData is running
- **An email address** — for a test account
- **A password** — for that same test account

**Important:** This should be a dedicated test account, NOT your personal account. The synthetic user will log in, click around, and interact with the product using these credentials.

If you do not have a test account, ask your team to set one up for you.

### Step 3: Create Your .env File

The `.env` file is where you store all your keys and credentials so the system can use them. Here is how to create it:

1. Open the project folder (`synthetic_user`)
2. Find the file called `.env.example`
3. Make a copy of that file
4. Rename the copy to `.env` (remove the `.example` part)
5. Open `.env` in any text editor (Notepad, VS Code, etc.)
6. Fill in each value. It should look something like this:

```
OPENAI_API_KEY=sk-abc123your-key-here
ANTHROPIC_API_KEY=sk-ant-abc123your-key-here
GOOGLE_API_KEY=your-google-key-here
SEEMOREDATA_URL=https://your-seemoredata-instance.com
SEEMOREDATA_EMAIL=testuser@yourcompany.com
SEEMOREDATA_PASSWORD=your-test-password
```

7. Save the file

**IMPORTANT:** Never share this file with anyone or commit it to git. It contains secrets (your API keys and passwords). The project is already set up to ignore this file, but be careful not to share it manually either.

If you are not sure whether your `.env` file is correct, ask for help.

### Step 4: Verify Setup

To make sure everything is set up correctly, run this command in your terminal:

```
npx tsx src/main.ts --help
```

You should see help text showing options like `--persona` and `--flow`. This means the system is ready to go.

If you get errors instead, do not worry — just ask for help and share the error message.

## Running a Test

### Quick Start (Your First Run)

Run this command in your terminal:

```
npx tsx src/main.ts --persona finops --flow query-optimization --max-steps 5
```

Here is what will happen:

1. A browser window will open automatically
2. The AI will log into SeemoreData using your test credentials
3. It will take 5 steps (clicking, reading, navigating) like a real user would
4. When it is done, it will generate a report about what it found
5. The browser will close

This is a short test (only 5 steps) just to make sure everything works. If it completes without errors, you are good to go.

### Full Test Run

For a real test, run the same command without the `--max-steps` flag:

```
npx tsx src/main.ts --persona finops --flow query-optimization
```

This will run for up to 30 steps (the default), giving the AI more time to explore and find issues.

**Available Flows (what to test):**

| Flow | What It Tests |
|------|--------------|
| `query-optimization` | The query history page and query optimization features |
| `compute-recommendations` | The compute page and SmartPulse recommendations |
| `autoclustering-analysis` | The autoclustering analysis flow |

**Available Personas (who is testing):**

| Persona | Description | When to Use |
|---------|-------------|------------|
| `finops` | A FinOps Lead — cost-focused, impatient, wants quick answers | When you want to test how well the product serves business users |
| `data-engineer` | A Data Platform Engineer — technical, thorough, detail-oriented | When you want to test how well the product serves technical users |

### Available Options

Here is a full list of options you can use:

- `--persona finops` — Tests as a FinOps Lead (cost-focused, impatient)
- `--persona data-engineer` — Tests as a Data Platform Engineer (technical, thorough)
- `--flow query-optimization` — Tests the query history and optimization flow
- `--flow compute-recommendations` — Tests compute page and SmartPulse recommendations
- `--flow autoclustering-analysis` — Tests the autoclustering analysis flow
- `--max-steps <number>` — Limits the number of steps (default: 30)

If you are unsure which combination to use, start with `--persona finops --flow query-optimization --max-steps 5`.

## Understanding the Results

### Where to Find Results

After a run completes, look in the `runs/` folder inside the project. Each run creates its own folder with a name like:

```
2026-02-13T14-30-00_finops_query-optimization/
```

Inside that folder, you will find:

| File | What It Is |
|------|-----------|
| `video.webm` | A screen recording of the entire test session |
| `screenshots/` | A folder with screenshots taken during the run |
| `report.md` | The main report — start here |
| `report.json` | The same report in a machine-readable format |
| `decision-log.json` | A log of every decision the AI made and why |
| `action-log.json` | A log of every action the AI took in the browser |

### Reading the Report

Open `report.md` — this is the main output and the most useful file.

- The **Scorecard** section at the top gives you a quick summary of how the test went
- The **UX Issues** section lists problems the synthetic user found, each with:
  - A severity level (how bad the problem is)
  - A description of what went wrong
  - A recommendation for how to fix it
  - A confidence level — "high" means we are quite sure it is a real issue, "low" means it might be a false alarm

Start with the high-severity, high-confidence issues — those are the ones most worth fixing.

### Watching the Video

Open `video.webm` in any web browser (Chrome, Firefox, Edge) or media player (VLC). This shows exactly what the synthetic user did, step by step. It is useful for understanding the context around any issues found in the report.

If you need help interpreting anything in the report or video, just ask.

## Troubleshooting

### Login Failed

- Double-check your credentials in the `.env` file (email, password, and URL)
- Make sure the test account is still active
- If the credentials are correct but login still fails, the login page may have changed and the selectors need updating — ask for help

### "API key not found" Error

- Make sure your `.env` file exists in the project root folder
- Make sure there are no extra spaces around the `=` sign in the file
- Make sure the key values are correct (no extra characters or missing characters)

### Browser Does Not Open

Run this command to install the browser the system needs:

```
npx playwright install chromium
```

Then try your test again.

### Something Else Went Wrong

- Check the console output for error messages
- Look at the `decision-log.json` file in the run folder — it shows what the AI was thinking at each step, which can help pinpoint where things went wrong
- Ask for help — include the error message and the path to the run folder so we can investigate

## Need Help?

If anything is unclear or you run into issues, just ask. We can walk through any step together.
