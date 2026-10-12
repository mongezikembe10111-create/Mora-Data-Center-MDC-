import Link from "next/link";
import { ArrowUpRight, Landmark, MapPin, Vote } from "lucide-react";
import { civicResources } from "@/lib/civic-data";
import "./citizen-actions.css";

export default function CitizenActions() {
  const registration = civicResources.find(
    (resource) => resource.kind === "register",
  );
  return (
    <section className="citizen-actions" aria-labelledby="citizen-action-title">
      <div className="citizen-action-heading">
        <p className="eyebrow">YOUR DEMOCRACY. YOUR NEXT STEP.</p>
        <h2 id="citizen-action-title">Use your voice between elections.</h2>
        <p>
          Register, follow a proposed law, contribute to a hearing, or shape
          your municipality’s plans.
        </p>
      </div>
      <div className="citizen-action-grid">
        <a
          href={registration?.url ?? "https://registertovote.elections.org.za/"}
          target="_blank"
          rel="noopener noreferrer"
          className="citizen-action-card"
        >
          <Vote size={22} />
          <strong>Register to vote</strong>
          <span>
            Use the official IEC portal. Check your details and the cut-off for
            the election you intend to vote in.
          </span>
          <span className="text-link">
            Go to the IEC <ArrowUpRight size={13} />
          </span>
        </a>
        <Link
          prefetch={false}
          href="/participation"
          className="citizen-action-card"
        >
          <Landmark size={22} />
          <strong>Take part in public decisions</strong>
          <span>
            Find bills, hearings, comment deadlines, reports, and practical
            submission guidance.
          </span>
          <span className="text-link">
            Explore participation <ArrowUpRight size={13} />
          </span>
        </Link>
        <Link
          prefetch={false}
          href="/municipalities"
          className="citizen-action-card"
        >
          <MapPin size={22} />
          <strong>Find your municipality</strong>
          <span>
            Follow local by-laws, public notices, IDP and budget consultation
            channels.
          </span>
          <span className="text-link">
            Open the municipal directory <ArrowUpRight size={13} />
          </span>
        </Link>
      </div>
      <p className="citizen-action-footnote">
        The 4 November 2026 municipal election was proclaimed on 7 August. This
        portal does not promise that a new registration will qualify for that
        election. Register for future opportunities or check your existing
        details.{" "}
        <a
          href="https://www.elections.org.za/pw/Voter/How-Do-I-Register"
          target="_blank"
          rel="noopener noreferrer"
        >
          Read the IEC registration rules ↗
        </a>
      </p>
    </section>
  );
}
