import { NextResponse } from "next/server";
import { destroySession, requireSession } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
export async function DELETE(){try{const s=await requireSession();db().prepare("DELETE FROM users WHERE id=?").run(s.userId);await destroySession();return NextResponse.json({ok:true});}catch{return NextResponse.json({error:"Authentication required."},{status:401});}}
