import {NextResponse} from "next/server";
import {z} from "zod";
import {requireSession} from "../../../lib/auth";
import {runSierra} from "../../../lib/sierra";
import {SierraGuardrailError} from "../../../lib/assistant-guardrails";
import {assistantLatency,assistantRequests} from "../../../lib/metrics";
import {recordLangfuseTrace} from "../../../lib/langfuse";
export async function POST(request:Request){const started=Date.now(),traceId=crypto.randomUUID();try{const session=await requireSession();const body=z.object({objective:z.string().min(3).max(2000),threadId:z.string().max(200).optional()}).parse(await request.json());const result=await runSierra({workspaceId:session.workspaceId,userId:session.userId,objective:body.objective,threadId:body.threadId});assistantRequests.inc({status:"completed"});assistantLatency.observe({status:"completed"},(Date.now()-started)/1000);void recordLangfuseTrace({id:traceId,name:"sierra-assistant",status:"completed",durationMs:Date.now()-started});return NextResponse.json(result)}catch(error){assistantRequests.inc({status:"rejected"});assistantLatency.observe({status:"rejected"},(Date.now()-started)/1000);void recordLangfuseTrace({id:traceId,name:"sierra-assistant",status:"rejected",durationMs:Date.now()-started,errorType:error instanceof Error?error.name:"unknown"});if(error instanceof SierraGuardrailError)return NextResponse.json({error:error.code,message:error.message},{status:error.statusCode});return NextResponse.json({error:error instanceof Error?error.message:"SIERRA could not complete the request."},{status:400})}}
