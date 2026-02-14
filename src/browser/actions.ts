import type { Page } from "playwright";
import type { Action } from "../types/index.js";

export async function executeAction(page: Page, action: Action): Promise<void> {
  switch (action.type) {
    case "click":
      await page.click(action.selector, { timeout: 10000 });
      break;
    case "type":
      await page.fill(action.selector, action.text);
      break;
    case "scroll":
      await page.mouse.wheel(0, action.direction === "down" ? 500 : -500);
      break;
    case "navigate":
      await page.goto(action.url, { waitUntil: "networkidle" });
      break;
    case "wait":
      await page.waitForTimeout(action.seconds * 1000);
      break;
    case "done":
    case "blocked":
      // These are exit signals, not browser actions
      break;
  }
}

export async function waitForPageSettle(page: Page): Promise<void> {
  try {
    await page.waitForLoadState("networkidle", { timeout: 5000 });
  } catch {
    // Timeout is acceptable — page may have persistent connections
  }
}

export async function getPageState(page: Page): Promise<{ url: string; title: string }> {
  return {
    url: page.url(),
    title: await page.title(),
  };
}
