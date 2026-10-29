const READ_ONLY_TOOLS = new Set(["search_crm", "retrieve_knowledge"]);

type McpResponse<T> = {
  jsonrpc: "2.0";
  id: string;
  result?: T;
  error?: { code: number; message: string };
};

function configuration() {
  const baseUrl = process.env.CRM_API_URL?.replace(/\/$/, "");
  const organizationId = process.env.CRM_ORGANIZATION_ID;
  const secret = process.env.ASP_SHARED_SECRET;
  if (!baseUrl || !organizationId || !secret) {
    throw new Error("Orbit MCP requires CRM_API_URL, CRM_ORGANIZATION_ID, and ASP_SHARED_SECRET.");
  }
  return { baseUrl, organizationId, secret };
}

async function request<T>(method: string, params?: Record<string, unknown>): Promise<T> {
  const { baseUrl, organizationId, secret } = configuration();
  const id = crypto.randomUUID();
  const response = await fetch(`${baseUrl}/api/v1/mcp`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${secret}`,
      "content-type": "application/json",
      "x-correlation-id": id,
      "x-organization-id": organizationId,
    },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Orbit MCP returned HTTP ${response.status}.`);
  const payload = (await response.json()) as McpResponse<T>;
  if (payload.error) throw new Error(payload.error.message);
  if (payload.result === undefined) throw new Error("Orbit MCP returned no result.");
  return payload.result;
}

export function listOrbitTools() {
  return request<{ tools: Array<{ name: string; description?: string }> }>("tools/list");
}

export function callOrbitReadTool(name: string, arguments_: Record<string, unknown>) {
  if (!READ_ONLY_TOOLS.has(name)) throw new Error(`ASP is not permitted to invoke the Orbit MCP tool '${name}'.`);
  return request<{ content: Array<{ type: "text"; text: string }> }>("tools/call", {
    name,
    arguments: arguments_,
  });
}
