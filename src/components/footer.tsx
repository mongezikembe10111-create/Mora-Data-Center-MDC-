import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div>
          <Link href="/" className="footer-brand">
            MORA<span className="lime">.</span>
          </Link>
          <p>Democracy, By the Numbers.</p>
          <span className="muted">
            Independent analysis. Transparent evidence.
          </span>
        </div>
        <div className="footer-links">
          <Link href="/methodology">
            Methodology & sources <ArrowUpRight size={13} />
          </Link>
          <Link href="/about">About MORA</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/accessibility">Accessibility</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} MORA Data Centre · South Africa
        </span>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/cookies">Cookies</Link>
          <Link href="/terms">Terms of use</Link>
          <span className="footer-status">
            <i /> No marketing trackers
          </span>
        </div>
      </div>
    </footer>
  );
}
