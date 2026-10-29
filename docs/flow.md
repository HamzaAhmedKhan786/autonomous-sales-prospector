# Prospecting flow

## SIERRA agent and retrieval flow

```mermaid
flowchart LR
  U[User request] --> G[Domain and prompt guard]
  G --> S[LangGraph supervisor]
  S --> R[Research specialist]
  S --> O[Outreach specialist]
  S --> H[History specialist]
  S --> C[CRM specialist]
  R --> K[(Workspace-scoped FTS5 RAG)]
  O --> K
  H --> K
  C --> M[Allow-listed Orbit MCP reads]
  K --> E[Citation evaluator]
  M --> E
  E --> A[SIERRA answer]
```

Only validated evidence is indexed. Retrieval is scoped to the authenticated workspace and returns source URLs. The evaluator rejects unsupported results before display; CRM writes still require an explicit authenticated sync action.

```mermaid
sequenceDiagram
  autonumber
  actor Rep
  participant ASP
  participant History as ASP SQLite
  participant Profile as Licensed profile API
  participant Tavily
  participant Groq
  participant CRM
  Rep->>ASP: LinkedIn URL
  ASP->>Profile: Structured enrichment
  ASP->>Tavily: Recent company signals
  ASP->>Groq: Profile + candidate evidence + sender context
  Groq-->>ASP: Structured score and draft
  ASP->>ASP: Validate schema and citations
  ASP->>History: Persist prospect, evidence, draft and run
  ASP-->>Rep: Evidence, rationale, editable draft
  Rep->>ASP: Confirm CRM sync
  ASP->>CRM: Tenant-scoped idempotent prospect payload
  CRM->>CRM: Deduplicate + upsert + audit
  CRM-->>ASP: Account/contact/lead IDs
  ASP->>History: Persist provider, lead ID and synced time
  ASP-->>Rep: Show synchronized state
```

## What appears in each application

| Data | ASP | Orbit CRM |
| --- | --- | --- |
| Prospect identity | Research history | Contact |
| Company | Research result | Account |
| Evidence and URLs | Evidence panel | Research activities |
| Outreach copy | Editable draft | Agent/sequence context after review |
| Sync result | Provider, time, Orbit lead ID | Account/contact/lead IDs and integration heartbeat |
| Sales lifecycle | Not owned by ASP | Lead, opportunity, pipeline, activities and approvals |

Trust boundaries:

1. Provider output is untrusted and schema-validated.
2. Retrieved text may contain prompt injection; it is evidence, never an instruction.
3. The model proposes content but cannot bypass deterministic validation or confirmation.
4. The CRM shared secret authenticates the service, while `CRM_ORGANIZATION_ID` selects the tenant; both must be protected.

