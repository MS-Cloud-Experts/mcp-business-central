import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getTools, dispatch } from "./handlers/dispatcher.js";

export function createServer(): Server {
  const server = new Server(
    { name: "mcp-business-central", version: "0.4.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: getTools(),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return dispatch(name, (args as Record<string, unknown>) ?? {});
  });

  return server;
}
