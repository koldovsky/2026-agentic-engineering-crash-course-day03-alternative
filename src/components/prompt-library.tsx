import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  MessageSquareText,
  Monitor,
} from "lucide-react";
import type { ParsedQuery, PromptPage } from "@/lib/queries";
import { Avatar, dateTime, hrefFor, number, ProviderBadge } from "./ui";

export function PromptLibrary({
  result,
  query,
}: {
  result: PromptPage;
  query: ParsedQuery;
}) {
  const start = (result.page - 1) * result.pageSize + 1;
  return (
    <section className="prompt-library">
      <div className="section-intro">
        <div>
          <h2>
            {number(result.total)} human{" "}
            {result.total === 1 ? "prompt" : "prompts"}
          </h2>
          <p>
            {query.q
              ? `Matches for “${query.q}”`
              : "Original questions and instructions, in their own words."}
            {query.filters.model
              ? " Model selection matches sessions that used that model."
              : ""}
          </p>
        </div>
        <span className="count-badge">Newest first</span>
      </div>
      {result.items.length ? (
        <div className="prompt-list">
          {result.items.map((prompt) => (
            <details
              className="prompt-card card"
              key={`${prompt.machineId}:${prompt.provider}:${prompt.id}`}
            >
              <summary>
                <div className="prompt-summary-meta">
                  <Avatar name={prompt.member} />
                  <strong>{prompt.member}</strong>
                  <ProviderBadge provider={prompt.provider} />
                  <time dateTime={prompt.timestamp}>
                    {dateTime(prompt.timestamp)}
                  </time>
                  <ChevronDown size={16} className="prompt-chevron" />
                </div>
                <p className="prompt-excerpt">{prompt.text}</p>
                <span className="prompt-open-hint">Read full prompt</span>
              </summary>
              <div className="prompt-detail">
                <div className="prompt-context">
                  <span>
                    <Monitor size={13} /> {prompt.machineLabel}
                  </span>
                  <span>
                    Session <code>{prompt.sessionId}</code>
                  </span>
                </div>
                <pre>{prompt.text}</pre>
              </div>
            </details>
          ))}
        </div>
      ) : (
        <div className="card prompt-empty">
          <MessageSquareText size={32} />
          <h2>
            {query.q || Object.values(query.filters).some(Boolean)
              ? "No prompts match your search"
              : "Your prompts will appear here"}
          </h2>
          <p>
            Import a file with human prompts included, or try different search
            terms and filters. Model responses are never part of this library.
          </p>
          <Link
            className="button button-secondary"
            href={
              query.q || Object.values(query.filters).some(Boolean)
                ? `/?view=prompts&source=${query.source}`
                : `/?view=sources&source=${query.source}`
            }
          >
            {query.q || Object.values(query.filters).some(Boolean)
              ? "Clear search"
              : "Go to data sources"}
          </Link>
        </div>
      )}
      <div className="pagination">
        <span>
          {result.total
            ? `${start}–${Math.min(start + result.pageSize - 1, result.total)} of ${number(result.total)} prompts`
            : "0 prompts"}
        </span>
        <div>
          {result.page > 1 ? (
            <Link
              className="button button-secondary"
              aria-label="Previous page"
              href={hrefFor(query, "prompts", {
                page: String(result.page - 1),
              })}
            >
              <ArrowLeft size={14} /> Previous
            </Link>
          ) : (
            <span
              className="button button-secondary disabled"
              aria-disabled="true"
            >
              <ArrowLeft size={14} /> Previous
            </span>
          )}
          <span className="page-count">
            Page {result.page} of {result.totalPages}
          </span>
          {result.page < result.totalPages ? (
            <Link
              className="button button-secondary"
              aria-label="Next page"
              href={hrefFor(query, "prompts", {
                page: String(result.page + 1),
              })}
            >
              Next <ArrowRight size={14} />
            </Link>
          ) : (
            <span
              className="button button-secondary disabled"
              aria-disabled="true"
            >
              Next <ArrowRight size={14} />
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
