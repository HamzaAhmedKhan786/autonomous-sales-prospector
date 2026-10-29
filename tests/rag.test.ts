import {afterEach,describe,expect,it,vi} from "vitest";
import {db,resetDatabaseForTests} from "../lib/db";
import {indexWorkspaceEvidence,retrieveWorkspaceEvidence} from "../lib/rag";

afterEach(()=>{vi.unstubAllEnvs();resetDatabaseForTests();});

describe("workspace RAG",()=>{
  it("retrieves validated evidence only inside the active workspace",()=>{
    vi.stubEnv("DATABASE_PATH",":memory:");
    const sql=db(),now=new Date().toISOString();
    for(const workspaceId of ["workspace-a","workspace-b"])sql.prepare("INSERT INTO workspaces(id,name,slug,created_at) VALUES(?,?,?,?)").run(workspaceId,workspaceId,workspaceId,now);
    sql.prepare("INSERT INTO prospects(id,workspace_id,linkedin_url,normalized_url,name,role,company,location,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)").run("prospect-a","workspace-a","https://www.linkedin.com/in/a","https://www.linkedin.com/in/a","A","VP","HelioGrid","",now,now);
    indexWorkspaceEvidence({workspaceId:"workspace-a",prospectId:"prospect-a",title:"Verified expansion",sourceUrl:"https://example.test/evidence",content:"HelioGrid announced a verified European expansion and operations hiring program."});
    expect(retrieveWorkspaceEvidence("workspace-a","European expansion")).toEqual([expect.objectContaining({title:"Verified expansion",sourceUrl:"https://example.test/evidence"})]);
    expect(retrieveWorkspaceEvidence("workspace-b","European expansion")).toEqual([]);
  });
});
