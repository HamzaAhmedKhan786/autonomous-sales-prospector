import OpenAI from "openai";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(1), headline: z.string().default(""), currentRole: z.string().min(1),
  currentCompany: z.string().min(1), location: z.string().default(""), about: z.string().default(""),
  experience: z.array(z.object({ title: z.string(), company: z.string(), description: z.string().optional() })).default([]),
});
const sourceSchema = z.object({ title: z.string(), url: z.string().url(), content: z.string(), publishedDate: z.string().optional() });

export type ResearchBrief = {
  prospect: { name: string; role: string; company: string; location: string };
  signal: { summary: string; relevance: string; sourceTitle: string; sourceUrl: string; publishedDate?: string };
  draft: { subject: string; email: string };
};
export class ConfigurationError extends Error {}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new ConfigurationError(`${name} is not configured.`);
  return value;
}

async function fetchProfile(linkedinUrl: string) {
  const response = await fetch(requireEnv("PROFILE_API_URL"), {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${requireEnv("PROFILE_API_KEY")}` },
    body: JSON.stringify({ linkedinUrl }), signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Profile provider returned ${response.status}.`);
  return profileSchema.parse(await response.json());
}

async function searchCompanyNews(company: string) {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${requireEnv("TAVILY_API_KEY")}` },
    body: JSON.stringify({ query: `${company} company news announcement funding launch expansion`, topic: "news", time_range: "month", search_depth: "basic", max_results: 5, include_answer: false }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Tavily returned ${response.status}.`);
  const payload = z.object({ results: z.array(z.object({ title: z.string(), url: z.string().url(), content: z.string(), published_date: z.string().optional() })) }).parse(await response.json());
  return payload.results.map((item) => sourceSchema.parse({ ...item, publishedDate: item.published_date }));
}

const outputSchema = {
  type: "object", additionalProperties: false,
  properties: { signalSummary: { type: "string" }, relevance: { type: "string" }, sourceUrl: { type: "string" }, subject: { type: "string" }, email: { type: "string" } },
  required: ["signalSummary", "relevance", "sourceUrl", "subject", "email"],
} as const;

export async function researchProspect(linkedinUrl: string): Promise<ResearchBrief> {
  const profile = await fetchProfile(linkedinUrl);
  const sources = await searchCompanyNews(profile.currentCompany);
  if (!sources.length) throw new Error("No recent, credible company signal was found.");
  const client = new OpenAI({ apiKey: requireEnv("OPENAI_API_KEY") });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
    instructions: "You are a careful B2B sales researcher. Use only supplied evidence. Select one timely signal. Write a concise email under 130 words. Avoid flattery, invented facts, hype, and generic openings. Use a low-pressure CTA. Return JSON matching the schema.",
    input: JSON.stringify({ profile, sources }),
    text: { format: { type: "json_schema", name: "prospect_brief", strict: true, schema: outputSchema } },
  });
  const generated = z.object({ signalSummary: z.string(), relevance: z.string(), sourceUrl: z.string().url(), subject: z.string(), email: z.string() }).parse(JSON.parse(response.output_text));
  const selectedSource = sources.find((source) => source.url === generated.sourceUrl);
  if (!selectedSource) throw new Error("The generated draft referenced a source outside the research set.");
  return {
    prospect: { name: profile.name, role: profile.currentRole, company: profile.currentCompany, location: profile.location },
    signal: { summary: generated.signalSummary, relevance: generated.relevance, sourceTitle: selectedSource.title, sourceUrl: selectedSource.url, publishedDate: selectedSource.publishedDate },
    draft: { subject: generated.subject, email: generated.email },
  };
}
