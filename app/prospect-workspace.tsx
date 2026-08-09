"use client";

import { FormEvent, useMemo, useState } from "react";

type ResearchResult = {
  name: string;
  role: string;
  company: string;
  location: string;
  signal: string;
  source: string;
  subject: string;
  email: string;
};

const demoResult: ResearchResult = {
  name: "Maya Chen",
  role: "VP of Revenue Operations",
  company: "Northstar Cloud",
  location: "San Francisco, CA",
  signal: "Northstar Cloud announced its European expansion and a new enterprise analytics product 12 days ago.",
  source: "Company newsroom · Recent announcement",
  subject: "Northstar's European expansion",
  email: `Hi Maya,

I saw Northstar Cloud is expanding into Europe while rolling out its enterprise analytics product. That usually puts RevOps in the middle of a tricky problem: scaling pipeline coverage without losing the context that makes outreach relevant.

We help revenue teams turn fresh account signals into researched, review-ready outreach—so reps spend less time tab-hopping and more time in real conversations.

Would it be useful to compare notes on how your team is approaching prospect research during the expansion?

Best,
Alex`,
};

const stages = ["Profile", "Company", "Signals", "Draft"];

export function ProspectWorkspace() {
  const [url, setUrl] = useState("https://www.linkedin.com/in/maya-chen");
  const [status, setStatus] = useState<"idle" | "running" | "done">("idle");
  const [stage, setStage] = useState(-1);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [copied, setCopied] = useState(false);
  const validUrl = useMemo(() => /^https:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/i.test(url.trim()), [url]);

  function runResearch(event: FormEvent) {
    event.preventDefault();
    if (!validUrl || status === "running") return;
    setStatus("running");
    setResult(null);
    setCopied(false);
    setStage(0);
    [1, 2, 3].forEach((next, index) => window.setTimeout(() => setStage(next), 650 * (index + 1)));
    window.setTimeout(() => {
      setResult(demoResult);
      setStatus("done");
    }, 2700);
  }

  async function copyDraft() {
    if (!result) return;
    await navigator.clipboard.writeText(`Subject: ${result.subject}\n\n${result.email}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main>
      <nav className="nav shell">
        <a className="brand" href="#top" aria-label="Signalist home"><span className="brand-mark">S</span> Signalist</a>
        <span className="pilot-badge"><i /> Private pilot</span>
      </nav>

      <section className="hero shell" id="top">
        <div className="eyebrow">AI prospect research, grounded in evidence</div>
        <h1>Turn a profile into a reason<br />to start a conversation.</h1>
        <p className="hero-copy">Signalist finds the person, the company moment, and the credible bridge between them—then drafts outreach for you to review.</p>

        <form className="search-card" onSubmit={runResearch}>
          <label htmlFor="prospect-url">Prospect LinkedIn URL</label>
          <div className="search-row">
            <div className="url-field"><span>in</span><input id="prospect-url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="linkedin.com/in/prospect" aria-describedby="url-help" /></div>
            <button type="submit" disabled={!validUrl || status === "running"}>{status === "running" ? "Researching…" : "Research prospect"}<b>→</b></button>
          </div>
          <div className="form-meta" id="url-help"><span>{validUrl ? "Ready to research" : "Enter a valid LinkedIn profile URL"}</span><span>Human review required · Nothing is sent</span></div>
        </form>
      </section>

      {(status !== "idle" || result) && (
        <section className="workspace shell" aria-live="polite">
          <div className="progress-card">
            <div className="section-heading"><div><span className="kicker">Research run</span><h2>{status === "running" ? "Building the brief" : "Brief ready for review"}</h2></div><span className={`status ${status}`}>{status === "running" ? "Working" : "Complete"}</span></div>
            <div className="stage-list">
              {stages.map((item, index) => <div className={`stage ${index < stage || status === "done" ? "complete" : index === stage ? "active" : ""}`} key={item}><span>{index < stage || status === "done" ? "✓" : index + 1}</span><div><b>{item}</b><small>{["Understand the person", "Map company context", "Find a timely reason", "Write without fluff"][index]}</small></div></div>)}
            </div>
          </div>

          {result && <div className="results-grid">
            <article className="panel intelligence">
              <span className="kicker">Prospect intelligence</span>
              <div className="person"><div className="avatar">MC</div><div><h2>{result.name}</h2><p>{result.role} · {result.company}</p><small>{result.location}</small></div></div>
              <div className="signal-card"><div className="signal-label"><span>Fresh signal</span><small>12 days ago</small></div><p>{result.signal}</p><small>{result.source}</small></div>
              <div className="why"><b>Why this is relevant</b><p>Expansion creates a concrete RevOps challenge: adding pipeline coverage while keeping outbound specific and credible.</p></div>
            </article>

            <article className="panel draft">
              <div className="draft-head"><div><span className="kicker">Review-ready draft</span><h2>Personalized outreach</h2></div><button className="copy-button" onClick={copyDraft}>{copied ? "Copied" : "Copy draft"}</button></div>
              <label>Subject</label><div className="subject">{result.subject}</div>
              <label>Email</label><textarea aria-label="Editable outreach email" defaultValue={result.email} />
              <div className="draft-footer"><span><i /> Evidence-backed</span><span>112 words</span></div>
            </article>
          </div>}
        </section>
      )}

      <section className="principles shell">
        <div><span>01</span><h3>Evidence first</h3><p>Every hook traces back to a source, so relevance is easy to verify.</p></div>
        <div><span>02</span><h3>No black-box sending</h3><p>You review, edit, and decide what leaves the workspace.</p></div>
        <div><span>03</span><h3>Built for signal, not volume</h3><p>One thoughtful message beats a hundred generic sequences.</p></div>
      </section>
      <footer className="shell"><span>Signalist</span><p>Research responsibly. Respect privacy, platform terms, and local outreach laws.</p></footer>
    </main>
  );
}
