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

  // Fill login form — selectors may need adjustment for the actual login page
  await page.fill('input[type="email"], input[name="email"], #email', email);
  await page.fill('input[type="password"], input[name="password"], #password', password);
  await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")');

  // Wait for login to complete
  await page.waitForURL((url) => !url.pathname.includes("login"), { timeout: 30000 });
  console.log("Login successful.");
}
