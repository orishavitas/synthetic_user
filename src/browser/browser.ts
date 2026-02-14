import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { mkdirSync } from "fs";
import { resolve } from "path";

export interface BrowserSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  runDir: string;
  screenshotsDir: string;
}

export async function launchBrowser(runDir: string): Promise<BrowserSession> {
  const screenshotsDir = resolve(runDir, "screenshots");
  mkdirSync(screenshotsDir, { recursive: true });

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: runDir, size: { width: 1920, height: 1080 } },
  });
  const page = await context.newPage();

  return { browser, context, page, runDir, screenshotsDir };
}

export async function takeScreenshot(
  session: BrowserSession,
  stepNumber: number
): Promise<{ path: string; base64: string }> {
  const filename = `step-${String(stepNumber).padStart(3, "0")}.png`;
  const filepath = resolve(session.screenshotsDir, filename);
  const buffer = await session.page.screenshot({ fullPage: false, path: filepath });
  return { path: filename, base64: buffer.toString("base64") };
}

export async function closeBrowser(session: BrowserSession): Promise<string | null> {
  await session.context.close(); // triggers video save
  await session.browser.close();

  // Find the video file that Playwright created
  const { readdirSync } = await import("fs");
  const files = readdirSync(session.runDir).filter((f) => f.endsWith(".webm"));
  return files.length > 0 ? files[0] : null;
}
