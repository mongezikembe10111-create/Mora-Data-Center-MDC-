import Dashboard from "@/components/dashboard";
import CitizenActions from "@/components/citizen-actions";
export default function Home() {
  return <Dashboard citizenActions={<CitizenActions />} />;
}
