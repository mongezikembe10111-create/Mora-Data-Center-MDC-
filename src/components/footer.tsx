import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import BrandLogo from "@/components/brand-logo";
export default function Footer() {
  return (
    <footer className="footer public-square-footer">
      <div className="footer-top">
        <div>
          <Link
            prefetch={false}
            href="/"
            className="footer-brand"
            aria-label="The Public Square home"
          >
            <BrandLogo light />
          </Link>
          <p className="footer-tagline">A space to question power.</p>
          <span className="muted">Politics, law, society, accountability.</span>
        </div>
        <nav className="footer-links" aria-label="Footer">
          <div className="footer-link-group">
            <h2 className="footer-link-group-title">Understand</h2>
            <Link prefetch={false} href="/overview">
              Democracy in numbers
            </Link>
            <Link prefetch={false} href="/history">
              Election history
            </Link>
            <Link prefetch={false} href="/youth">
              Youth participation
            </Link>
            <Link prefetch={false} href="/map">
              Electoral geography
            </Link>
            <Link prefetch={false} href="/research">
              Research & analysis
            </Link>
          </div>
          <div className="footer-link-group">
            <h2 className="footer-link-group-title">Take part</h2>
            <Link prefetch={false} href="/participation">
              Public participation
            </Link>
            <Link prefetch={false} href="/bills">
              Bills & public hearings
            </Link>
            <Link prefetch={false} href="/municipalities">
              Find your municipality
            </Link>
            <Link prefetch={false} href="/participation#pmg-resources">
              Free PMG subscriptions
            </Link>
            <a
              href="https://registertovote.elections.org.za/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Register to vote · IEC{" "}
              <ArrowUpRight size={13} aria-hidden="true" />
            </a>
          </div>
          <div className="footer-link-group">
            <h2 className="footer-link-group-title">The platform</h2>
            <Link prefetch={false} href="/explorer">
              Open data & downloads
            </Link>
            <Link prefetch={false} href="/methodology">
              Methodology & sources
            </Link>
            <Link prefetch={false} href="/about">
              About The Public Square
            </Link>
            <Link prefetch={false} href="/contact">
              Contact & corrections
            </Link>
            <Link prefetch={false} href="/accessibility">
              Accessibility
            </Link>
          </div>
        </nav>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} The Public Square · South Africa
        </span>
        <div>
          <Link prefetch={false} href="/privacy">
            Privacy
          </Link>
          <Link prefetch={false} href="/cookies">
            Cookies
          </Link>
          <Link prefetch={false} href="/terms">
            Terms of use
          </Link>
          <span className="footer-status">
            <i /> No marketing trackers
          </span>
        </div>
      </div>
    </footer>
  );
}
