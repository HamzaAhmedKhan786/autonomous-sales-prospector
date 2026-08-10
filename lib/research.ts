import OpenAI from "openai";
import { z } from "zod";
import { retry } from "./resilience";

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
  usage: { inputTokens: number; outputTokens: number; sourceCount: number; model: string };
};
export class ConfigurationError extends Error {}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new ConfigurationError(`${name} is not configured.`);
  return value;
}

export type SenderContext = { senderName: string; companyName: string; offer: string; audience: string; proof: string };
export type ResearchDependencies = { fetch?: typeof globalThis.fetch; openai?: OpenAI };

async function fetchProfile(linkedinUrl: string, fetcher: typeof globalThis.fetch) {
  const response = await retry(() => fetcher(requireEnv("PROFILE_API_URL"), {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${requireEnv("PROFILE_API_KEY")}` },
    body: JSON.stringify({ linkedinUrl }), signal: AbortSignal.timeout(15_000),
  }), { attempts: 3, timeoutMs: 18_000 });
  if (!response.ok) throw new Error(`Profile provider returned ${response.status}.`);
  return profileSchema.parse(await response.json());
}

async function searchCompanyNews(company: string, fetcher: typeof globalThis.fetch) {
  const response = await retry(() => fetcher("https://api.tavily.com/search", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${requireEnv("TAVILY_API_KEY")}` },
    body: JSON.stringify({ query: `${company} company news announcement funding launch expansion`, topic: "news", time_range: "month", search_depth: "basic", max_results: 5, include_answer: false }),
    signal: AbortSignal.timeout(15_000),
  }), { attempts: 3, timeoutMs: 18_000 });
  if (!response.ok) throw new Error(`Tavily returned ${response.status}.`);
  const payload = z.object({ results: z.array(z.object({ title: z.string(), url: z.string().url(), content: z.string(), published_date: z.string().optional() })) }).parse(await response.json());
  return payload.results.map((item) => sourceSchema.parse({ ...item, publishedDate: item.published_date }));
}

const outputSchema = {
  type: "object", additionalProperties: false,
  properties: { signalSummary: { type: "string" }, relevance: { type: "string" }, sourceUrl: { type: "string" }, subject: { type: "string" }, email: { type: "string" } },
  required: ["signalSummary", "relevance", "sourceUrl", "subject", "email"],
} as const;

export async function researchProspect(linkedinUrl: string, context: SenderContext, dependencies: ResearchDependencies = {}): Promise<ResearchBrief> {
  const fetcher = dependencies.fetch || fetch;
  const profile = await fetchProfile(linkedinUrl, fetcher);
  const sources = await searchCompanyNews(profile.currentCompany, fetcher);
  if (!sources.length) throw new Error("No recent, credible company signal was found.");
  const client = dependencies.openai || new OpenAI({
        apiKey: requireEnv("GROQ_API_KEY"),
        baseURL: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1"
      });
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  const response = await retry(() => client.responses.create({
    model,
    instructions: "You are a careful B2B sales researcher. Use only supplied evidence. Select one timely signal. Connect it specifically to the sender's offer without inventing claims. Write a concise email under 130 words. Avoid flattery, hype, and generic openings. Use a low-pressure CTA. Return JSON matching the schema.",
    input: JSON.stringify({ profile, sources, sender: context }),
    text: { format: { type: "json_schema", name: "prospect_brief", strict: true, schema: outputSchema } },
  }), { attempts: 2, timeoutMs: 45_000 });
  const generated = z.object({ signalSummary: z.string(), relevance: z.string(), sourceUrl: z.string().url(), subject: z.string(), email: z.string() }).parse(JSON.parse(response.output_text));
  const selectedSource = sources.find((source) => source.url === generated.sourceUrl);
  if (!selectedSource) throw new Error("The generated draft referenced a source outside the research set.");
  return {
    prospect: { name: profile.name, role: profile.currentRole, company: profile.currentCompany, location: profile.location },
    signal: { summary: generated.signalSummary, relevance: generated.relevance, sourceTitle: selectedSource.title, sourceUrl: selectedSource.url, publishedDate: selectedSource.publishedDate },
    draft: { subject: generated.subject, email: generated.email },
    usage: { inputTokens: response.usage?.input_tokens || 0, outputTokens: response.usage?.output_tokens || 0, sourceCount: sources.length, model },
  };
}
