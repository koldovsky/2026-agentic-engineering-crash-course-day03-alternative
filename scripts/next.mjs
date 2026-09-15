// Consistent across Windows/macOS/Linux without shell-specific env syntax.
process.env.NEXT_TELEMETRY_DISABLED = "1";
await import("next/dist/bin/next");
