import {NextResponse} from "next/server";
import {metricsRegistry} from "../../../lib/metrics";
export async function GET(request:Request){const token=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"")||"";if(process.env.METRICS_TOKEN&&token!==process.env.METRICS_TOKEN)return new NextResponse("unauthorized",{status:401});return new NextResponse(await metricsRegistry.metrics(),{headers:{"content-type":metricsRegistry.contentType}})}
