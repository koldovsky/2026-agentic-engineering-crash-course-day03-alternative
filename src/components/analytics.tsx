import Link from "next/link";
import {
  ArrowRight,
  CircleDollarSign,
  Hash,
  Layers3,
  UsersRound,
} from "lucide-react";
import type { UsageSummary } from "@/lib/aggregate";
import type { ParsedQuery } from "@/lib/queries";
import type { SummaryCsvSource } from "@/lib/csv-summary";
import { PRICE_DISCLAIMER } from "@/lib/pricing";
import { ActivityChart, TokenComposition } from "./activity-chart";
import { ProviderMark } from "./provider-mark";
import { SummaryCsvControl } from "./summary-csv-control";
import {
  Avatar,
  compact,
  Cost,
  dateTime,
  hrefFor,
  modelName,
  number,
  percent,
  ProviderBadge,
  SectionHeading,
} from "./ui";

export function MetricCards({ summary }: { summary: UsageSummary }) {
  const totals = summary.totals;
  return (
    <div className="metric-grid">
      <section className="metric-card">
        <div className="metric-label">
          <span>Total tokens</span>
          <Hash size={17} />
        </div>
        <div
          className="metric-value"
          data-testid="metric-tokens"
          data-value={totals.totalTokens}
          title={number(totals.totalTokens)}
        >
          {compact(totals.totalTokens)}
        </div>
        <div className="metric-detail">
          <span className="tiny-dot blue" />
          {number(totals.events)} usage events
        </div>
      </section>
      <section className="metric-card">
        <div className="metric-label">
          <span>Estimated API cost</span>
          <CircleDollarSign size={17} />
        </div>
        <div
          className="metric-value metric-cost"
          data-testid="metric-cost"
          data-value={
            totals.pricedEvents === 0 && totals.events > 0
              ? "unpriced"
              : totals.estimatedCostUsd
          }
        >
          <Cost metrics={totals} />
        </div>
        <div className="metric-detail">
          {totals.pricingCoverage === null ? (
            "No token usage to price"
          ) : (
            <>
              <span
                className={`tiny-dot ${totals.unpricedEvents ? "amber" : "green"}`}
              />
              {percent(totals.pricingCoverage)} of tokens priced
              {totals.unpricedEvents > 0
                ? ` · ${number(totals.unpricedEvents)} unpriced`
                : ""}
            </>
          )}
        </div>
      </section>
      <section className="metric-card">
        <div className="metric-label">
          <span>Sessions</span>
          <Layers3 size={17} />
        </div>
        <div
          className="metric-value"
          data-testid="metric-sessions"
          data-value={totals.sessions}
        >
          {number(totals.sessions)}
        </div>
        <div className="metric-detail">
          Across {summary.byProvider.length}{" "}
          {summary.byProvider.length === 1 ? "provider" : "providers"}
        </div>
      </section>
      <section className="metric-card">
        <div className="metric-label">
          <span>Team members</span>
          <UsersRound size={17} />
        </div>
        <div
          className="metric-value"
          data-testid="metric-members"
          data-value={totals.members}
        >
          {number(totals.members)}
        </div>
        <div className="metric-detail">
          {totals.machines} {totals.machines === 1 ? "machine" : "machines"}{" "}
          with observed usage
        </div>
      </section>
    </div>
  );
}
export function Overview({
  summary,
  query,
  filtered,
}: {
  summary: UsageSummary;
  query: ParsedQuery;
  filtered: boolean;
}) {
  return (
    <>
      <MetricCards summary={summary} />
      <div className="chart-grid-layout">
        <ActivityChart summary={summary} />
        <TokenComposition summary={summary} />
      </div>
      <div className="breakdown-grid">
        <ModelBreakdown summary={summary} source={query.source} filtered={filtered} />
        <MemberBreakdown summary={summary} query={query} />
      </div>
      <RecentSessions summary={summary} />
      <p className="estimate-note">
        <CircleDollarSign size={15} />
        <span>
          {PRICE_DISCLAIMER}{" "}
          <Link href={hrefFor(query, "pricing")}>
            View rate reference <ArrowRight size={12} />
          </Link>
        </span>
      </p>
    </>
  );
}
function ModelBreakdown({
  summary,
  source,
  filtered,
}: {
  summary: UsageSummary;
  source: SummaryCsvSource;
  filtered: boolean;
}) {
  return (
    <section className="card">
      <SectionHeading
        title="Usage by model"
        detail="A closer look at your model mix"
      >
        <div className="inline-row">
          <span className="count-badge">{summary.byModel.length} models</span>
          <SummaryCsvControl
            key={`${source}:${JSON.stringify(summary.filters)}`}
            rows={summary.byModel.map(({ model, totalTokens, estimatedCostUsd, events, pricedEvents }) => ({
              model,
              totalTokens,
              estimatedCostUsd,
              events,
              pricedEvents,
            }))}
            totals={summary.totals}
            source={source}
            filtered={filtered}
          />
        </div>
      </SectionHeading>
      <div className="table-scroll">
        <table className="model-table">
          <caption className="sr-only">
            Model token totals, share of usage, and estimated cost
          </caption>
          <thead>
            <tr>
              <th>Model</th>
              <th className="numeric">Tokens</th>
              <th className="numeric">Est. cost</th>
              <th>Share</th>
            </tr>
          </thead>
          <tbody>
            {summary.byModel.map((model) => (
              <tr key={`${model.provider}:${model.model}`}>
                <td>
                  <div className="model-cell">
                    <span
                      className={`model-icon ${model.provider}`}
                      aria-hidden="true"
                    >
                      <ProviderMark provider={model.provider} />
                    </span>
                    <span>
                      <strong title={model.model}>
                        {modelName(model.model)}
                      </strong>
                      <small>
                        {model.provider === "claude-code"
                          ? "Anthropic"
                          : "OpenAI"}
                      </small>
                    </span>
                  </div>
                </td>
                <td className="numeric" title={number(model.totalTokens)}>
                  {compact(model.totalTokens)}
                </td>
                <td className="numeric">
                  <Cost metrics={model} />
                </td>
                <td>
                  <div className="share-cell">
                    <span>
                      {percent(
                        model.totalTokens /
                          Math.max(summary.totals.totalTokens, 1),
                      )}
                    </span>
                    <div className="share-track">
                      <i
                        style={{
                          width: `${(model.totalTokens / Math.max(summary.totals.totalTokens, 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
function MemberBreakdown({
  summary,
  query,
}: {
  summary: UsageSummary;
  query: ParsedQuery;
}) {
  return (
    <section className="card">
      <SectionHeading
        title="Team activity"
        detail="The people behind the progress"
      >
        <Link className="text-link" href={hrefFor(query, "team")}>
          View team <ArrowRight size={14} />
        </Link>
      </SectionHeading>
      <div className="member-list">
        {summary.byMember.map((member) => (
          <Link
            className="member-row"
            key={member.member}
            href={hrefFor(query, "team", { member: member.member })}
          >
            <Avatar name={member.member} />
            <div className="member-info">
              <strong>{member.member}</strong>
              <span>
                {member.sessions} sessions · {member.machines}{" "}
                {member.machines === 1 ? "machine" : "machines"}
              </span>
            </div>
            <div className="member-usage">
              <strong>{compact(member.totalTokens)}</strong>
              <span>
                <Cost metrics={member} />
              </span>
            </div>
          </Link>
        ))}
      </div>
      <div className="card-footnote">
        Member names are contributor labels or local display names.{" "}
        <Link href={hrefFor(query, "sources")}>Edit names in Data sources</Link>
        .
      </div>
    </section>
  );
}
export function RecentSessions({ summary }: { summary: UsageSummary }) {
  return (
    <section className="card sessions-card">
      <SectionHeading
        title="Recent sessions"
        detail="First observed activity in the selected period, with member and computer context"
      >
        <span className="count-badge">
          {summary.recentSessions.length} shown
        </span>
      </SectionHeading>
      <div className="table-scroll">
        <table>
          <caption className="sr-only">
            Recent sessions with member, provider, model, usage and cost
          </caption>
          <thead>
            <tr>
              <th>Session / member</th>
              <th>Provider</th>
              <th>Model</th>
              <th className="numeric">Tokens</th>
              <th className="numeric">Est. cost</th>
              <th>Last activity · UTC</th>
            </tr>
          </thead>
          <tbody>
            {summary.recentSessions.map((session) => (
              <tr
                key={`${session.machineId}:${session.provider}:${session.sessionId}`}
                data-testid={`session-${session.machineId}-${session.provider}-${session.sessionId}`}
              >
                <td>
                  <div className="session-member">
                    <Avatar name={session.member} />
                    <div>
                      <strong className="session-title">
                        Session · {dateTime(session.firstAt)}
                      </strong>
                      <span className="session-context">
                        {session.member} · {session.machineLabel}
                      </span>
                      <details className="identity-details">
                        <summary>Session details</summary>
                        <dl>
                          <dt>Session ID</dt>
                          <dd>
                            <code>{session.sessionId}</code>
                          </dd>
                          <dt>Machine ID</dt>
                          <dd>
                            <code>{session.machineId}</code>
                          </dd>
                          <dt>Observed usage events</dt>
                          <dd>{number(session.events)}</dd>
                        </dl>
                      </details>
                    </div>
                  </div>
                </td>
                <td>
                  <ProviderBadge provider={session.provider} />
                </td>
                <td className="session-model">
                  {session.models.map(modelName).join(", ")}
                </td>
                <td className="numeric" title={number(session.totalTokens)}>
                  {compact(session.totalTokens)}
                </td>
                <td className="numeric">
                  <Cost metrics={session} />
                </td>
                <td className="date-cell">{dateTime(session.lastAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
export function TeamView({
  summary,
  query,
}: {
  summary: UsageSummary;
  query: ParsedQuery;
}) {
  const max = Math.max(
    ...summary.byMember.map((member) => member.totalTokens),
    1,
  );
  return (
    <>
      <MetricCards summary={summary} />
      <div className="team-cards">
        {summary.byMember.map((member) => (
          <article className="card team-member-card" key={member.member}>
            <div className="team-member-header">
              <Avatar name={member.member} size="large" />
              <div>
                <h2>{member.member}</h2>
                <span>
                  {member.machines}{" "}
                  {member.machines === 1 ? "machine" : "machines"} ·{" "}
                  {member.sessions} sessions
                </span>
              </div>
            </div>
            <div className="team-member-numbers">
              <div>
                <span>Total tokens</span>
                <strong title={number(member.totalTokens)}>
                  {compact(member.totalTokens)}
                </strong>
              </div>
              <div>
                <span>Est. API cost</span>
                <strong>
                  <Cost metrics={member} />
                </strong>
              </div>
            </div>
            <div className="team-activity-track" aria-hidden="true">
              <span style={{ width: `${(member.totalTokens / max) * 100}%` }} />
            </div>
            <div className="team-member-footer">
              <span>
                {percent(
                  member.totalTokens / Math.max(summary.totals.totalTokens, 1),
                )}{" "}
                of tokens in view
              </span>
              <Link
                className="text-link"
                href={hrefFor(query, "prompts", { member: member.member })}
              >
                View prompts <ArrowRight size={13} />
              </Link>
            </div>
          </article>
        ))}
      </div>
      <RecentSessions summary={summary} />
      <p className="muted small">
        Names and machine attribution are supplied by contributors. Estimates
        cover priced usage only.
      </p>
    </>
  );
}
