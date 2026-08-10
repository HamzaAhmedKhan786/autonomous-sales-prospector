import { redirect } from "next/navigation";
import { getSession } from "../lib/auth";
import { ProspectWorkspace } from "./prospect-workspace";
export default async function Home(){if(!(await getSession()))redirect("/login");return <ProspectWorkspace/>;}
