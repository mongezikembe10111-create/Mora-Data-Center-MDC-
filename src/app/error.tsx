"use client";
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-shell">
      <div className="panel">
        <h1>We couldn’t load this view.</h1>
        <p className="muted">Try loading the view again.</p>
        <button className="button button-primary" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
