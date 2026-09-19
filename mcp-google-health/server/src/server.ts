import type { Request, Response, NextFunction } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import type { Config } from "./config.js";
import { HealthBridgeClient } from "./healthBridgeClient.js";
import { registerHealthTools } from "./tools.js";

function buildMcpServer(bridge: HealthBridgeClient): McpServer {
  const server = new McpServer({
    name: "google-health-connect",
    version: "0.1.0",
  });
  registerHealthTools(server, bridge);
  return server;
}

/**
 * Dev-mode servers are typically exposed to Claude mobile through a public tunnel
 * (ngrok, cloudflared), so anyone who guesses the URL can otherwise call these tools.
 * When MCP_API_KEY is set, require it as a bearer token on every /mcp request.
 */
function requireApiKey(apiKey: string | undefined) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!apiKey) return next();

    const header = req.header("authorization") ?? "";
    const [scheme, token] = header.split(" ");
    if (scheme === "Bearer" && token === apiKey) {
      return next();
    }

    res.status(401).json({
      jsonrpc: "2.0",
      error: { code: -32001, message: "Unauthorized: missing or invalid bearer token." },
      id: null,
    });
  };
}

export function createApp(config: Config) {
  const bridge = new HealthBridgeClient(config);
  const app = createMcpExpressApp({
    host: "0.0.0.0",
    allowedHosts: config.allowedHosts,
  });

  app.get("/healthz", (_req, res) => {
    res.json({ ok: true });
  });

  const auth = requireApiKey(config.mcpApiKey);

  // Stateless mode: a fresh MCP server + transport per request. Simple and adequate
  // for a single-user dev bridge; no session state to leak or clean up.
  app.post("/mcp", auth, async (req, res) => {
    try {
      const server = buildMcpServer(bridge);
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      res.on("close", () => {
        transport.close();
        server.close();
      });
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  const methodNotAllowed = (_req: Request, res: Response) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed." },
      id: null,
    });
  };
  app.get("/mcp", auth, methodNotAllowed);
  app.delete("/mcp", auth, methodNotAllowed);

  return app;
}
