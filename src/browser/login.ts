import type { Page } from "playwright";

export async function loginToSeemoreData(page: Page): Promise<void> {
  const baseUrl = process.env.SEEMOREDATA_URL ?? "https://app.seemoredata.com";
  const email = process.env.SEEMOREDATA_EMAIL;
  const password = process.env.SEEMOREDATA_PASSWORD;

  if (!email || !password) {
    throw new Error("SEEMOREDATA_EMAIL and SEEMOREDATA_PASSWORD must be set in .env");
  }

  console.log("Logging in to SeemoreData...");
  await page.goto(baseUrl, { waitUntil: "networkidle" });

  // Use locator().first() to avoid strict mode violations when multiple selectors match
  await page.locator('input[type="email"], input[name="email"], #email').first().fill(email);
  await page.locator('input[type="password"], input[name="password"], #password').first().fill(password);
  await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")').first().click();

  // Wait for redirect away from login page
  await page.waitForURL((url) => !url.pathname.includes("login"), { timeout: 30000 });
  console.log("Login successful.");
}
