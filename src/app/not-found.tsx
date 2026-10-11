import Link from "next/link";
export default function NotFound() {
  return (
    <div className="page-shell">
      <section className="page-intro">
        <p className="eyebrow">404 · PAGE NOT FOUND</p>
        <h1>This page is outside the dataset.</h1>
        <p className="muted">
          Return to the overview to continue exploring MORA.
        </p>
        <Link href="/" className="button button-primary">
          Back to overview
        </Link>
      </section>
    </div>
  );
}
