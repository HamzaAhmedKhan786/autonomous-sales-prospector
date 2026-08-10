import { NextResponse } from "next/server";
import { z } from "zod";
import { audit, createSession } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import { hashPassword } from "../../../../lib/security";
import { id } from "../../../../lib/security";
import { rateLimit } from "../../../../lib/resilience";

const schema = z.object({ name: z.string().min(2).max(80), email: z.string().email(), password: z.string().min(10).max(200), workspaceName: z.string().min(2).max(80) });
export async function POST(request: Request) {
  try {
    rateLimit(`register:${request.headers.get("x-forwarded-for") || "local"}`, 5, 3600_000);
    const input = schema.parse(await request.json()); const userId = id(); const workspaceId = id(); const now = new Date().toISOString();
    const slug = `${input.workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${workspaceId.slice(0, 6)}`;
    const sql = db(); sql.exec("BEGIN");
    try {
      sql.prepare("INSERT INTO users VALUES(?,?,?,?,?)").run(userId, input.email.toLowerCase(), input.name, await hashPassword(input.password), now);
      sql.prepare("INSERT INTO workspaces(id,name,slug,created_at) VALUES(?,?,?,?)").run(workspaceId, input.workspaceName, slug, now);
      sql.prepare("INSERT INTO memberships VALUES(?,?,?)").run(userId, workspaceId, "owner");
      sql.prepare("INSERT INTO workspace_settings(workspace_id,updated_at) VALUES(?,?)").run(workspaceId, now); sql.exec("COMMIT");
    } catch (error) { sql.exec("ROLLBACK"); throw error; }
    audit(workspaceId, userId, "user.registered", "user", userId); await createSession(userId, workspaceId);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error && error.message.includes("UNIQUE") ? "An account with this email already exists." : error instanceof Error ? error.message : "Registration failed." }, { status: 400 }); }
}
