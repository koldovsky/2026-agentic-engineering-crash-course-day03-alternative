import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Database, Sparkles } from "lucide-react";
import type { SummaryMetrics } from "@/lib/aggregate";
import type { ParsedQuery } from "@/lib/queries";
import type { Provider } from "@/lib/schema";
import { ProviderMark } from "./provider-mark";

export const views = [
  "overview",
  "team",
  "prompts",
  "sources",
  "pricing",
] as const;
export type View = (typeof views)[number];
export const viewTitles: Record<View, string> = {
  overview: "Usage overview",
  team: "Your team",
  prompts: "Prompt library",
  sources: "Data sources",
  pricing: "Model pricing",
};
export const number = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);
export const compact = (value: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
export const dollars = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: value > 0 && value < 0.01 ? 4 : 2,
  }).format(value);
export const percent = (value: number) =>
  `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value * 100)}%`;
export const providerName = (value: Provider) =>
  value === "claude-code" ? "Claude Code" : "Codex";
export const shortDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
export const dateTime = (value: string) =>
  `${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" }).format(new Date(value))} UTC`;
export function modelName(model: string) {
  const names: Record<string, string> = {
    "claude-sonnet-5": "Claude Sonnet 5",
    "claude-sonnet-4-6": "Claude Sonnet 4.6",
    "claude-sonnet-4-5": "Claude Sonnet 4.5",
    "claude-sonnet-4-5-20250929": "Claude Sonnet 4.5 · Sep 2025",
    "claude-opus-5": "Claude Opus 5",
    "claude-opus-4-6": "Claude Opus 4.6",
    "claude-opus-4-5": "Claude Opus 4.5",
    "claude-opus-4-5-20251101": "Claude Opus 4.5 · Nov 2025",
    "claude-haiku-4-5": "Claude Haiku 4.5",
    "claude-haiku-4-5-20251001": "Claude Haiku 4.5 · Oct 2025",
    "gpt-6-astra": "GPT-6 Astra",
    "gpt-5.6-sol": "GPT-5.6 Sol",
    "gpt-5.6-terra": "GPT-5.6 Terra",
    "gpt-5.6-luna": "GPT-5.6 Luna",
    "gpt-5.3-codex": "GPT-5.3 Codex",
    "gpt-5.4": "GPT-5.4",
    "gpt-5.5": "GPT-5.5",
  };
  return Object.hasOwn(names, model) ? names[model] : model;
}
export function hrefFor(
  query: ParsedQuery,
  view: View,
  patch: Record<string, string | undefined> = {},
) {
  const params = new URLSearchParams({ view, source: query.source });
  for (const [key, value] of Object.entries(query.filters))
    if (value) params.set(key, value);
  if (view === "prompts" && query.q) params.set("q", query.q);
  for (const [key, value] of Object.entries(patch)) {
    if (!value) params.delete(key);
    else params.set(key, value);
  }
  return `/?${params.toString()}`;
}
export function ProviderBadge({ provider }: { provider: Provider }) {
  return (
    <span className={`provider-badge provider-${provider}`}>
      <span className="provider-mark" aria-hidden="true">
        <ProviderMark provider={provider} size={12} />
      </span>
      {providerName(provider)}
    </span>
  );
}
export function Avatar({
  name,
  size = "normal",
}: {
  name: string;
  size?: "normal" | "large";
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const color =
    [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 5;
  return (
    <span
      className={`avatar avatar-${color} avatar-${size}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
export function Cost({
  metrics,
}: {
  metrics: Pick<
    SummaryMetrics,
    "events" | "pricedEvents" | "unpricedEvents" | "estimatedCostUsd"
  >;
}) {
  if (metrics.events > 0 && metrics.pricedEvents === 0)
    return <span className="unpriced">Unpriced</span>;
  return (
    <span>
      {dollars(metrics.estimatedCostUsd)}
      {metrics.unpricedEvents > 0 ? (
        <span className="partial-label"> partial</span>
      ) : null}
    </span>
  );
}
export function SectionHeading({
  title,
  detail,
  children,
}: {
  title: string;
  detail?: string;
  children?: ReactNode;
}) {
  return (
    <div className="card-head">
      <div>
        <h2>{title}</h2>
        {detail ? <p>{detail}</p> : null}
      </div>
      {children}
    </div>
  );
}
export function EmptyUsage({
  filtered,
  query,
  children,
}: {
  filtered: boolean;
  query: ParsedQuery;
  children?: ReactNode;
}) {
  return (
    <section className="empty-state card">
      <div className="empty-illustration" aria-hidden="true">
        <div className="empty-mini-card">
          <span />
          <span />
          <span />
        </div>
        <Database size={28} />
      </div>
      <span className="eyebrow">
        {filtered ? "A different perspective" : "A clear picture starts here"}
      </span>
      <h2>
        {filtered ? "No usage matches these filters" : "No local usage yet"}
      </h2>
      <p>
        {filtered
          ? "Try another provider, member, model, or date range to find the usage you’re looking for."
          : "Bring your team’s Claude Code and Codex sessions together. Import a usage file to see tokens, estimated costs, and activity in one place."}
      </p>
      <div className="inline-row centered">
        {filtered ? (
          <Link
            className="button button-primary"
            href={`/?view=overview&source=${query.source}`}
          >
            Clear filters
          </Link>
        ) : (
          <>
            <Link
              className="button button-primary"
              href="/?view=sources&source=local"
            >
              Import usage <ArrowUpRight size={16} />
            </Link>
            <Link
              className="button button-secondary"
              href="/?view=overview&source=demo"
            >
              <Sparkles size={16} /> Explore demo
            </Link>
          </>
        )}
      </div>
      {children}
      {!filtered ? (
        <div className="empty-footnote">
          Stored on your machine. Shared only when you export.
        </div>
      ) : null}
    </section>
  );
}
