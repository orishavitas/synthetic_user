import "dotenv/config";
import { loadConfig } from "./config.js";
import { createApp } from "./server.js";

const config = loadConfig();
const app = createApp(config);

app.listen(config.port, () => {
  console.log(`Google Health Connect MCP server listening on http://localhost:${config.port}/mcp`);
  console.log(`Bridging to Android companion app at ${config.bridgeUrl}`);
  if (!config.mcpApiKey) {
    console.warn(
      "MCP_API_KEY is not set. If you tunnel this server publicly (ngrok/cloudflared), " +
        "anyone with the URL can read this device's health data. Set MCP_API_KEY before doing that.",
    );
  }
});
