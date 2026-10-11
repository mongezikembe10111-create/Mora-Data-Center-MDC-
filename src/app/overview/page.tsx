import type { Metadata } from "next";
import Dashboard from "@/components/dashboard";
export const metadata: Metadata = { title: "Electoral overview" };
export default function Page() {
  return <Dashboard view="overview" />;
}
