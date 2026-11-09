import type { Metadata } from "next";
import { IBM_Plex_Mono, Lora, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { ProgressRail } from "@/components/ProgressRail";
import { KeyboardNav } from "@/components/KeyboardNav";
import { KeyboardHint } from "@/components/KeyboardHint";
import { DemoMode } from "@/components/DemoMode";
import { SubmissionFooter } from "@/components/SubmissionFooter";

// The style guide's type stack, all self-hosted by next/font (the runtime stays
// offline-capable). Body: Source Serif 4, a long-form serif, with the true
// italic for emphasis and pull quotes. Headings: Lora, the guide's free
// editorial serif (Anthropic Serif and Tiempos are not freely licensed).
// Eyebrows, metadata and code: IBM Plex Mono, standing in for Anthropic Mono.
const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});
const heading = Lora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-eyebrow",
  display: "swap",
});

// Google Scholar / Highwire Press citation tags. Rendered server-side into
// <head> on every page (this root layout applies to the landing and every /p/N
// route, and none of them override `other`). An array value for
// citation_author emits one <meta> per author, as Highwire expects. The full
// text of the work is one canonical URL (the landing), so every page points
// citation_fulltext_html_url there rather than at itself. The work was accepted
// at a workshop, so its venue is a citation_conference_title (Highwire's tag
// for proceedings), not a journal. No canonical or og:url here: this layout
// covers every route, and pointing them all at the landing would mark the
// chapters as duplicates of it.
const SITE_URL = "https://inferencetimescaling.espud.org";
const TITLE = "The Story of Inference-Time Scaling — and the training-time loop behind it";
const DESCRIPTION =
  "An interactive explorable explanation: how a language model gets better answers by thinking longer at inference time, and where that stops working.";
const VENUE = "9th Workshop on Visualization for AI Explainability (VISxAI), IEEE VIS 2026";

const CITATION_META = {
  citation_title: "The Story of Inference-Time Scaling and the Training-Time loop behind it",
  citation_author: ["Bangalore Lakshman, Shashank", "Eiers, Scott Lawrence"],
  citation_publication_date: "2026/08/10",
  citation_conference_title: VENUE,
  citation_fulltext_html_url: `${SITE_URL}/`,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "The Story of Inference-Time Scaling",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
  other: CITATION_META,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${heading.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-canvas text-ink antialiased">
        <KeyboardNav />
        <DemoMode />
        <ProgressRail />
        <main className="mx-auto max-w-[min(90%,2048px)] px-4 py-8">{children}</main>
        <SubmissionFooter />
        <KeyboardHint />
      </body>
    </html>
  );
}
