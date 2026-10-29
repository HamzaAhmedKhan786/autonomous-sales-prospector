import {afterEach,describe,expect,it,vi} from "vitest";
import {llmConfiguration} from "../lib/llm";

afterEach(()=>vi.unstubAllEnvs());

describe("LLM configuration",()=>{
  it("accepts loopback local inference",()=>{vi.stubEnv("LLM_PROVIDER","local");vi.stubEnv("LLM_BASE_URL","http://127.0.0.1:11434/v1");expect(llmConfiguration()).toMatchObject({provider:"local",model:"llama3.2"});});
  it("rejects remote endpoints in local mode",()=>{vi.stubEnv("LLM_PROVIDER","local");vi.stubEnv("LLM_BASE_URL","https://unapproved.example/v1");expect(()=>llmConfiguration()).toThrow("loopback")});
});
