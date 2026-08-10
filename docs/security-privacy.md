# Security and privacy runbook

This is an engineering runbook, not legal advice.

- Use only a licensed enrichment provider and document lawful basis, notices and opt-out handling.
- Never scrape behind authentication or bypass provider/website controls.
- Keep evidence URL, title and retrieval time; generated claims must be grounded in returned evidence.
- Require an explicit user confirmation before sending email or syncing externally.
- Enforce workspace boundaries on every database query and mutation.
- Keep API credentials server-side; redact tokens, prompt content and personal data from logs.
- Apply least privilege to CRM, HubSpot and email tokens. Rotate all credentials after exposure.
- Configure retention and periodically run `npm run retention`; validate deletion across evidence, drafts, history, integrations and backups.
- Honor access/export/rectification/deletion and suppression requests. A deleted/suppressed prospect must not be silently re-imported.
- Configure unsubscribe, bounce and complaint handling before production email is enabled.

For an incident: disable affected integration, rotate credentials, preserve audit evidence, determine tenants/subjects/time window, contact the security/privacy owners, meet notification obligations, remediate and record a post-incident review.

