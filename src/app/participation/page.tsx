import ParticipationHub from "@/components/participation-hub";

export const metadata = {
  title: "Citizen participation",
  description:
    "Verified South African public participation notices, bill briefs, hearings, government channels, voter registration and parliamentary monitoring resources.",
};

export default function ParticipationPage() {
  return <ParticipationHub initialNow={new Date().toISOString()} />;
}
