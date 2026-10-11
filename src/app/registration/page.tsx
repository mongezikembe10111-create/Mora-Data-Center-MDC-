import type { Metadata } from "next";
import Dashboard from "@/components/dashboard";
export const metadata: Metadata = { title: "Voter registration" };
export default function Page() {
  return <Dashboard view="registration" />;
}
