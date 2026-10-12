import type { Metadata } from "next";
import Dashboard from "@/components/dashboard";
import CitizenActions from "@/components/citizen-actions";
export const metadata: Metadata = { title: "Electoral overview" };
export default function Page() {
  return <Dashboard view="overview" citizenActions={<CitizenActions />} />;
}
