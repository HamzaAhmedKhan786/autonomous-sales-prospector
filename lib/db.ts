import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

let database: DatabaseSync | undefined;

export function db() {
  if (database) return database;
  const path = process.env.DATABASE_PATH || resolve(process.cwd(), "data", "prospector.db");
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  database = new DatabaseSync(path);
  database.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  migrate(database);
  return database;
}

export function resetDatabaseForTests() { database?.close(); database = undefined; }

function migrate(sql: DatabaseSync) {
  sql.exec(`
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS workspaces (id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, retention_days INTEGER NOT NULL DEFAULT 90, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS memberships (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, role TEXT NOT NULL CHECK(role IN ('owner','admin','member')), PRIMARY KEY(user_id, workspace_id));
    CREATE TABLE IF NOT EXISTS workspace_invites (id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, email TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','member')), token_hash TEXT UNIQUE NOT NULL, invited_by TEXT REFERENCES users(id) ON DELETE SET NULL, expires_at TEXT NOT NULL, accepted_at TEXT, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, expires_at TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS workspace_settings (workspace_id TEXT PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE, sender_name TEXT NOT NULL DEFAULT '', sender_email TEXT NOT NULL DEFAULT '', company_name TEXT NOT NULL DEFAULT '', offer TEXT NOT NULL DEFAULT '', audience TEXT NOT NULL DEFAULT '', proof TEXT NOT NULL DEFAULT '', crm_provider TEXT, crm_token TEXT, email_provider TEXT, email_token TEXT, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS prospects (id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, linkedin_url TEXT NOT NULL, normalized_url TEXT NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL, company TEXT NOT NULL, location TEXT NOT NULL DEFAULT '', created_by TEXT REFERENCES users(id) ON DELETE SET NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(workspace_id, normalized_url));
    CREATE TABLE IF NOT EXISTS research_runs (id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, prospect_id TEXT NOT NULL REFERENCES prospects(id) ON DELETE CASCADE, status TEXT NOT NULL, source_count INTEGER NOT NULL DEFAULT 0, model TEXT, input_tokens INTEGER NOT NULL DEFAULT 0, output_tokens INTEGER NOT NULL DEFAULT 0, duration_ms INTEGER NOT NULL DEFAULT 0, error TEXT, created_by TEXT REFERENCES users(id) ON DELETE SET NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS evidence (id TEXT PRIMARY KEY, research_run_id TEXT NOT NULL REFERENCES research_runs(id) ON DELETE CASCADE, title TEXT NOT NULL, url TEXT NOT NULL, summary TEXT NOT NULL, relevance TEXT NOT NULL, published_at TEXT, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS drafts (id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, prospect_id TEXT NOT NULL REFERENCES prospects(id) ON DELETE CASCADE, research_run_id TEXT REFERENCES research_runs(id) ON DELETE SET NULL, subject TEXT NOT NULL, body TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', created_by TEXT REFERENCES users(id) ON DELETE SET NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sequences (id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', created_by TEXT REFERENCES users(id) ON DELETE SET NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sequence_steps (id TEXT PRIMARY KEY, sequence_id TEXT NOT NULL REFERENCES sequences(id) ON DELETE CASCADE, step_order INTEGER NOT NULL, delay_days INTEGER NOT NULL DEFAULT 0, subject TEXT NOT NULL, body TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS enrollments (id TEXT PRIMARY KEY, sequence_id TEXT NOT NULL REFERENCES sequences(id) ON DELETE CASCADE, prospect_id TEXT NOT NULL REFERENCES prospects(id) ON DELETE CASCADE, recipient_email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', next_send_at TEXT, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS email_events (id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, enrollment_id TEXT REFERENCES enrollments(id) ON DELETE SET NULL, provider_id TEXT, event TEXT NOT NULL, recipient TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, workspace_id TEXT, user_id TEXT, action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT, metadata TEXT NOT NULL DEFAULT '{}', ip_hash TEXT, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS usage_daily (workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, day TEXT NOT NULL, research_requests INTEGER NOT NULL DEFAULT 0, provider_calls INTEGER NOT NULL DEFAULT 0, emails_sent INTEGER NOT NULL DEFAULT 0, input_tokens INTEGER NOT NULL DEFAULT 0, output_tokens INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(workspace_id, day));
    CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, window_start INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS support_issues (id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, user_id TEXT REFERENCES users(id) ON DELETE SET NULL, category TEXT NOT NULL, subject TEXT NOT NULL, description TEXT NOT NULL, severity TEXT NOT NULL DEFAULT 'normal', status TEXT NOT NULL DEFAULT 'open', app_version TEXT NOT NULL, page_url TEXT, created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_prospects_workspace_created ON prospects(workspace_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_runs_prospect ON research_runs(prospect_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_workspace ON audit_logs(workspace_id, created_at DESC);
  `);
}
