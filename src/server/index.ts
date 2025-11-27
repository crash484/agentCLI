import { routeAgentRequest } from "agents";
import { SupportAgent } from "./agent";

interface Env {
  SupportAgent: DurableObjectNamespace<SupportAgent>;
}

export { SupportAgent };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Let routeAgentRequest handle all agent routing including WebSocket upgrades
    const response = await routeAgentRequest(request, env);
    if (response) {
      return response;
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
