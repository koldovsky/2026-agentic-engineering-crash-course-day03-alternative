import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Token Atlas — Team usage, in perspective",
  description:
    "A local workspace for your team's Claude Code and Codex usage, estimated costs, and human prompts.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
