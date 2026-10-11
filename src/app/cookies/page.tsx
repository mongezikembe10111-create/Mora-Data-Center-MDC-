import Link from "next/link";

export const metadata = {
  title: "Cookie Policy | MORA",
  description: "Cookie and browser-storage practices for the MORA application.",
};

export default function CookiesPage() {
  return (
    <div className="page-shell">
      <header className="page-intro">
        <p className="eyebrow">Cookie policy · 11 October 2026</p>
        <h1>
          No marketing trackers.
          <br />A focused research experience.
        </h1>
        <p className="muted">
          A consent prompt is appropriate when optional tracking exists. The
          application delivered here does not include an advertising or
          analytics tracker.
        </p>
      </header>
      <article className="prose panel" style={{ maxWidth: 900 }}>
        <h2>What the application uses</h2>
        <p>
          Filters, research examples and contact drafts operate in browser
          memory. Shareable filter selections can be stored in the page URL.
          Downloaded CSV files and enquiry drafts are saved only when you choose
          a download action.
        </p>
        <p>
          The application itself does not set optional marketing or analytics
          cookies. It therefore does not show a cookie banner claiming to
          collect consent for tracking that has not been implemented.
        </p>
        <h2>Services outside this application</h2>
        <p>
          The production host may use infrastructure cookies for security or
          routing. External source sites and GitHub have their own cookie
          practices when you open them. Map resource providers can receive
          technical requests when their resources load. Deployment operators
          should document any hosting cookies and provider requirements that
          apply to their installation.
        </p>
        <h2>If optional tracking is introduced</h2>
        <p>
          Any future non-essential tracking must remain disabled until a user
          opts in. Rejecting optional cookies must keep the corresponding
          services disabled, and users must have an accessible way to withdraw
          consent. This policy must be updated to name the providers, purposes
          and retention periods.
        </p>
        <h2>Your browser controls</h2>
        <p>
          You can manage cookies and site storage through your browser’s privacy
          settings. Clipboard access and downloads can also be controlled by
          your browser. For broader information handling, read the{" "}
          <Link href="/privacy">privacy policy</Link>.
        </p>
      </article>
    </div>
  );
}
