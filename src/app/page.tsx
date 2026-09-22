import { headers } from "next/headers";
import Link from "next/link";
import { ZodError } from "zod";
import { summarize } from "@/lib/aggregate";
import { assertLocalRequest } from "@/lib/http";
import {
  getDisplayBundle,
  parseQuery,
  queryPrompts,
  queryMachines,
  type ParsedQuery,
} from "@/lib/queries";
import { DashboardShell } from "@/components/dashboard-shell";
import { FilterBar } from "@/components/filter-bar";
import { Overview, TeamView } from "@/components/analytics";
import { PromptLibrary } from "@/components/prompt-library";
import { SourcesView } from "@/components/sources-view";
import { PricingReference } from "@/components/pricing-reference";
import { SummaryCsvControl } from "@/components/summary-csv-control";
import { EmptyUsage, views, type View } from "@/components/ui";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [values, incoming] = await Promise.all([searchParams, headers()]);
  assertLocalRequest(new Request("http://127.0.0.1/", { headers: incoming }));
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values))
    if (value !== undefined)
      params.set(key, Array.isArray(value) ? value[0] : value);
  const rawView = params.get("view") ?? "overview";
  const view: View = views.includes(rawView as View)
    ? (rawView as View)
    : "overview";
  let query: ParsedQuery;
  try {
    query = parseQuery(params);
  } catch (error) {
    if (!(error instanceof ZodError)) throw error;
    const fallback: ParsedQuery = {
      source: params.get("source") === "demo" ? "demo" : "local",
      filters: {},
      q: "",
      page: 1,
    };
    return (
      <DashboardShell query={fallback} view={view}>
        <div className="notice notice-error" role="alert">
          <h2>These filters need a second look</h2>
          <p>
            Check the provider, date range, and page number. The start date must
            be on or before the end date.
          </p>
          <Link
            className="button button-secondary"
            href={`/?view=${view}&source=${fallback.source}`}
          >
            Clear filters
          </Link>
        </div>
      </DashboardShell>
    );
  }
  if (view === "pricing") {
    return (
      <DashboardShell query={query} view={view}>
        <PricingReference />
      </DashboardShell>
    );
  }
  const bundle = getDisplayBundle(query.source, view === "prompts");
  if (view === "sources") {
    return (
      <DashboardShell query={query} view={view}>
        <SourcesView machines={queryMachines(bundle)} source={query.source} />
      </DashboardShell>
    );
  }
  const summary = summarize(bundle, query.filters);
  // Prompt-only imports can have no usage events. Their people and providers
  // still need to be available in the prompt filters, without sending text.
  const promptMachines = new Set(
    bundle.prompts.map((prompt) => prompt.machineId),
  );
  const choices =
    view === "prompts"
      ? {
          ...summary.choices,
          providers: [
            ...new Set([
              ...summary.choices.providers,
              ...bundle.prompts.map((prompt) => prompt.provider),
            ]),
          ].sort(),
          members: [
            ...new Set([
              ...summary.choices.members,
              ...bundle.machines
                .filter((machine) => promptMachines.has(machine.id))
                .map((machine) => machine.member),
            ]),
          ].sort(),
        }
      : summary.choices;
  const filtered = Object.values(query.filters).some(Boolean);
  return (
    <DashboardShell query={query} view={view}>
      {["overview", "team", "prompts"].includes(view) ? (
        <FilterBar
          key={params.toString()}
          choices={choices}
          query={query}
          view={view}
        />
      ) : null}
      {view === "overview" ? (
        summary.totals.events ? (
          <Overview summary={summary} query={query} filtered={filtered} />
        ) : (
          <EmptyUsage filtered={filtered} query={query}>
            <div className="inline-row centered">
              <SummaryCsvControl
                rows={[]}
                totals={summary.totals}
                source={query.source}
                filtered={filtered}
              />
            </div>
          </EmptyUsage>
        )
      ) : null}
      {view === "team" ? (
        summary.totals.events ? (
          <TeamView summary={summary} query={query} />
        ) : (
          <EmptyUsage filtered={filtered} query={query} />
        )
      ) : null}
      {view === "prompts" ? (
        <PromptLibrary result={queryPrompts(bundle, query)} query={query} />
      ) : null}
    </DashboardShell>
  );
}
