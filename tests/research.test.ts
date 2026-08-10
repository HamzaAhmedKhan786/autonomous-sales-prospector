import { afterEach, describe, expect, it, vi } from "vitest";
import { researchProspect } from "../lib/research";
import { rateLimit } from "../lib/resilience";
import { resetDatabaseForTests } from "../lib/db";

afterEach(()=>{vi.unstubAllEnvs();resetDatabaseForTests();});

describe("research pipeline",()=>{
  it("uses mocked providers and returns grounded structured output",async()=>{
    vi.stubEnv("PROFILE_API_URL","https://profile.test");vi.stubEnv("PROFILE_API_KEY","profile-key");vi.stubEnv("TAVILY_API_KEY","tavily-key");
    const fetcher=vi.fn(async(url:string|URL|Request)=>{
      if(String(url).includes("profile.test"))return new Response(JSON.stringify({name:"Ada Lovelace",currentRole:"VP Engineering",currentCompany:"Analytical Cloud",location:"London",headline:"",about:"",experience:[]}));
      return new Response(JSON.stringify({results:[{title:"Analytical Cloud launches in Europe",url:"https://news.test/launch",content:"The company launched in Europe.",published_date:"2026-08-01"}]}));
    });
    const openai={responses:{create:vi.fn(async()=>({output_text:JSON.stringify({signalSummary:"European launch",relevance:"New market creates pipeline needs.",sourceUrl:"https://news.test/launch",subject:"European launch",email:"Hi Ada, relevant note."}),usage:{input_tokens:100,output_tokens:30}}))}};
    const result=await researchProspect("https://linkedin.com/in/ada",{senderName:"Sam",companyName:"Acme",offer:"Pipeline research",audience:"Revenue teams",proof:"Used by 20 teams"},{fetch:fetcher as typeof fetch,openai:openai as never});
    expect(result.prospect.name).toBe("Ada Lovelace");expect(result.signal.sourceUrl).toBe("https://news.test/launch");expect(result.usage).toMatchObject({inputTokens:100,sourceCount:1});expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("rejects a hallucinated source",async()=>{
    vi.stubEnv("PROFILE_API_URL","https://profile.test");vi.stubEnv("PROFILE_API_KEY","x");vi.stubEnv("TAVILY_API_KEY","x");
    const fetcher=vi.fn(async(url:string|URL|Request)=>String(url).includes("profile")?new Response(JSON.stringify({name:"A",currentRole:"R",currentCompany:"C"})):new Response(JSON.stringify({results:[{title:"T",url:"https://valid.test",content:"C"}]})));
    const openai={responses:{create:vi.fn(async()=>({output_text:JSON.stringify({signalSummary:"S",relevance:"R",sourceUrl:"https://invented.test",subject:"S",email:"E"}),usage:{}}))}};
    await expect(researchProspect("https://linkedin.com/in/a",{senderName:"S",companyName:"C",offer:"O",audience:"A",proof:"P"},{fetch:fetcher as typeof fetch,openai:openai as never})).rejects.toThrow("outside the research set");
  });
});

describe("rate limiting",()=>{it("blocks requests after the configured limit",()=>{vi.stubEnv("DATABASE_PATH",":memory:");rateLimit("test",2,60_000);rateLimit("test",2,60_000);expect(()=>rateLimit("test",2,60_000)).toThrow("Rate limit exceeded");});});
