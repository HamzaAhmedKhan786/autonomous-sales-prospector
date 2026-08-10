import { NextResponse } from "next/server";
import { z } from "zod";
import { ConfigurationError, researchProspect } from "../../../lib/research";

export const runtime = "nodejs";
const requestSchema = z.object({ linkedinUrl: z.string().url().refine((url) => new URL(url).hostname === "linkedin.com" || new URL(url).hostname.endsWith(".linkedin.com"), "A LinkedIn profile URL is required.") });

export async function POST(request: Request) {
  try {
    const { linkedinUrl } = requestSchema.parse(await request.json());
    return NextResponse.json(await researchProspect(linkedinUrl));
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message || "Invalid request." }, { status: 400 });
    if (error instanceof ConfigurationError) return NextResponse.json({ error: error.message, code: "NOT_CONFIGURED" }, { status: 503 });
    console.error("Research request failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Research failed." }, { status: 502 });
  }
}
