# Configuration reference

| Variable | Required | Purpose |
|---|---:|---|
| `APP_URL` | yes | Canonical public HTTPS origin |
| `DATABASE_PATH` | yes | SQLite file on an encrypted persistent volume |
| `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_BASE_URL` | core research | Structured scoring and drafting |
| `LLM_PROVIDER` | yes | `groq` for hosted inference or `local` for a loopback OpenAI-compatible runtime |
| `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` | local inference | Local endpoint and model; the endpoint is rejected unless it resolves to a loopback hostname |
| `TAVILY_API_KEY`, `TAVILY_API_URL` | core research | Current public evidence search |
| `PROFILE_API_URL`, `PROFILE_API_KEY` | core research | Licensed structured profile provider |
| `RESEARCH_RATE_LIMIT` | yes | Per-workspace hourly research ceiling |
| `EMAIL_DAILY_LIMIT` | yes | Daily sending ceiling |
| `EMAIL_API_URL`, `EMAIL_API_KEY` | optional | Resend-compatible delivery; omit to disable |
| `HUBSPOT_ACCESS_TOKEN` | optional | HubSpot private-app credential; omit to disable |
| `CRM_API_URL`, `CRM_ORGANIZATION_ID`, `ASP_SHARED_SECRET` | for CRM sync | CRM endpoint, destination tenant and matching service secret |

Keep all values server-side; no secret may use a `NEXT_PUBLIC_` prefix. Use separate staging and production keys with quotas. Rotate the CRM shared secret in both deployments together. Never paste real values into issues, logs or support conversations.

Fine-tuned hosted models are selected with `GROQ_MODEL`. For Ollama or another local OpenAI-compatible runtime, set `LLM_PROVIDER=local`, normally use `LLM_BASE_URL=http://localhost:11434/v1`, and choose the installed model with `LLM_MODEL`. Arbitrary remote custom endpoints are intentionally blocked because research inputs contain personal and commercially sensitive data.

