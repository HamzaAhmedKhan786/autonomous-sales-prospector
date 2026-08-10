import { NextResponse } from "next/server";
import { audit, requireSession } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}) { try { const s=await requireSession(); const {id}=await params; const result=db().prepare("DELETE FROM prospects WHERE id=? AND workspace_id=?").run(id,s.workspaceId); if(!result.changes)return NextResponse.json({error:"Prospect not found."},{status:404}); audit(s.workspaceId,s.userId,"prospect.deleted","prospect",id,{reason:"gdpr_request"}); return NextResponse.json({ok:true}); } catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Delete failed."},{status:401});} }
