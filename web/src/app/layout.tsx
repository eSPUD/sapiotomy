import type { Metadata } from "next";
import "./globals.css";
import { ProgressRail } from "@/components/ProgressRail";

export const metadata: Metadata = {
  title: "The Story of Inference-Time Scaling",
  description:
    "An interactive explorable explanation: how a language model gets better answers by thinking longer at inference time — and where that stops working.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas text-ink antialiased">
        <ProgressRail />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
