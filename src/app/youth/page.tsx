import type { Metadata } from "next";
import Dashboard from "@/components/dashboard";
export const metadata: Metadata = { title: "Youth participation" };
export default function Page() {
  return <Dashboard view="youth" />;
}
