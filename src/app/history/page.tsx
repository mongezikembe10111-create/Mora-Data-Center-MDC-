import type { Metadata } from "next";
import Dashboard from "@/components/dashboard";
export const metadata: Metadata = { title: "Municipal election history" };
export default function Page() {
  return <Dashboard view="history" />;
}
