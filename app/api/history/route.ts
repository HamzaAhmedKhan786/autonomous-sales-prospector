import { NextResponse } from "next/server";
import { requireSession } from "../../../lib/auth";
import { db } from "../../../lib/db";
export async function GET() { try { const s=await requireSession(); const rows=db().prepare("SELECT p.id,p.linkedin_url linkedinUrl,p.name,p.role,p.company,p.created_at createdAt,COUNT(r.id) researchCount,MAX(r.created_at) lastResearchedAt FROM prospects p LEFT JOIN research_runs r ON r.prospect_id=p.id WHERE p.workspace_id=? GROUP BY p.id ORDER BY p.created_at DESC LIMIT 200").all(s.workspaceId); return NextResponse.json({prospects:rows}); } catch { return NextResponse.json({error:"Authentication required."},{status:401}); } }
