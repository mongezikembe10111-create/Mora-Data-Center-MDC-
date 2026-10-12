import Link from "next/link";
export default function NotFound() {
  return (
    <div className="page-shell">
      <section className="page-intro">
        <p className="eyebrow">404 · PAGE NOT FOUND</p>
        <h1>We couldn’t find this page.</h1>
        <p className="muted">
          Return to The Public Square to explore the evidence and find ways to
          take part.
        </p>
        <Link href="/" className="button button-primary">
          Back to The Public Square
        </Link>
      </section>
    </div>
  );
}
