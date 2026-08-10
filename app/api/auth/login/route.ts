import { NextResponse } from "next/server";
import { z } from "zod";
import { audit, createSession } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import { verifyPassword } from "../../../../lib/security";
import { rateLimit } from "../../../../lib/resilience";

export async function POST(request: Request) {
  try {
    rateLimit(`login:${request.headers.get("x-forwarded-for") || "local"}`, 10, 15 * 60_000);
    const input = z.object({ email: z.string().email(), password: z.string() }).parse(await request.json());
    const row = db().prepare("SELECT u.id,u.password_hash,m.workspace_id FROM users u JOIN memberships m ON m.user_id=u.id WHERE u.email=? ORDER BY CASE m.role WHEN 'owner' THEN 0 ELSE 1 END LIMIT 1").get(input.email.toLowerCase()) as { id: string; password_hash: string; workspace_id: string } | undefined;
    if (!row || !(await verifyPassword(input.password, row.password_hash))) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    await createSession(row.id, row.workspace_id); audit(row.workspace_id, row.id, "user.logged_in", "user", row.id); return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Login failed." }, { status: 400 }); }
}
