import { cookies } from "next/headers";
import { db } from "./db";
import { id, sha256, token } from "./security";

export const SESSION_COOKIE = "asp_session";
export type Session = { userId: string; workspaceId: string; email: string; name: string; role: "owner" | "admin" | "member" };

export async function createSession(userId: string, workspaceId: string) {
  const raw = token(); const now = new Date(); const expires = new Date(now.getTime() + 30 * 86400_000);
  db().prepare("INSERT INTO sessions(token_hash,user_id,workspace_id,expires_at,created_at) VALUES(?,?,?,?,?)").run(sha256(raw), userId, workspaceId, expires.toISOString(), now.toISOString());
  (await cookies()).set(SESSION_COOKIE, raw, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires });
}

export async function getSession(): Promise<Session | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value; if (!raw) return null;
  const row = db().prepare(`SELECT u.id userId,u.email,u.name,m.workspace_id workspaceId,m.role FROM sessions s JOIN users u ON u.id=s.user_id JOIN memberships m ON m.user_id=u.id AND m.workspace_id=s.workspace_id WHERE s.token_hash=? AND s.expires_at>?`).get(sha256(raw), new Date().toISOString()) as Session | undefined;
  return row || null;
}

export async function requireSession() { const session = await getSession(); if (!session) throw new AuthError(); return session; }
export class AuthError extends Error { constructor() { super("Authentication required."); } }
export async function destroySession() { const jar = await cookies(); const raw = jar.get(SESSION_COOKIE)?.value; if (raw) db().prepare("DELETE FROM sessions WHERE token_hash=?").run(sha256(raw)); jar.delete(SESSION_COOKIE); }

export function audit(workspaceId: string | null, userId: string | null, action: string, entityType: string, entityId?: string, metadata: Record<string, unknown> = {}) {
  db().prepare("INSERT INTO audit_logs(id,workspace_id,user_id,action,entity_type,entity_id,metadata,created_at) VALUES(?,?,?,?,?,?,?,?)").run(id(), workspaceId, userId, action, entityType, entityId || null, JSON.stringify(metadata), new Date().toISOString());
}
