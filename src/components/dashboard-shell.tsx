import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  ChevronRight,
  Coins,
  Database,
  Layers3,
  LockKeyhole,
  MessageSquareText,
  Monitor,
  Sparkles,
  UsersRound,
} from "lucide-react";
import type { ParsedQuery } from "@/lib/queries";
import { hrefFor, viewTitles, type View } from "./ui";
import { ExportControl } from "./transfer-controls";

const navigation = [
  { view: "overview" as const, label: "Overview", icon: ChartNoAxesCombined },
  { view: "team" as const, label: "Team", icon: UsersRound },
  { view: "prompts" as const, label: "Prompts", icon: MessageSquareText },
  { view: "sources" as const, label: "Data sources", icon: Database },
  { view: "pricing" as const, label: "Model pricing", icon: Coins },
];
export function DashboardShell({
  query,
  view,
  children,
}: {
  query: ParsedQuery;
  view: View;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link
          className="brand"
          href={`/?source=${query.source}`}
          aria-label="Token Atlas home"
        >
          <span className="brand-mark" aria-hidden="true">
            <Layers3 size={24} strokeWidth={1.7} />
          </span>
          <span>
            token<span className="brand-light">atlas</span>
            <small>Every token, in perspective.</small>
          </span>
        </Link>
        <div className="workspace-card">
          <div className="workspace-icon">
            <UsersRound size={17} />
          </div>
          <div>
            <strong>Team workspace</strong>
            <span>Local workspace</span>
          </div>
          <span className="connection-dot" aria-label="Local" />
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map(({ view: target, label, icon: Icon }) => (
            <Link
              key={target}
              href={hrefFor(query, target)}
              className={`nav-link ${view === target ? "active" : ""}`}
              aria-current={view === target ? "page" : undefined}
            >
              <Icon size={18} strokeWidth={1.7} />
              <span>{label}</span>
              {view === target ? <span className="nav-active-dot" /> : null}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-note">
            <LockKeyhole size={18} />
            <strong>Your data stays yours.</strong>
            <p>Local storage. No account needed. Share on your terms.</p>
          </div>
          <div className="sidebar-status">
            <span className="connection-dot" /> Running locally
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>
              {navigation.find((item) => item.view === view)?.label}
            </strong>
          </div>
          <div className="source-switch" aria-label="Data source">
            <Link
              href={`/?view=${view}&source=local`}
              className={query.source === "local" ? "selected" : ""}
              aria-current={query.source === "local" ? "true" : undefined}
            >
              <Monitor size={14} /> Local data
            </Link>
            <Link
              href={`/?view=${view}&source=demo`}
              className={query.source === "demo" ? "selected" : ""}
              aria-current={query.source === "demo" ? "true" : undefined}
            >
              <Sparkles size={14} /> Demo
            </Link>
          </div>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>
          {query.source === "demo" ? (
            <div className="demo-banner" role="status">
              <span>
                <Sparkles size={15} />
                <strong>Synthetic demo</strong>
                <span className="demo-description">
                  Explore a fictional team · Sep 2–15, 2026
                </span>
              </span>
              <Link href={`/?view=${view}&source=local`}>
                Back to local data <ArrowUpRight size={14} />
              </Link>
            </div>
          ) : null}
          <div className="page-heading">
            <div>
              <div className="eyebrow">YOUR TEAM, IN PERSPECTIVE</div>
              <h1>{viewTitles[view]}</h1>
              <p>{descriptions[view]}</p>
            </div>
            <div className="page-actions">
              <ExportControl key={query.source} source={query.source} />
              {view !== "sources" ? (
                <Link
                  href={`/?view=sources&source=${query.source}`}
                  className="button button-primary"
                >
                  <Database size={15} /> Import data
                </Link>
              ) : null}
            </div>
          </div>
          {children}
          <footer className="page-footer">
            <span>
              <LockKeyhole size={12} /> Local-first, by design
            </span>
            <span>
              Token Atlas <span className="footer-dot">·</span> Observed usage,
              thoughtfully organized
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
const descriptions: Record<View, string> = {
  overview: "A little clarity on where your team’s tokens go.",
  team: "Understand the people and activity behind the numbers.",
  prompts: "Good work starts with a good question. Find yours here.",
  sources: "Bring your machines together. Keep control of what you share.",
  pricing: "Know what goes into every estimate.",
};
