import Link from "next/link";
import { LandingBackdrop } from "@/components/LandingBackdrop";
import { Reveal } from "@/components/Reveal";
import { pageHref } from "@/lib/pages";

export default function Home() {
  return (
    <section className="relative flex min-h-[76vh] items-center justify-center overflow-hidden rounded-2xl border border-grid bg-canvas">
      <LandingBackdrop />

      {/* readability veil so text stays high-contrast over the art */}
      <div className="pointer-events-none absolute inset-0 bg-canvas/40" aria-hidden="true" />

      <Reveal>
        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-16 text-center">
          <span className="rounded-full border border-grid bg-surface/70 px-3 py-1 text-xs uppercase tracking-widest text-ink-muted">
            An interactive explorable
          </span>
          <h1 className="text-4xl font-bold leading-tight text-ink sm:text-6xl">
            The Story of{" "}
            <span className="text-compute">Inference-Time Scaling</span>
          </h1>
          <p className="max-w-xl text-lg text-ink-muted">
            A language model can get dramatically better answers by{" "}
            <span className="text-ink">thinking longer at answer time</span> — not only by being
            retrained or made larger. Watch each scaling law appear, hold, and sometimes break.
          </p>
          <Link
            href={pageHref(1)}
            className="rounded-lg bg-compute px-8 py-3.5 text-lg font-semibold text-canvas shadow-lg transition-transform hover:scale-105"
          >
            Begin the story →
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
