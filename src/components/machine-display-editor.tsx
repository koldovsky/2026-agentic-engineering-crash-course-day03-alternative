"use client";

import { useId, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { MachineSummary } from "@/lib/queries";

/** Display preferences never edit the portable identities used for deduplication. */
export function MachineDisplayEditor({ machine }: { machine: MachineSummary }) {
  const id = useId();
  const router = useRouter();
  const [member, setMember] = useState(machine.member);
  const [label, setLabel] = useState(machine.label);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const submitting = useRef(false);

  function save(reset = false) {
    if (submitting.current) return;
    submitting.current = true;
    setMessage("");
    setError("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/machines", {
          method: reset ? "DELETE" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            reset
              ? { machineId: machine.id }
              : { machineId: machine.id, member, label },
          ),
        });
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error ?? "Names could not be saved.");
        setMember(result.member);
        setLabel(result.label);
        setMessage(reset ? "Display names reset." : "Display names saved.");
        // Sources ignores usage filters. Remove an obsolete name from navigation.
        const url = new URL(window.location.href);
        if (url.searchParams.has("member")) {
          url.searchParams.delete("member");
          router.replace(`${url.pathname}${url.search}`);
        }
        router.refresh();
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Names could not be saved. Please retry.",
        );
      } finally {
        submitting.current = false;
      }
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save();
  }

  return (
    <details className="machine-display-editor">
      <summary>Edit display names</summary>
      <form onSubmit={submit} aria-busy={pending}>
        <fieldset disabled={pending}>
          <legend className="sr-only">
            Local display names for {machine.label}
          </legend>
          <div className="field">
            <label className="field-label" htmlFor={`${id}-member`}>
              Member display name
            </label>
            <input
              id={`${id}-member`}
              value={member}
              onChange={(event) => setMember(event.target.value)}
              required
              maxLength={100}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor={`${id}-computer`}>
              Computer display name
            </label>
            <input
              id={`${id}-computer`}
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              required
              maxLength={100}
            />
          </div>
          <p className="muted">
            Only changes names in this workspace. Exports keep the original
            attribution.
          </p>
          <div className="display-name-actions">
            <button className="button button-primary" type="submit">
              {pending ? "Saving…" : "Save display names"}
            </button>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => save(true)}
            >
              Reset display names
            </button>
          </div>
        </fieldset>
        {error ? (
          <p className="notice notice-error" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="notice notice-success" role="status">
            {message}
          </p>
        ) : null}
      </form>
    </details>
  );
}
