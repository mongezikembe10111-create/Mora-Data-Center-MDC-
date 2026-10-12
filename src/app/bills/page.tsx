import ParticipationHub from "@/components/participation-hub";

export const metadata = {
  title: "Bills & local law",
  description:
    "Understand South African national and provincial bills and draft local law. Find verified briefs, submission deadlines and official public participation instructions.",
};

export default function BillsPage() {
  return <ParticipationHub initialNow={new Date().toISOString()} billsOnly />;
}
