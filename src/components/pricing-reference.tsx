import {
  ArrowUpRight,
  CircleDollarSign,
  Info,
  CalendarDays,
} from "lucide-react";
import {
  PRICE_DISCLAIMER,
  PRICE_RATES,
  PRICE_SNAPSHOT_DATE,
} from "@/lib/pricing";
import { modelName, ProviderBadge, SectionHeading } from "./ui";

const rateFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

export function PricingReference() {
  return (
    <>
      <div className="pricing-intro">
        <div className="pricing-intro-icon">
          <CircleDollarSign size={25} />
        </div>
        <div>
          <h2>A reference, not a bill.</h2>
          <p>{PRICE_DISCLAIMER}</p>
        </div>
        <span className="snapshot-date">
          <CalendarDays size={15} /> {PRICE_SNAPSHOT_DATE}
        </span>
      </div>
      <section className="card">
        <SectionHeading
          title="Price snapshot"
          detail="USD per 1 million tokens · exact model IDs"
        >
          <span className="count-badge">{PRICE_RATES.length} models</span>
        </SectionHeading>
        <div className="table-scroll">
          <table className="pricing-table">
            <caption className="sr-only">
              Verified per-million-token rate snapshot with source links
            </caption>
            <thead>
              <tr>
                <th>Model / provider</th>
                <th className="numeric">Input</th>
                <th className="numeric">Cached input</th>
                <th className="numeric">Cache write</th>
                <th className="numeric">1h cache write</th>
                <th className="numeric">Output</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {PRICE_RATES.map((rate) => (
                <tr key={`${rate.provider}:${rate.model}`}>
                  <td>
                    <div className="pricing-model">
                      <strong>{modelName(rate.model)}</strong>
                      <code>{rate.model}</code>
                      <ProviderBadge provider={rate.provider} />
                    </div>
                  </td>
                  {(
                    [
                      "input",
                      "cacheRead",
                      "cacheWrite",
                      "cacheWrite1h",
                      "output",
                    ] as const
                  ).map((bucket) => (
                    <td className="numeric" key={bucket}>
                      {rate.rates[bucket] === null ? (
                        <span
                          className="muted"
                          title="No rate in this snapshot"
                        >
                          —
                        </span>
                      ) : (
                        rateFormat.format(rate.rates[bucket])
                      )}
                    </td>
                  ))}
                  <td>
                    <a
                      className="text-link"
                      href={rate.source}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Reference <ArrowUpRight size={13} />
                    </a>
                    {"cacheSource" in rate &&
                    typeof rate.cacheSource === "string" ? (
                      <a
                        className="text-link cache-source-link"
                        href={rate.cacheSource}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Cache rates <ArrowUpRight size={13} />
                      </a>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="card-body muted">
          Standard cache writes use 5 minutes for Claude and 30 minutes for GPT
          models with a listed write rate. The 1-hour rate applies to Claude. A
          dash means this snapshot has no rate for that bucket.
        </p>
      </section>
      <div className="pricing-notes">
        <div>
          <Info size={18} />
          <h3>How estimates work</h3>
          <p>
            Each disjoint token bucket is multiplied by its rate. Reasoning is
            already included in output. The dashboard sums records whose
            observed buckets all have known rates.
          </p>
        </div>
        <div>
          <Info size={18} />
          <h3>When a price is missing</h3>
          <p>
            An unknown model or unsupported token bucket stays unpriced. Its
            tokens still count toward usage, and the dashboard shows how much
            usage the estimate covers.
          </p>
        </div>
      </div>
    </>
  );
}
