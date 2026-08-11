import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { ProgressRail } from "@/components/ProgressRail";
import { KeyboardNav } from "@/components/KeyboardNav";
import { KeyboardHint } from "@/components/KeyboardHint";
import { SubmissionFooter } from "@/components/SubmissionFooter";

// Broadsheet's typeface — self-hosted by next/font (runtime stays offline-capable),
// with the true italic loaded for emphasis and pull quotes.
const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

// Google Scholar / Highwire Press citation tags. Rendered server-side into
// <head> on every page (this root layout applies to the landing and every /p/N
// route, and none of them override `other`). An array value for
// citation_author emits one <meta> per author, as Highwire expects. The full
// text of the work is one canonical URL (the landing), so every page points
// citation_fulltext_html_url there rather than at itself.
const CITATION_META = {
  citation_title: "The Story of Inference-Time Scaling: The Training-Time Loop Behind It",
  citation_author: ["Bangalore Lakshman, Shashank", "Eiers, Scott Lawrence"],
  citation_publication_date: "2026/08/10",
  citation_journal_title: "Preprint (submitted to the VISxAI Workshop at IEEE VIS)",
  citation_fulltext_html_url: "https://sapiotomy.vercel.app/",
};

export const metadata: Metadata = {
  title: "The Story of Inference-Time Scaling — and the training-time loop behind it",
  description:
    "An interactive explorable explanation: how a language model gets better answers by thinking longer at inference time, and where that stops working.",
  other: CITATION_META,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={serif.variable}>
      <body className="min-h-screen bg-canvas text-ink antialiased">
        <KeyboardNav />
        <ProgressRail />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <SubmissionFooter />
        <KeyboardHint />
      </body>
    </html>
  );
}
