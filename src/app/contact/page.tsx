"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Download, FileText } from "lucide-react";

type Enquiry = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export default function ContactPage() {
  const [form, setForm] = useState<Enquiry>({
    name: "",
    email: "",
    subject: "Data or methodology",
    message: "",
  });
  const [status, setStatus] = useState("");

  function update(field: keyof Enquiry, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setStatus("");
  }

  function draft() {
    return `MORA Data Centre enquiry\n\nName: ${form.name || "Not provided"}\nReply email: ${form.email || "Not provided"}\nSubject: ${form.subject}\n\n${form.message.trim()}\n\nPrepared locally. This draft has not been sent.\n`;
  }

  function download(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const blob = new Blob([draft()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mora-enquiry.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus(
      "Your enquiry draft has been downloaded. It has not been sent to MORA.",
    );
  }

  const issueUrl = `https://github.com/mongezikembe10111-create/Mora-Data-Center-MDC-/issues/new?title=${encodeURIComponent(`MORA: ${form.subject}`)}&body=${encodeURIComponent(`## Enquiry\n${form.message || "Please describe your question or reproducible issue."}\n\n## Page / dataset\nPlease include the relevant page URL or dataset reference.\n\nPlease do not include personal or sensitive information in this public issue.`)}`;

  return (
    <div className="page-shell">
      <header className="page-intro">
        <p className="eyebrow">Contact & corrections</p>
        <h1>
          Good research welcomes
          <br />
          better questions.
        </h1>
        <p className="muted">
          Ask about the data, flag a source issue or prepare a research enquiry.
        </p>
      </header>
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
          gap: 24,
        }}
      >
        <section className="panel" aria-labelledby="enquiry-title">
          <div className="panel-header">
            <p className="eyebrow">Prepare an enquiry</p>
            <FileText size={19} aria-hidden="true" />
          </div>
          <h2 id="enquiry-title" className="section-title">
            Write it here. Keep a copy.
          </h2>
          <p className="muted">
            An operator email or submission endpoint has not been supplied for
            this build. This form creates a local text draft; it does not send
            your details.
          </p>
          <form
            onSubmit={download}
            className="form-grid"
            style={{ display: "grid", gap: 18, marginTop: 26 }}
          >
            <label htmlFor="contact-name">
              Name <span className="muted">(optional)</span>
              <input
                id="contact-name"
                name="name"
                autoComplete="name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                maxLength={150}
              />
            </label>
            <label htmlFor="contact-email">
              Reply email <span className="muted">(optional)</span>
              <input
                id="contact-email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                maxLength={254}
              />
            </label>
            <label className="full-width" htmlFor="contact-subject">
              Subject
              <select
                id="contact-subject"
                name="subject"
                value={form.subject}
                onChange={(e) => update("subject", e.target.value)}
              >
                <option>Data or methodology</option>
                <option>Data correction</option>
                <option>Research enquiry</option>
                <option>Accessibility issue</option>
                <option>Technical issue</option>
              </select>
            </label>
            <label className="full-width" htmlFor="contact-message">
              Your enquiry
              <textarea
                id="contact-message"
                name="message"
                rows={6}
                required
                minLength={10}
                maxLength={10000}
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                placeholder="Include the relevant page, source or observation date."
              />
            </label>
            <button className="button full-width" type="submit">
              <Download size={16} aria-hidden="true" />
              Download enquiry draft
            </button>
            <p
              className="muted full-width"
              role="status"
              style={{ fontSize: 13, minHeight: 22 }}
            >
              {status}
            </p>
          </form>
        </section>
        <aside style={{ display: "grid", gap: 24, alignContent: "start" }}>
          <section className="panel">
            <p className="eyebrow">Technical issues & source corrections</p>
            <h2 className="section-title">Open a repository issue</h2>
            <p className="muted">
              The project’s GitHub issue composer is available for reproducible
              bugs, accessibility reports and source corrections. GitHub login
              and repository access may be required.
            </p>
            <p className="muted">
              Avoid names, email addresses and sensitive information in public
              issues. Your name and reply email from this form are not included
              in the issue link.
            </p>
            <a
              className="button"
              href={issueUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open GitHub issue <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </section>
          <section className="panel">
            <p className="eyebrow">A useful correction includes</p>
            <ul style={{ paddingLeft: 19, lineHeight: 1.9 }}>
              <li>The page and metric concerned</li>
              <li>The official source URL</li>
              <li>The reference date and geography</li>
              <li>The expected definition or calculation</li>
            </ul>
            <Link href="/methodology" className="muted">
              Read our methodology →
            </Link>
          </section>
          <p className="muted" style={{ fontSize: 13 }}>
            Read the <Link href="/privacy">privacy policy</Link> before sharing
            personal information with an external service.
          </p>
        </aside>
      </div>
    </div>
  );
}
