# Autonomous Sales Prospector

A local-first AI SDR research assistant. Given a LinkedIn profile URL, it enriches the prospect through a compliant data provider, searches recent company news with Tavily, and uses OpenAI to produce an evidence-backed outreach draft for human review.

The MVP never sends email automatically.

## MVP scope

1. Accept one LinkedIn profile URL.
2. Retrieve professional profile data through a configurable provider adapter.
3. Search company news from the last month with Tavily.
4. Use the OpenAI Responses API to select a grounded signal and draft a concise email.
5. Show the selected source, relevance explanation, subject, and editable email.
6. Require a human to review and copy the result.

## Implemented platform capabilities

- Secure password login, server-side sessions, workspace membership, owner/admin/member roles, and invitations
- SQLite persistence for users, workspaces, prospects, evidence, drafts, research runs, sequences, email events, audit records, rate limits, and daily usage
- Workspace-level duplicate LinkedIn URL detection and reusable research history
- Editable sender, company, offer, audience, proof, and retention settings
- Bounded provider timeouts, exponential retry, hourly research limits, daily email limits, and token/provider/email usage counters
- CSV imports of up to 1,000 prospects with duplicate and invalid-row reporting
- HubSpot contact sync adapter and Resend-compatible email delivery adapter
- Multi-step sequence definitions and confirmed prospect enrollment
- GDPR-style personal-data export, prospect deletion, account deletion, retention execution, and mutation audit logs
- Automated tests with mocked profile, Tavily, and OpenAI responses, including hallucinated-source rejection

Email and CRM operations remain disabled until the corresponding server-side credentials are configured. Sending requires an explicit `confirmed: true` request.

## Tech stack

- Next.js and TypeScript for the web application and server API
- OpenAI Responses API with structured JSON output
- Tavily Search API for current company news
- A replaceable, compliant profile enrichment provider
- Zod for runtime validation

Development is local. Production hosting will be selected only after the MVP workflow is validated.

## Local setup

Requirements: Node.js 22.13 or newer.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open the localhost URL printed by Next.js, usually `http://localhost:3000`.

Set these values in `.env.local`:

```env
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-5.6-luna
TAVILY_API_KEY=your_key
PROFILE_API_URL=https://your-provider.example/profile
PROFILE_API_KEY=your_key
DATABASE_PATH=./data/prospector.db
RESEARCH_RATE_LIMIT=20
EMAIL_DAILY_LIMIT=100
EMAIL_API_KEY=your_resend_compatible_key
EMAIL_API_URL=https://api.resend.com/emails
HUBSPOT_ACCESS_TOKEN=your_private_app_token
APP_URL=http://localhost:3000
```

API keys are server-side and must never be exposed through `NEXT_PUBLIC_` variables or committed to Git.

## Profile provider contract

The adapter sends this request:

```http
POST PROFILE_API_URL
Authorization: Bearer PROFILE_API_KEY
Content-Type: application/json

{"linkedinUrl":"https://www.linkedin.com/in/example"}
```

The provider must return:

```json
{
  "name": "Example Person",
  "headline": "Revenue leader",
  "currentRole": "VP of Revenue",
  "currentCompany": "Example Company",
  "location": "Berlin, Germany",
  "about": "Professional summary",
  "experience": [
    { "title": "VP of Revenue", "company": "Example Company", "description": "Optional" }
  ]
}
```

This contract keeps the app independent of a specific scraping vendor and allows an approved internal enrichment service, a licensed data provider, or an official integration to be substituted later.

## API

`POST /api/research`

```json
{ "linkedinUrl": "https://www.linkedin.com/in/example" }
```

The route runs profile enrichment, Tavily research, evidence validation, and OpenAI drafting. It returns `503` when required local configuration is missing, `400` for invalid input, and `502` when an upstream provider fails.

## Verification

```powershell
npm run lint
npm run build
```

## Deployment later

The selected working brand is **Autonomous Sales Prospector**. No external domain is claimed by this repository. Use `APP_URL=https://prospector.<your-owned-domain>` after DNS ownership is confirmed.

The included `Dockerfile` and `docker-compose.yml` package the standard Next.js server with a persistent `/app/data` volume. This is suitable for a Docker-capable VPS, AWS EC2/Lightsail, or another host with durable volumes:

```powershell
docker compose up --build -d
```

For multi-instance production, replace the isolated SQLite data module with PostgreSQL before horizontally scaling. Configure TLS at the load balancer or reverse proxy, schedule `npm run retention` daily, back up the data volume, and inject all secrets through the host rather than the image.

A live production deployment still requires an external host account, DNS access to an owned domain, verified sending domain, and provider credentials. None are stored in this repository.

## Key application APIs

- `/api/auth/*` — registration, login, logout, current session
- `/api/settings` — offer context and retention configuration
- `/api/research` and `/api/history` — research, duplicate detection, persistence, and history
- `/api/bulk` — CSV prospect import
- `/api/team` — membership and invitations
- `/api/sequences` — sequence creation and enrollment
- `/api/crm/sync` and `/api/email/send` — external actions with explicit authorization and audit logging
- `/api/gdpr/*`, `/api/audit`, and `/api/usage` — governance and operational reporting

## Responsible use

Use only data sources and enrichment providers you are authorized to access. Follow LinkedIn terms, provider terms, GDPR, CAN-SPAM, and other applicable privacy and outreach laws. Always review generated claims and drafts before use.
