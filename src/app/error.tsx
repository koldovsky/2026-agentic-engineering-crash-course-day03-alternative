"use client";
import { TriangleAlert } from "lucide-react";
import Link from "next/link";

export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <main className="standalone-state">
      <TriangleAlert size={36} />
      <h1>We couldn’t open this workspace</h1>
      <p>
        Open Token Atlas on 127.0.0.1 or localhost. If the address is correct,
        check that the local data file is accessible and try again.
      </p>
      <div className="inline-row centered">
        <button className="button button-primary" onClick={retry}>
          Try again
        </button>
        <Link href="/" className="button button-secondary">
          Back to overview
        </Link>
      </div>
    </main>
  );
}
