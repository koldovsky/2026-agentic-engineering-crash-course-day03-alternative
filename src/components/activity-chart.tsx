import { ArrowDown, ChevronDown } from "lucide-react";
import type { UsageSummary } from "@/lib/aggregate";
import { compact, number, shortDate, Cost, SectionHeading } from "./ui";

export function ActivityChart({ summary }: { summary: UsageSummary }) {
  const days = summary.byDay;
  const width = 800,
    height = 210,
    left = 50,
    right = 20,
    top = 18,
    bottom = 30;
  const plotWidth = width - left - right,
    plotHeight = height - top - bottom;
  const max = Math.max(...days.map((day) => day.totalTokens), 1) * 1.12;
  const x = (index: number) =>
    left +
    (days.length === 1
      ? plotWidth / 2
      : (index * plotWidth) / (days.length - 1));
  const y = (value: number) => top + plotHeight - (value / max) * plotHeight;
  const line = days
    .map(
      (day, index) => `${index ? "L" : "M"} ${x(index)} ${y(day.totalTokens)}`,
    )
    .join(" ");
  const area = `${line} L ${x(days.length - 1)} ${top + plotHeight} L ${x(0)} ${top + plotHeight} Z`;
  const labelEvery = Math.max(1, Math.ceil(days.length / 7));
  return (
    <section className="card activity-card">
      <SectionHeading
        title="Token activity"
        detail="Daily observed usage in your selected view"
      >
        <span className="chart-period">
          {days.length
            ? `${shortDate(days[0].date)} – ${shortDate(days[days.length - 1].date)}`
            : "No activity"}
          <span>UTC</span>
        </span>
      </SectionHeading>
      <div className="chart-summary">
        <strong>{compact(summary.totals.totalTokens)}</strong>
        <span>tokens in this view</span>
        <span className="chart-legend">
          <i /> Total tokens
        </span>
      </div>
      <div className="activity-plot">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`Daily token activity: ${number(summary.totals.totalTokens)} total tokens across ${days.length} recorded days.`}
        >
          <defs>
            <linearGradient id="activity-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4279e5" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#4279e5" stopOpacity="0.015" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map((tick) => {
            const value = (max * tick) / 3;
            return (
              <g key={tick}>
                <line
                  x1={left}
                  x2={width - right}
                  y1={y(value)}
                  y2={y(value)}
                  className="chart-grid"
                />
                <text
                  x={left - 10}
                  y={y(value) + 4}
                  textAnchor="end"
                  className="chart-axis"
                >
                  {compact(value)}
                </text>
              </g>
            );
          })}
          {days.length ? (
            <>
              <path d={area} fill="url(#activity-fill)" />
              <path d={line} className="chart-line" />
              {days.map((day, index) => (
                <g key={day.date}>
                  <circle
                    cx={x(index)}
                    cy={y(day.totalTokens)}
                    r={3.5}
                    className="chart-point"
                  >
                    <title>
                      {`${shortDate(day.date)}: ${number(day.totalTokens)} tokens`}
                    </title>
                  </circle>
                  {index % labelEvery === 0 || index === days.length - 1 ? (
                    <text
                      x={x(index)}
                      y={height - 6}
                      textAnchor="middle"
                      className="chart-axis"
                    >
                      {shortDate(day.date)}
                    </text>
                  ) : null}
                </g>
              ))}
            </>
          ) : null}
        </svg>
      </div>
      <details className="chart-data">
        <summary>
          View daily figures <ChevronDown size={14} />
        </summary>
        <div className="table-scroll">
          <table>
            <caption className="sr-only">
              Daily token usage and estimated costs
            </caption>
            <thead>
              <tr>
                <th>Date · UTC</th>
                <th className="numeric">Tokens</th>
                <th className="numeric">Est. cost</th>
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day.date}>
                  <td>{day.date}</td>
                  <td className="numeric">{number(day.totalTokens)}</td>
                  <td className="numeric">
                    <Cost metrics={day} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

export function TokenComposition({ summary }: { summary: UsageSummary }) {
  const { tokens, totalTokens } = summary.totals;
  const buckets = [
    { label: "Cached input", value: tokens.cacheRead, color: "cache" },
    { label: "Input", value: tokens.input, color: "input" },
    { label: "Output", value: tokens.output, color: "output" },
    {
      label: "Cache writes",
      value: tokens.cacheWrite + tokens.cacheWrite1h,
      color: "write",
    },
  ];
  return (
    <section className="card composition-card">
      <SectionHeading
        title="Under the hood"
        detail="Where your tokens are going"
      />
      <div className="composition-body">
        <div className="composition-hero">
          <span className="composition-icon">
            <ArrowDown size={19} />
          </span>
          <div>
            <strong>
              {Math.round(
                totalTokens ? (tokens.cacheRead / totalTokens) * 100 : 0,
              )}
              <small>%</small>
            </strong>
            <span>of tokens are cached input</span>
          </div>
        </div>
        <div className="composition-bar" aria-hidden="true">
          {buckets.map((bucket) => (
            <span
              className={`bucket-${bucket.color}`}
              key={bucket.label}
              style={{
                width: `${totalTokens ? (bucket.value / totalTokens) * 100 : 0}%`,
              }}
            />
          ))}
        </div>
        <ul className="composition-list">
          {buckets.map((bucket) => (
            <li key={bucket.label}>
              <span>
                <i className={`bucket-${bucket.color}`} />
                {bucket.label}
              </span>
              <strong title={number(bucket.value)}>
                {compact(bucket.value)}
              </strong>
            </li>
          ))}
        </ul>
        <p className="composition-note">
          Reasoning is included in output. Each token is counted once.
        </p>
      </div>
    </section>
  );
}
