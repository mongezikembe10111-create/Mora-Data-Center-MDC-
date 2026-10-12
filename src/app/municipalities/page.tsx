import type { Metadata } from "next";
import MunicipalityDirectory from "@/components/municipality-directory";

export const metadata: Metadata = {
  title: "Municipal participation directory",
  description:
    "Find South African municipal websites, public participation, IDP, budget, by-law and public notice pages across all nine provinces.",
};

export default function MunicipalitiesPage() {
  return <MunicipalityDirectory />;
}
