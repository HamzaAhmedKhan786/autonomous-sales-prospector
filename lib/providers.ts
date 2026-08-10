import { retry } from "./resilience";

export async function syncHubSpotContact(token: string, prospect: { name:string; role:string; company:string; linkedinUrl:string; email?:string }) {
  const [firstname,...rest]=prospect.name.split(" ");
  const response=await retry(()=>fetch("https://api.hubapi.com/crm/v3/objects/contacts",{method:"POST",headers:{authorization:`Bearer ${token}`,"content-type":"application/json"},body:JSON.stringify({properties:{firstname,lastname:rest.join(" "),jobtitle:prospect.role,company:prospect.company,hs_linkedin_url:prospect.linkedinUrl,...(prospect.email?{email:prospect.email}:{})}}),signal:AbortSignal.timeout(15_000)}),{attempts:3,timeoutMs:20_000});
  if(!response.ok) throw new Error(`HubSpot returned ${response.status}.`); return response.json() as Promise<{id:string}>;
}

export async function sendEmail(input:{apiKey:string;from:string;to:string;subject:string;html:string}) {
  const endpoint=process.env.EMAIL_API_URL||"https://api.resend.com/emails";
  const response=await retry(()=>fetch(endpoint,{method:"POST",headers:{authorization:`Bearer ${input.apiKey}`,"content-type":"application/json"},body:JSON.stringify({from:input.from,to:[input.to],subject:input.subject,html:input.html}),signal:AbortSignal.timeout(15_000)}),{attempts:3,timeoutMs:20_000});
  if(!response.ok) throw new Error(`Email provider returned ${response.status}.`); return response.json() as Promise<{id:string}>;
}
