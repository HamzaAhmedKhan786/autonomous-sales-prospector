# Autonomous Sales Prospector AI Product Requirements

## Product outcome

ASP is the governed discovery and research workspace. SIERRA helps authenticated users research permitted B2B prospects, understand research history, prepare grounded outreach, and explicitly transfer reviewed records to Orbit CRM.

## Governed AI architecture

- **LangGraph plan-and-execute workflow:** guard request → select a bounded task → aggregate local workspace facts → answer → evaluate.
- **JEV TypeSafe model:** optional typed domain and workflow classification; deterministic routing is the fallback and security authority.
- **Agentic RAG:** profile and company evidence is validated, source-linked, and treated as untrusted input.
- **Reflection/evaluation:** outputs must stay within the evidence and product scope.
- **Memory and HITL:** research history is persistent; sending, sequencing, CRM sync, and deletion require explicit UI actions.
- **MCP client:** SIERRA may use only allow-listed read tools from Orbit. CRM writes use the separate authenticated, idempotent sync endpoint.

SIERRA aggregates workspace data locally and does not export raw prospect records to JEV. Provider credentials are server-side only.

## Safety and observability

Domain guardrails, prompt-injection screening, tenant-scoped SQL, schema validation, provider timeouts, retry budgets, usage limits, audit records, Langfuse traces, Prometheus metrics, and Grafana dashboards provide defense in depth.

## Acceptance criteria

1. SIERRA rejects requests unrelated to ethical B2B prospecting and Orbit synchronization.
2. A user can access only their active workspace.
3. Evidence-backed drafts cite validated sources and remain human editable.
4. External actions require explicit confirmation and are audited.
5. Monitoring identifies failures without capturing secrets or raw personal data.
