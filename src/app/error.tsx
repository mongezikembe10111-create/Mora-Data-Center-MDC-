"use client";
import Link from "next/link";
export default function Error({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="page-shell">
      <div className="panel">
        <p className="eyebrow">The Public Square</p>
        <h1>We couldn’t load this view.</h1>
        <p className="muted">Try loading the view again.</p>
        <button className="button button-primary" onClick={retry}>
          Try again
        </button>
        <Link href="/" className="button" style={{ marginLeft: 12 }}>
          Return to The Public Square
        </Link>
      </div>
    </div>
  );
}
