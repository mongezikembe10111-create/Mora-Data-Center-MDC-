import type { Metadata } from "next";
import ComparisonStudio from "@/components/comparison-studio";
export const metadata: Metadata = { title: "Electoral comparison studio" };
export default function Page() {
  return (
    <div className="page-shell">
      <section className="page-intro">
        <p className="eyebrow">The Public Square RESEARCH TOOLS</p>
        <h1>Electoral comparison studio</h1>
        <p className="muted">
          Place election years side by side. Compare like with like, preserve
          denominators, and share your view.
        </p>
      </section>
      <ComparisonStudio />
    </div>
  );
}
