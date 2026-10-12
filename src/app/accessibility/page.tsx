import Link from "next/link";

export const metadata = {
  title: "Accessibility Statement | The Public Square",
  description:
    "Accessibility features, limitations and feedback for The Public Square.",
};

export default function AccessibilityPage() {
  return (
    <div className="page-shell">
      <header className="page-intro">
        <p className="eyebrow">Accessibility statement · 12 October 2026</p>
        <h1>
          Evidence should
          <br />
          be accessible.
        </h1>
        <p className="muted">
          We aim for WCAG 2.2 AA. This is a design and development target, not a
          claim of independent certification.
        </p>
      </header>
      <article className="prose panel" style={{ maxWidth: 900 }}>
        <h2>Using the interface</h2>
        <ul>
          <li>
            Navigation, form fields and filter controls use semantic links,
            buttons and labelled inputs.
          </li>
          <li>A skip link offers direct access to the main content.</li>
          <li>Visible keyboard focus helps you track the active control.</li>
          <li>
            Charts offer underlying data tables or equivalent text where
            available.
          </li>
          <li>
            Selected values and unavailable data are described in text, rather
            than by colour alone.
          </li>
          <li>
            The layout adapts to narrow screens, and motion respects
            reduced-motion preferences.
          </li>
        </ul>
        <h2>Keyboard and browser tools</h2>
        <p>
          Use Tab and Shift+Tab to move between controls, Enter to open links,
          and Space to activate focused buttons. Range controls also support the
          arrow keys. Your browser’s zoom and text-size settings can help
          increase readability.
        </p>
        <h2>Maps and visual complexity</h2>
        <p>
          Interactive maps and dense charts can be harder to explore with
          assistive technology. Use geographic selection controls, contextual
          descriptions and accessible tables as alternatives to pointing at a
          map or reading a colour scale. Source limitations remain visible in
          the text interface.
        </p>
        <h2>Feedback</h2>
        <p>
          If a feature prevents you from accessing information, visit{" "}
          <Link href="/contact">Contact & corrections</Link> and select
          “Accessibility issue”. Include the page, the task you were attempting,
          your browser and assistive technology if you are comfortable sharing
          those details.
        </p>
        <p>
          You can download a local enquiry draft or open a repository issue. A
          dedicated operator email has not been supplied, and public issues
          should not contain sensitive personal information.
        </p>
        <h2>Ongoing review</h2>
        <p>
          Accessibility requires continued keyboard, screen-reader and mobile
          testing as the product evolves. A production operator should publish
          audit scope, dates and any remaining issues after a formal review. No
          Lighthouse score or formal conformance result is claimed without a
          corresponding measurement.
        </p>
      </article>
    </div>
  );
}
