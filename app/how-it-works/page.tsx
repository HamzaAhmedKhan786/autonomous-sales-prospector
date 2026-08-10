import Image from "next/image";
import Link from "next/link";

export default function HowItWorks() {
  const crmUrl = process.env.NEXT_PUBLIC_CRM_APP_URL || "http://localhost:4100";
  return <main className="info-page">
    <Link className="product-logo" href="/"><Image src="/brand/asp-logo.png" alt="Autonomous Sales Prospector" width={842} height={410} priority /></Link>
    <section className="info-card">
      <span className="eyebrow">HSK-GROUP PRODUCT GUIDE</span><h1>From unknown prospect to governed CRM workflow</h1>
      <div className="flow-grid">
        <article><b>1 · Start in ASP</b><p>Use ASP when you have a LinkedIn profile and need external prospect or company evidence.</p></article>
        <article><b>2 · Research responsibly</b><p>The profile provider structures identity, Tavily finds current evidence, and Groq produces a grounded draft.</p></article>
        <article><b>3 · Review before transfer</b><p>Verify the evidence and edit the draft. Nothing is sent or synchronized without your action.</p></article>
        <article><b>4 · Sync to Orbit CRM</b><p>CRM deduplicates and stores the account, contact, lead, research activity, audit record, and outbox event.</p></article>
        <article><b>5 · Continue in CRM</b><p>Use Orbit for ownership, qualification, pipeline, activities, sequences, consent, approvals, and analytics.</p></article>
        <article><b>6 · Use the orchestrator</b><p>Describe the goal in CRM. The orchestrator selects the best specialist and routes sensitive writes to approval.</p></article>
      </div>
      <div className="guide-links"><Link href="/">Open ASP workspace</Link><a href={`${crmUrl}/#guide`}>Open Orbit CRM guide</a></div>
    </section>
  </main>;
}
