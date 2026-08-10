import { DatabaseSync } from "node:sqlite";
import { resolve } from "node:path";
const database=new DatabaseSync(process.env.DATABASE_PATH||resolve(process.cwd(),"data","prospector.db"));
const workspaces=database.prepare("SELECT id,retention_days FROM workspaces").all();let deleted=0;
for(const workspace of workspaces){const cutoff=new Date(Date.now()-workspace.retention_days*86400_000).toISOString();deleted+=Number(database.prepare("DELETE FROM prospects WHERE workspace_id=? AND created_at<?").run(workspace.id,cutoff).changes);}
console.log(JSON.stringify({deleted,runAt:new Date().toISOString()}));database.close();
