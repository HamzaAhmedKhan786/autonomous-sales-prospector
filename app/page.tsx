import { redirect } from "next/navigation";
import { getSession } from "../lib/auth";
import { db } from "../lib/db";
import { ProspectWorkspace } from "./prospect-workspace";
import type { SnapshotProspect } from "./workspace-snapshot";
export const dynamic="force-dynamic";
export default async function Home(){const session=await getSession();if(!session)redirect("/login");const rows=db().prepare("SELECT p.id,p.name,p.role,p.company,COUNT(DISTINCT r.id) researchCount,MAX(cs.synced_at) crmSyncedAt FROM prospects p LEFT JOIN research_runs r ON r.prospect_id=p.id LEFT JOIN crm_syncs cs ON cs.prospect_id=p.id AND cs.workspace_id=p.workspace_id WHERE p.workspace_id=? GROUP BY p.id ORDER BY p.created_at DESC LIMIT 20").all(session.workspaceId) as SnapshotProspect[];const prospects=rows.map(row=>({id:row.id,name:row.name,role:row.role,company:row.company,researchCount:Number(row.researchCount),crmSyncedAt:row.crmSyncedAt||undefined}));return <ProspectWorkspace initialProspects={prospects}/>;}
