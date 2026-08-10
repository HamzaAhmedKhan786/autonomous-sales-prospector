import { NextResponse } from "next/server";
import { z } from "zod";
import { audit, AuthError, requireSession } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { ConfigurationError, researchProspect } from "../../../lib/research";
import { id } from "../../../lib/security";
import { rateLimit, RateLimitError } from "../../../lib/resilience";

export const runtime = "nodejs";
const schema = z.object({ linkedinUrl: z.string().url().refine((url) => { const host=new URL(url).hostname; return host === "linkedin.com" || host.endsWith(".linkedin.com"); }, "A LinkedIn profile URL is required."), force: z.boolean().optional() });
const normalized = (value: string) => { const url=new URL(value); return `https://www.linkedin.com${url.pathname.replace(/\/$/, "").toLowerCase()}`; };

export async function POST(request: Request) {
  const started = Date.now(); let runId = "";
  try {
    const session = await requireSession(); rateLimit(`research:${session.workspaceId}`, Number(process.env.RESEARCH_RATE_LIMIT || 20), 3600_000);
    const input = schema.parse(await request.json()); const linkedin = normalized(input.linkedinUrl); const sql=db();
    const existing = sql.prepare("SELECT id,name,role,company,location FROM prospects WHERE workspace_id=? AND normalized_url=?").get(session.workspaceId,linkedin) as {id:string;name:string;role:string;company:string;location:string}|undefined;
    if (existing && !input.force) {
      const latest = sql.prepare("SELECT d.id draftId,d.subject,d.body,e.title sourceTitle,e.url sourceUrl,e.summary,e.relevance,e.published_at publishedDate FROM drafts d JOIN research_runs r ON r.id=d.research_run_id LEFT JOIN evidence e ON e.research_run_id=r.id WHERE d.prospect_id=? ORDER BY d.created_at DESC LIMIT 1").get(existing.id) as Record<string,string>|undefined;
      if (latest) return NextResponse.json({ duplicate:true, prospectId:existing.id, prospect:existing, signal:{summary:latest.summary,relevance:latest.relevance,sourceTitle:latest.sourceTitle,sourceUrl:latest.sourceUrl,publishedDate:latest.publishedDate},draft:{subject:latest.subject,email:latest.body} });
    }
    const settings = sql.prepare("SELECT sender_name senderName,company_name companyName,offer,audience,proof FROM workspace_settings WHERE workspace_id=?").get(session.workspaceId) as {senderName:string;companyName:string;offer:string;audience:string;proof:string};
    if (!settings.offer || !settings.companyName) return NextResponse.json({error:"Complete your company and offer settings before researching."},{status:409});
    const prospectId=existing?.id || id(); const pendingAt=new Date().toISOString();
    if(!existing) sql.prepare("INSERT INTO prospects(id,workspace_id,linkedin_url,normalized_url,name,role,company,location,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(prospectId,session.workspaceId,input.linkedinUrl,linkedin,"Researching...","","","",session.userId,pendingAt,pendingAt);
    runId=id(); sql.prepare("INSERT INTO research_runs(id,workspace_id,prospect_id,status,created_by,created_at) VALUES(?,?,?,?,?,?)").run(runId,session.workspaceId,prospectId,"running",session.userId,pendingAt);
    const brief=await researchProspect(input.linkedinUrl,settings); const now=new Date().toISOString();
    sql.exec("BEGIN"); try {
      sql.prepare("UPDATE prospects SET name=?,role=?,company=?,location=?,updated_at=? WHERE id=?").run(brief.prospect.name,brief.prospect.role,brief.prospect.company,brief.prospect.location,now,prospectId);
      sql.prepare("UPDATE research_runs SET prospect_id=?,status='complete',source_count=?,model=?,input_tokens=?,output_tokens=?,duration_ms=? WHERE id=?").run(prospectId,brief.usage.sourceCount,brief.usage.model,brief.usage.inputTokens,brief.usage.outputTokens,Date.now()-started,runId);
      const evidenceId=id(); sql.prepare("INSERT INTO evidence VALUES(?,?,?,?,?,?,?,?)").run(evidenceId,runId,brief.signal.sourceTitle,brief.signal.sourceUrl,brief.signal.summary,brief.signal.relevance,brief.signal.publishedDate||null,now);
      const draftId=id(); sql.prepare("INSERT INTO drafts(id,workspace_id,prospect_id,research_run_id,subject,body,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)").run(draftId,session.workspaceId,prospectId,runId,brief.draft.subject,brief.draft.email,session.userId,now,now);
      sql.prepare("INSERT INTO usage_daily(workspace_id,day,research_requests,provider_calls,input_tokens,output_tokens) VALUES(?,?,1,2,?,?) ON CONFLICT(workspace_id,day) DO UPDATE SET research_requests=research_requests+1,provider_calls=provider_calls+2,input_tokens=input_tokens+excluded.input_tokens,output_tokens=output_tokens+excluded.output_tokens").run(session.workspaceId,now.slice(0,10),brief.usage.inputTokens,brief.usage.outputTokens); sql.exec("COMMIT");
      audit(session.workspaceId,session.userId,"research.completed","prospect",prospectId,{runId}); return NextResponse.json({...brief,prospectId,draftId,duplicate:Boolean(existing)});
    } catch(error){sql.exec("ROLLBACK");throw error;}
  } catch(error) {
    if(runId) db().prepare("UPDATE research_runs SET status='failed',error=?,duration_ms=? WHERE id=?").run(error instanceof Error?error.message:"Research failed",Date.now()-started,runId);
    if(error instanceof AuthError) return NextResponse.json({error:error.message},{status:401});
    if(error instanceof RateLimitError) return NextResponse.json({error:error.message},{status:429});
    if(error instanceof z.ZodError) return NextResponse.json({error:error.issues[0]?.message||"Invalid request."},{status:400});
    if(error instanceof ConfigurationError) return NextResponse.json({error:error.message,code:"NOT_CONFIGURED"},{status:503});
    console.error("Research request failed",error); return NextResponse.json({error:error instanceof Error?error.message:"Research failed."},{status:502});
  }
}
