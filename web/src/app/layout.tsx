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

export const metadata: Metadata = {
  title: "The Story of Inference-Time Scaling — and the training-time loop behind it",
  description:
    "An interactive explorable explanation: how a language model gets better answers by thinking longer at inference time, and where that stops working.",
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
