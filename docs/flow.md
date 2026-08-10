# Prospecting flow

```mermaid
sequenceDiagram
  actor Rep
  participant ASP
  participant Profile as Licensed profile API
  participant Tavily
  participant Groq
  participant CRM
  Rep->>ASP: LinkedIn URL
  ASP->>Profile: Structured enrichment
  ASP->>Tavily: Recent company signals
  ASP->>Groq: Profile + candidate evidence + sender context
  Groq-->>ASP: Structured score and draft
  ASP->>ASP: Validate citation and persist history
  ASP-->>Rep: Evidence, rationale, editable draft
  Rep->>ASP: Confirm sync/send
  ASP->>CRM: Idempotent prospect payload
  CRM-->>ASP: Account/contact/lead IDs
```

Trust boundaries:

1. Provider output is untrusted and schema-validated.
2. Retrieved text may contain prompt injection; it is evidence, never an instruction.
3. The model proposes content but cannot bypass deterministic validation or confirmation.
4. The CRM shared secret authenticates the service, while `CRM_ORGANIZATION_ID` selects the tenant; both must be protected.

