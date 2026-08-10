"use client";
import { FormEvent, useMemo, useState } from "react";
import { WorkspaceTools } from "./workspace-tools";

type Result = { prospect: { name: string; role: string; company: string; location: string }; signal: { summary: string; relevance: string; sourceTitle: string; sourceUrl: string; publishedDate?: string }; draft: { subject: string; email: string } };
const stages = ["Profile", "Company", "Signals", "Draft"];

export function ProspectWorkspace() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [stage, setStage] = useState(-1);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const validUrl = useMemo(() => /^https:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/i.test(url.trim()), [url]);

  async function runResearch(event: FormEvent) {
    event.preventDefault();
    if (!validUrl || status === "running") return;
    setStatus("running"); setResult(null); setError(""); setStage(0);
    const timer = window.setInterval(() => setStage((value) => Math.min(value + 1, 3)), 900);
    try {
      const response = await fetch("/api/research", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ linkedinUrl: url.trim() }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Research failed.");
      setResult(body); setStage(3); setStatus("done");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Research failed."); setStatus("error"); }
    finally { window.clearInterval(timer); }
  }

  async function copyDraft() {
    if (!result) return;
    await navigator.clipboard.writeText(`Subject: ${result.draft.subject}\n\n${result.draft.email}`);
    setCopied(true); window.setTimeout(() => setCopied(false), 1800);
  }

  const initials = result?.prospect.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  const wordCount = result?.draft.email.trim().split(/\s+/).length ?? 0;
  return <main>
    <nav className="nav shell"><a className="brand" href="#top" aria-label="Autonomous Sales Prospector home"><span className="brand-mark">A</span> Autonomous Sales Prospector</a><span className="pilot-badge"><i /> Local MVP</span></nav>
    <WorkspaceTools />
    <section className="hero shell" id="top"><div className="eyebrow">AI prospect research, grounded in evidence</div><h1>Turn a profile into a reason<br />to start a conversation.</h1><p className="hero-copy">Research the person, find a current company signal, and create a review-ready outreach draft. Nothing is sent automatically.</p>
      <form className="search-card" onSubmit={runResearch}><label htmlFor="prospect-url">Prospect LinkedIn URL</label><div className="search-row"><div className="url-field"><span>in</span><input id="prospect-url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://linkedin.com/in/prospect" aria-describedby="url-help" /></div><button type="submit" disabled={!validUrl || status === "running"}>{status === "running" ? "Researching..." : "Research prospect"}<b>→</b></button></div><div className="form-meta" id="url-help"><span>{validUrl ? "Ready to research" : "Enter a valid LinkedIn profile URL"}</span><span>Human review required · Nothing is sent</span></div>{error && <p className="error-message" role="alert">{error}</p>}</form>
    </section>
    {(status === "running" || result) && <section className="workspace shell" aria-live="polite"><div className="progress-card"><div className="section-heading"><div><span className="kicker">Research run</span><h2>{status === "running" ? "Building the brief" : "Brief ready for review"}</h2></div><span className={`status ${status}`}>{status === "running" ? "Working" : "Complete"}</span></div><div className="stage-list">{stages.map((item, index) => <div className={`stage ${index < stage || status === "done" ? "complete" : index === stage ? "active" : ""}`} key={item}><span>{index < stage || status === "done" ? "✓" : index + 1}</span><div><b>{item}</b><small>{["Understand the person", "Map company context", "Find a timely reason", "Write without fluff"][index]}</small></div></div>)}</div></div>
      {result && <div className="results-grid"><article className="panel intelligence"><span className="kicker">Prospect intelligence</span><div className="person"><div className="avatar">{initials}</div><div><h2>{result.prospect.name}</h2><p>{result.prospect.role} · {result.prospect.company}</p><small>{result.prospect.location}</small></div></div><div className="signal-card"><div className="signal-label"><span>Fresh signal</span><small>{result.signal.publishedDate || "Recent"}</small></div><p>{result.signal.summary}</p><a href={result.signal.sourceUrl} target="_blank" rel="noreferrer">{result.signal.sourceTitle}</a></div><div className="why"><b>Why this is relevant</b><p>{result.signal.relevance}</p></div></article>
        <article className="panel draft"><div className="draft-head"><div><span className="kicker">Review-ready draft</span><h2>Personalized outreach</h2></div><button className="copy-button" onClick={copyDraft}>{copied ? "Copied" : "Copy draft"}</button></div><label htmlFor="draft-subject">Subject</label><input id="draft-subject" className="subject" value={result.draft.subject} readOnly /><label htmlFor="draft-email">Email</label><textarea id="draft-email" defaultValue={result.draft.email} /><div className="draft-footer"><span><i /> Evidence-backed</span><span>{wordCount} words</span></div></article></div>}
    </section>}
    <section className="principles shell"><div><span>01</span><h3>Evidence first</h3><p>Every hook traces back to a source, so relevance is easy to verify.</p></div><div><span>02</span><h3>No black-box sending</h3><p>You review, edit, and decide what leaves the workspace.</p></div><div><span>03</span><h3>Built for signal, not volume</h3><p>One thoughtful message beats a hundred generic sequences.</p></div></section><footer className="shell"><span>Autonomous Sales Prospector</span><p>Research responsibly. Respect privacy, platform terms, and local outreach laws.</p></footer>
  </main>;
}
