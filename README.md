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

Authentication, saved research history, CRM sync, bulk prospecting, sequences, and automatic sending are intentionally outside the first MVP.

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

The standard Next.js application can later be deployed to Vercel, AWS, Cloudflare, or another Node-compatible platform. Branding, domain selection, authentication, persistence, and production infrastructure will be decided only after the local MVP works with real provider credentials.

## Responsible use

Use only data sources and enrichment providers you are authorized to access. Follow LinkedIn terms, provider terms, GDPR, CAN-SPAM, and other applicable privacy and outreach laws. Always review generated claims and drafts before use.
