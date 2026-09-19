export interface Config {
  port: number;
  bridgeUrl: string;
  bridgeApiKey?: string;
  mcpApiKey?: string;
  allowedHosts: string[];
}

function parseAllowedHosts(raw: string | undefined): string[] {
  const defaults = ["127.0.0.1", "localhost", "[::1]"];
  if (!raw) return defaults;
  const extra = raw
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);
  return [...defaults, ...extra];
}

export function loadConfig(): Config {
  const port = Number(process.env.PORT ?? 3200);
  const bridgeUrl = process.env.HEALTH_BRIDGE_URL ?? "http://127.0.0.1:8787";

  return {
    port,
    bridgeUrl: bridgeUrl.replace(/\/+$/, ""),
    bridgeApiKey: process.env.HEALTH_BRIDGE_API_KEY,
    mcpApiKey: process.env.MCP_API_KEY,
    allowedHosts: parseAllowedHosts(process.env.MCP_ALLOWED_HOSTS),
  };
}
