"use client";
import { useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ListFilter, Search, X } from "lucide-react";
import type { UsageSummary } from "@/lib/aggregate";
import type { ParsedQuery } from "@/lib/queries";
import { providerName, modelName, type View } from "./ui";

export function FilterBar({
  choices,
  query,
  view,
}: {
  choices: UsageSummary["choices"];
  query: ParsedQuery;
  view: View;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams({ source: query.source, view });
    for (const [key, value] of form)
      if (typeof value === "string" && value.trim())
        params.set(key, value.trim());
    startTransition(() =>
      router.push(`/?${params.toString()}`, { scroll: false }),
    );
  }
  const active = Object.values(query.filters).some(Boolean) || Boolean(query.q);
  return (
    <form className="filter-panel" onSubmit={submit} aria-label="Usage filters">
      {view === "prompts" ? (
        <div className="search-field">
          <Search size={18} aria-hidden="true" />
          <input
            name="q"
            type="search"
            aria-label="Search prompts"
            placeholder="Search prompts by a word or phrase…"
            defaultValue={query.q}
            maxLength={200}
          />
          <span className="search-hint">Human prompts only</span>
        </div>
      ) : null}
      <div className="filter-row">
        <span className="filter-icon">
          <ListFilter size={17} />
          <span>Filter</span>
        </span>
        <label className="filter-field">
          <span>Provider</span>
          <select
            name="provider"
            aria-label="Provider"
            defaultValue={query.filters.provider ?? ""}
          >
            <option value="">All providers</option>
            {choices.providers.map((provider) => (
              <option key={provider} value={provider}>
                {providerName(provider)}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-field">
          <span>Team member</span>
          <select
            name="member"
            aria-label="Team member"
            defaultValue={query.filters.member ?? ""}
          >
            <option value="">All members</option>
            {choices.members.map((member) => (
              <option key={member} value={member}>
                {member}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-field filter-model">
          <span>Model</span>
          <select
            name="model"
            aria-label="Model"
            defaultValue={query.filters.model ?? ""}
          >
            <option value="">All models</option>
            {choices.models.map((model) => (
              <option key={model} value={model}>
                {modelName(model)}
              </option>
            ))}
          </select>
        </label>
        <div className="filter-dates">
          <label className="filter-field">
            <span>From · UTC</span>
            <input
              name="from"
              type="date"
              aria-label="From"
              defaultValue={query.filters.from ?? ""}
            />
          </label>
          <span className="date-separator" aria-hidden="true">
            —
          </span>
          <label className="filter-field">
            <span>To · UTC</span>
            <input
              name="to"
              type="date"
              aria-label="To"
              defaultValue={query.filters.to ?? ""}
            />
          </label>
        </div>
        <button
          className="button button-secondary filter-apply"
          type="submit"
          disabled={pending}
        >
          {pending ? "Applying…" : "Apply filters"}
        </button>
        {active ? (
          <Link
            className="clear-filters"
            href={`/?view=${view}&source=${query.source}`}
            aria-label="Clear filters"
          >
            <X size={14} /> Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}
