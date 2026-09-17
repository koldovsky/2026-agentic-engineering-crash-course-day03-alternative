import type { Provider } from "@/lib/schema";

// Provisional provider symbols, with balanced artwork independent of font metrics.
export function ProviderMark({
  provider,
  size = 20,
}: {
  provider: Provider;
  size?: 12 | 20;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <g>
        {provider === "claude-code" ? (
          <path d="M12 3v18M3 12h18M5.64 5.64l12.72 12.72M5.64 18.36L18.36 5.64" />
        ) : (
          <>
            <path d="m12 3 9 9-9 9-9-9Z" />
            <path d="m12 8 4 4-4 4-4-4Z" fill="currentColor" stroke="none" />
          </>
        )}
      </g>
    </svg>
  );
}
