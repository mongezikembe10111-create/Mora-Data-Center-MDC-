"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, Command, Database, Menu, Search, X } from "lucide-react";
import { articles } from "@/lib/articles";
const links = [
  { label: "Overview", href: "/" },
  { label: "Take part", href: "/participation" },
  { label: "Bills", href: "/bills" },
  { label: "Municipalities", href: "/municipalities" },
  { label: "Election history", href: "/history" },
  { label: "Data explorer", href: "/explorer" },
  { label: "Research", href: "/research" },
  { label: "Methodology", href: "/methodology" },
];
const searchItems = [
  ...links,
  { label: "Voter registration and age composition", href: "/registration" },
  { label: "Youth age profiles and participation", href: "/youth" },
  { label: "Electoral geography and provincial map", href: "/map" },
  {
    label: "Register to vote: official IEC portal",
    href: "https://registertovote.elections.org.za/",
  },
  {
    label: "Bills, hearings, public comments and submissions",
    href: "/participation",
  },
  {
    label: "Free PMG subscription and parliamentary reports",
    href: "/participation#pmg-resources",
  },
  {
    label: "Municipal public participation, IDP and budgets",
    href: "/municipalities",
  },
  { label: "Compare municipal election years", href: "/comparison" },
  ...articles.map((article) => ({
    label: article.title,
    href: `/research/${article.slug}`,
  })),
  {
    label: "Dataset: municipal elections, 2000–2021",
    href: "/explorer?dataset=elections",
  },
  {
    label: "Dataset: voters’ roll by published age band, 2016 and 2026",
    href: "/explorer?dataset=registration&year=2026",
  },
  {
    label: "Dataset: provincial registration snapshot, September 2026",
    href: "/registration#composition-studio",
  },
  { label: "Source registry and dataset limitations", href: "/methodology" },
  {
    label: "Hypothetical participation scenarios",
    href: "/youth#scenario-lab",
  },
  { label: "About MORA", href: "/about" },
  { label: "Contact and data corrections", href: "/contact" },
  { label: "Privacy policy", href: "/privacy" },
  { label: "Cookie policy", href: "/cookies" },
  { label: "Terms of use", href: "/terms" },
  { label: "Accessibility statement", href: "/accessibility" },
];
export default function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [query, setQuery] = useState("");
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="nav-shell">
        <Link prefetch={false} href="/" className="brand">
          <span className="monogram" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
          <span>
            MORA <span className="brand-sub">DATA CENTRE</span>
            <span className="sr-only"> home</span>
          </span>
        </Link>
        <nav aria-label="Primary" className="desktop-nav">
          {links.map((l) => (
            <Link
              prefetch={false}
              key={l.href}
              href={l.href}
              className={
                pathname === l.href ||
                (l.href !== "/" && pathname.startsWith(l.href))
                  ? "active"
                  : ""
              }
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="nav-tools">
          <button
            className="icon-button"
            aria-label="Search pages and datasets"
            onClick={() => setOpen(true)}
          >
            <Search size={17} />
          </button>
          <Link prefetch={false} href="/explorer" className="nav-data">
            <Database size={14} /> Open data <ArrowUpRight size={13} />
          </Link>
          <button
            className="icon-button mobile-menu-button"
            aria-label="Toggle navigation"
            aria-expanded={mobile}
            onClick={() => setMobile(!mobile)}
          >
            {mobile ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {mobile && (
          <nav className="mobile-nav" aria-label="Mobile">
            {links.map((l) => (
              <Link
                prefetch={false}
                key={l.href}
                href={l.href}
                onClick={() => setMobile(false)}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="search-dialog">
            <div className="search-heading">
              <Search size={20} />
              <Dialog.Title>Search the data centre</Dialog.Title>
              <Dialog.Close className="icon-button" aria-label="Close search">
                <X size={18} />
              </Dialog.Close>
            </div>
            <Dialog.Description className="muted">
              Find pages, datasets, research, and methodology.
            </Dialog.Description>
            <input
              autoFocus
              className="search-input"
              aria-label="Search"
              placeholder="Try “turnout” or “youth”…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="search-results">
              {searchItems
                .filter((l) =>
                  l.label.toLowerCase().includes(query.toLowerCase()),
                )
                .map((l) => (
                  <Link
                    prefetch={false}
                    key={l.label}
                    href={l.href}
                    onClick={() => setOpen(false)}
                  >
                    <span>{l.label}</span>
                    <ArrowUpRight size={16} />
                  </Link>
                ))}
              {!searchItems.some((l) =>
                l.label.toLowerCase().includes(query.toLowerCase()),
              ) && (
                <p className="empty-state">No matching pages or datasets.</p>
              )}
            </div>
            <div className="search-footer">
              <Command size={13} /> K to open · Escape to close
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
