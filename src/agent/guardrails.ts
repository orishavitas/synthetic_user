import type { Page } from "playwright";
import type { Action } from "../types/index.js";
import type { GuardrailsConfig } from "../types/index.js";
import type { Flow } from "../types/index.js";

export interface GuardrailCheck {
  blocked: boolean;
  reason: string;
}

export class Guardrails {
  private config: GuardrailsConfig;
  private flowOverrides: Flow["guardrailOverrides"];

  constructor(config: GuardrailsConfig, flowOverrides?: Flow["guardrailOverrides"]) {
    this.config = config;
    this.flowOverrides = flowOverrides;
  }

  async checkAction(page: Page, action: Action): Promise<GuardrailCheck> {
    if (action.type === "done" || action.type === "blocked" || action.type === "wait") {
      return { blocked: false, reason: "" };
    }

    if (action.type === "navigate") {
      return this.checkNavigation(action.url);
    }

    if (action.type === "click") {
      return this.checkClick(page, action.selector);
    }

    return { blocked: false, reason: "" };
  }

  private checkNavigation(url: string): GuardrailCheck {
    for (const pattern of this.config.blockedUrlPatterns) {
      if (url.includes(pattern)) {
        return { blocked: true, reason: `URL matches blocked pattern: ${pattern}` };
      }
    }

    if (url.startsWith("http")) {
      try {
        const hostname = new URL(url).hostname;
        const allowed = this.config.allowedDomains.some(
          (d) => hostname === d || hostname.endsWith(`.${d}`)
        );
        if (!allowed) {
          return { blocked: true, reason: `Navigation outside allowed domains: ${hostname}` };
        }
      } catch {
        return { blocked: true, reason: `Invalid URL: ${url}` };
      }
    }

    return { blocked: false, reason: "" };
  }

  private async checkClick(page: Page, selector: string): Promise<GuardrailCheck> {
    for (const blockedSelector of this.config.blockedSelectors) {
      if (selector === blockedSelector) {
        return { blocked: true, reason: `Selector matches blocklist: ${selector}` };
      }
    }

    const blockedTexts = [...this.config.blockedButtonTexts];
    if (this.flowOverrides?.blockedButtonTexts) {
      blockedTexts.push(...this.flowOverrides.blockedButtonTexts);
    }

    const allowedTexts = this.flowOverrides?.allowedButtonTexts ?? [];

    try {
      const elementText = await page.$eval(selector, (el) => el.textContent?.trim() ?? "");

      for (const allowed of allowedTexts) {
        if (elementText.toLowerCase().includes(allowed.toLowerCase())) {
          return { blocked: false, reason: "" };
        }
      }

      for (const blocked of blockedTexts) {
        if (elementText.toLowerCase().includes(blocked.toLowerCase())) {
          return {
            blocked: true,
            reason: `Button text matches blocklist: "${elementText}" contains "${blocked}"`,
          };
        }
      }
    } catch {
      // If we can't read the element text, allow the action
    }

    return { blocked: false, reason: "" };
  }
}
