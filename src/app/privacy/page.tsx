import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | The Public Square",
  description:
    "How The Public Square handles information, local drafts and external civic resources.",
};

export default function PrivacyPage() {
  return (
    <div className="page-shell">
      <header className="page-intro">
        <p className="eyebrow">Privacy policy · 12 October 2026</p>
        <h1>
          Your questions.
          <br />
          Your information.
        </h1>
        <p className="muted">
          This statement describes the application delivered in this repository.
          Hosting providers and future deployments may have additional
          obligations.
        </p>
      </header>
      <article className="prose panel" style={{ maxWidth: 900 }}>
        <h2 id="collection">Information in this application</h2>
        <p>
          The Public Square has no account registration, advertising tracker or
          application analytics service. Electoral datasets displayed here are
          aggregate public research information. A search or filter selection is
          processed by the interface; shareable links can include the selected
          filters in their URL.
        </p>
        <h2 id="enquiries">Enquiry drafts</h2>
        <p>
          The contact form keeps your entries in the active browser page and
          produces a text file when you choose to download it. There is no
          form-submission endpoint in this build, and downloading the draft does
          not send it to The Public Square. Closing or reloading the page clears
          the form’s in-memory entries.
        </p>
        <p>
          If you choose the GitHub issue link, the enquiry message is included
          in an external GitHub issue composer. The form’s name and email fields
          are excluded. Submitting an issue is a separate action on GitHub and
          is subject to GitHub’s privacy practices and repository visibility.
          Avoid personal or sensitive information in public issues.
        </p>
        <h2 id="hosting">Hosting and technical information</h2>
        <p>
          A deployment’s hosting provider can process connection metadata such
          as IP addresses, request times and user-agent information to deliver
          the site, operate logs and protect the service. This repository does
          not determine that provider’s retention period or access policy. An
          operator must publish the relevant hosting and contact details before
          a public production launch.
        </p>
        <h2 id="external-services">External resources</h2>
        <p>
          Registering to vote, subscribing to PMG alerts and submitting comments
          happen on the relevant external service. The Public Square does not
          create those accounts, subscribe you, or send a public participation
          submission. A locally prepared submission draft remains on your device
          until you choose how to share it.
        </p>
        <p>
          Official source links open external sites with their own policies. Map
          assets, where enabled, may be requested from the providers identified
          in the map attribution. Your browser makes those requests to display
          the resource. Do not treat this statement as the privacy policy of
          those providers.
        </p>
        <h2 id="cookies">Cookies and storage</h2>
        <p>
          This application does not install marketing cookies. See the{" "}
          <Link href="/cookies">cookie policy</Link> for the scope of the
          current implementation. Browser security, clipboard permission and
          download settings are controlled by your browser.
        </p>
        <h2 id="requests">Questions and privacy requests</h2>
        <p>
          No operator privacy email has been supplied for this build. You can
          prepare an enquiry at{" "}
          <Link href="/contact">Contact & corrections</Link>. Do not post
          private requests or identifying documents in a public repository
          issue. An operator must provide a private contact channel and
          deployment-specific details before collecting personal information
          through a production service.
        </p>
        <p className="muted">
          This policy should be reviewed whenever the application adds accounts,
          analytics, a submission service, or changes hosting and external
          providers.
        </p>
      </article>
    </div>
  );
}
