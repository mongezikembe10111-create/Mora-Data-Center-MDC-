import type { Metadata } from "next";
import DataExplorer from "@/components/data-explorer";
export const metadata: Metadata = { title: "Data explorer" };
export default function Page() {
  return (
    <div className="page-shell">
      <section className="page-intro">
        <p className="eyebrow">The Public Square RESEARCH TOOLS</p>
        <h1>Data explorer</h1>
        <p className="muted">
          Interrogate the source data. Filter, chart, sort and download the
          evidence behind the numbers.
        </p>
      </section>
      <DataExplorer />
    </div>
  );
}
