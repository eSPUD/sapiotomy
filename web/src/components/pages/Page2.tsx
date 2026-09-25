"use client";

/**
 * Page 2, "Thinking in Reality". One question: how many FIFA World Cups has Spain
 * won? It looks like a plain lookup, but the record moved after the model's
 * training cutoff, so its memory is stale and it lands one short. A model's
 * knowledge is fixed at training time while the world keeps producing facts,
 * so the gap reopens continuously.
 *
 * Narrative spine (three steps), each a distinct failure:
 *   1. A model training data cutoff slider (Jan 2026 to Dec 2026): sliding it changes
 *      which of Spain's titles the training data covers, and so the answer it
 *      gives. That is the knowledge gap, a missing FACT.
 *   2. Bias, not staleness. The question never said MEN'S, and Spain's women won
 *      in 2023, BEFORE the cutoff. The model held that fact and still left it
 *      out, resolving an ambiguous question to the reading its training data
 *      talks about most (cf. stereotype-consistent coreference, Zhao et al.
 *      2018). The step 1 widget already showed the biased reading, so this step
 *      names it and shows the full record in a small card instead of re-running
 *      the control.
 *   3. What a System 2 pass would have done, as an authored trace. Rereading the
 *      question settles the BIAS outright (it needs no information the model
 *      lacks). It cannot close the knowledge GAP by thinking alone, but it can
 *      spot the gap and close it with a lookup. The closing beat: nothing about
 *      the model changed, only that it spent more time and compute before
 *      answering, which is inference-time scaling; it hands off to page 3's
 *      retrain-or-look-up question.
 */

import { useEffect, useRef, useState } from "react";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { PullQuote } from "@/components/PullQuote";
import { System2Comic } from "@/components/pages/System2Comic";
import {
  SPAIN_ALL_TITLES,
  SPAIN_IDEAL_ANSWER,
  SPAIN_MACHINE_REPLIES,
  SPAIN_SYSTEM2_TRACE,
  SPAIN_WORLD_CUPS,
} from "@/lib/authored";
import { ACTS, getPage } from "@/lib/pages";
import { useStore } from "@/store/useStore";

const PAGE_N = 2;
const WC = SPAIN_WORLD_CUPS;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** A cutoff is a month, encoded as years*12 + month(0-11), so it slides smoothly. */
const monthIndex = (year: number, month0: number) => year * 12 + month0;
const CUTOFF_MIN = monthIndex(2026, 0); // Jan 2026 (the 2010 title is always known)
const CUTOFF_MAX = monthIndex(2026, 11); // Dec 2026 (past the July final)
// Opens before the July 2026 final, so the first answer is one short. Twelve
// positions, one boundary: every drag is close to the month that matters.
const CUTOFF_DEFAULT = CUTOFF_MIN;
const fmtCutoff = (i: number) => `${MONTHS[((i % 12) + 12) % 12]} ${Math.floor(i / 12)}`;

/** Men's finals are played in July. Section 1 counts only the men's tournament,
 *  which is the reading the model silently assumes; section 2 is about that. */
const DEFAULT_READING_FINALS = SPAIN_ALL_TITLES.mens.map((y) => monthIndex(y, 6));

/** Page 2's references, numbered in order of first appearance. */
const REF = { winobias: 1 } as const;

/**
 * Pairs of words that answer each other across the chat, each pair in one
 * highlight: the country ("Spain"), the count the question asks for ("How many" /
 * "once", "twice") and the tournament it names ("FIFA World Cups" / "FIFA World
 * Cup"). The reader can see which part of the reply answers which part of the
 * question.
 */
const PAIR_STYLES = {
  country: "bg-correct/15 text-correct",
  count: "bg-compute/15 text-compute",
  cup: "bg-ink/10 text-ink",
} as const;
const PAIR_PATTERN = /(\bSpain\b|How many|\bnot\b|\bonce\b|\btwice\b|FIFA World Cups?)/;
const pairOf = (word: string): keyof typeof PAIR_STYLES =>
  word === "Spain" ? "country" : word.startsWith("FIFA") ? "cup" : "count";

function Paired({ text, countRef }: { text: string; countRef?: React.Ref<HTMLElement> }) {
  return (
    <>
      {text.split(PAIR_PATTERN).map((part, i) =>
        i % 2 === 1 ? (
          <mark
            key={i}
            ref={pairOf(part) === "count" ? countRef : undefined}
            data-pair={pairOf(part)}
            className={`rounded px-0.5 font-semibold ${PAIR_STYLES[pairOf(part)]}`}
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** Speaker marks for the chat: a person for the user, a sparkle for the model.
 *  Each carries its role as an accessible name, since the icon replaces the label. */
function UserIcon() {
  return (
    <span role="img" aria-label="User" title="User" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink/10 text-ink-muted">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    </span>
  );
}

function ModelIcon() {
  return (
    <span role="img" aria-label="Model" title="Model" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-compute text-canvas">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9z" />
        <path d="M19 14l.9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9z" />
      </svg>
    </span>
  );
}

/**
 * The cutoff explorer. `finals` decides which titles count as knowable and
 * `replies` is indexed by how many of them fall on or before the cutoff.
 */
function CutoffWidget({
  id,
  finals,
  replies,
  total,
}: {
  id: string;
  finals: readonly number[];
  replies: readonly string[];
  total: number;
}) {
  const recordInteraction = useStore((s) => s.recordInteraction);
  const [cutoff, setCutoff] = useState(CUTOFF_DEFAULT);
  const known = finals.filter((f) => f <= cutoff).length;
  const gap = total - known;
  const cutoffText = fmtCutoff(cutoff);

  // The pair that matters most is the count: "How many" is answered by "once" or
  // "twice". A line is drawn between the two highlights, measured from the
  // rendered words so it follows them through wrapping and resizing.
  const chatRef = useRef<HTMLDivElement>(null);
  const askRef = useRef<HTMLElement>(null);
  const answerRef = useRef<HTMLElement>(null);
  const [link, setLink] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  useEffect(() => {
    const measure = () => {
      const c = chatRef.current?.getBoundingClientRect();
      const q = askRef.current?.getBoundingClientRect();
      const a = answerRef.current?.getBoundingClientRect();
      if (!c || !q || !a || q.width === 0 || a.width === 0) return setLink(null);
      // On narrow screens the answer can wrap past its first line, and the line
      // would then cross the reply's own text. Drop it there; the shared colour
      // still marks the pair.
      const replyTop = answerRef.current?.parentElement?.getBoundingClientRect().top ?? a.top;
      if (a.top - replyTop > 4) return setLink(null);
      setLink({
        x1: q.left + q.width / 2 - c.left,
        y1: q.bottom - c.top,
        x2: a.left + a.width / 2 - c.left,
        y2: a.top - c.top,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (ro && chatRef.current) ro.observe(chatRef.current);
    return () => {
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
  }, [known]);

  return (
    <section
      aria-label="Model training data cutoff explorer"
      className="flex flex-col overflow-hidden rounded-lg border border-grid bg-surface"
    >
      <div className="flex flex-col gap-4 p-4">
        {/* A chat: the user's question on the right, the model's reply on the left,
            each marked by an icon (a person, a model), as plain text with no bubbles. The cutoff control sits
            under the conversation. The two turns are set in font-code (true
            monospace), the deck's licensed exception for literal machine I/O,
            so they read as a prompt and a model's output rather than as prose. */}
        <div ref={chatRef} className="relative flex flex-col gap-6 rounded-lg border border-grid bg-canvas p-3">
          {link ? (
            <svg aria-hidden="true" data-testid="count-link" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
              <path
                d={`M ${link.x1} ${link.y1} C ${link.x1} ${(link.y1 + link.y2) / 2}, ${link.x2} ${(link.y1 + link.y2) / 2}, ${link.x2} ${link.y2}`}
                fill="none"
                className="stroke-compute"
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
              <circle cx={link.x1} cy={link.y1} r={2.5} className="fill-compute" />
              <circle cx={link.x2} cy={link.y2} r={2.5} className="fill-compute" />
            </svg>
          ) : null}
          <div className="flex max-w-[90%] items-start gap-2 self-end">
            <p data-testid="user-question" className="text-right font-code text-[15px] text-ink">
              <Paired text={WC.question} countRef={askRef} />
            </p>
            <UserIcon />
          </div>
          <div className="flex max-w-[90%] items-start gap-2 self-start">
            <ModelIcon />
            <p data-testid="model-reply" className="font-code text-[15px] text-ink">
              <Paired text={replies[known]} countRef={answerRef} />
            </p>
          </div>
        </div>

        {/* the reader sets the model's training cutoff */}
        <div className="flex flex-col gap-2 rounded-lg border border-grid bg-surface-raised p-3">
          <label htmlFor={id} className="flex flex-wrap items-baseline gap-2 text-sm text-ink-muted">
            <span>model training data cutoff:</span>
            <span className="font-mono text-base font-semibold text-ink">{cutoffText}</span>
          </label>
          <input
            id={id}
            type="range"
            min={CUTOFF_MIN}
            max={CUTOFF_MAX}
            step={1}
            value={cutoff}
            onChange={(e) => {
              setCutoff(Number(e.target.value));
              recordInteraction(PAGE_N);
            }}
            aria-label="Model training data cutoff month and year"
            aria-valuetext={cutoffText}
            className="w-full accent-compute"
          />
          {/* Every month of the range, marked under the track with its year stacked
              beneath it, so each mark reads as a full date without twelve wide
              labels colliding at phone width. Inset by half the native thumb so each
              label sits under its thumb position. Decorative: the slider already
              reads its value out. */}
          <div aria-hidden="true" className="relative mx-2 h-7 text-[10px] leading-tight text-ink-muted">
            {Array.from({ length: CUTOFF_MAX - CUTOFF_MIN + 1 }, (_, i) => (
              <span
                key={i}
                className="absolute flex -translate-x-1/2 flex-col items-center"
                style={{ left: `${(i / (CUTOFF_MAX - CUTOFF_MIN)) * 100}%` }}
              >
                <span>{MONTHS[(CUTOFF_MIN + i) % 12]}</span>
                <span>{Math.floor((CUTOFF_MIN + i) / 12)}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** The answer the model should have given, framed like the reply block in
 *  section 1 so the contrast with the biased one is immediate. */
function IdealAnswer() {
  return (
    <section
      aria-label="The ideal answer"
      className="flex flex-col gap-2 rounded-lg border border-correct/60 bg-canvas p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          the ideal answer
        </p>
        <span className="rounded-full border border-correct/60 bg-correct/15 px-2 py-0.5 text-xs text-correct">
          ✓ all {SPAIN_ALL_TITLES.total} titles
        </span>
      </div>
      <p className="text-lg text-ink">&ldquo;{SPAIN_IDEAL_ANSWER}&rdquo;</p>
    </section>
  );
}

/** A margin note that sits beside its step and scrolls with the page.
 *  (Same shell as Page 1, so Act 1 reads as one layout.) */
function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

export function Page2() {
  const page = getPage(PAGE_N)!;

  return (
    <article className="flex flex-col gap-6">
      <p className="text-xs uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>
      <p className="max-w-2xl text-lg text-ink-muted">
        What happens when an LLM answers with System 1 thinking in the real world? A single question
        about the World Cup shows at least two ways it can go wrong.
      </p>

      {/* Each step (left) sits beside its own note (right); the whole page scrolls. */}
      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">1. Answering a question</h2>

          <CutoffWidget
            id="cutoff-default"
            finals={DEFAULT_READING_FINALS}
            replies={SPAIN_MACHINE_REPLIES}
            total={WC.trueCount}
          />

          <p className="text-ink">
            A model only knows what was in its training data, and it can only be trained on data
            that existed before the <strong>model training data cutoff</strong>. Even events occurring
            before that cutoff can be missing if the data did not cover them. Together these create a
            perpetual <strong>knowledge gap</strong>, one that widens as the world creates new data.
          </p>

          <p className="text-ink">
            In the example above, the model answered from what it learned, without thinking it
            through. System 1 thinking led it to an incorrect answer.
          </p>

          <PullQuote>Are knowledge gaps addressable by System 2 thinking?</PullQuote>
        </section>
        <Note kicker="Try it">
          <p>Slide the model training data cutoff to move the model&apos;s memory back and forth in time.</p>
        </Note>

        {/* Step 2 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">2. Answering a question without bias</h2>

          <p className="text-ink">
            <strong>The question never said men&apos;s.</strong>
          </p>

          <IdealAnswer />

          <p className="text-ink">
            Every answer above silently counted only the men&apos;s tournament. We call this a{" "}
            <strong>knowledge bias</strong>, and it is different from the knowledge gap.
          </p>

          <p className="text-ink">
            The women&apos;s 2023 win happened before the cutoff and was widely covered. The model
            almost certainly had it in its data, but it left it out anyway. When handed an ambiguous
            question, it went with the reading its training data covered most, and never told you
            there was a choice. The gap is about what the model never saw, whereas the bias is about what it saw but
            never thought to count.
          </p>

          <p className="text-ink">
            The same bias shows up in ordinary sentences. Given a sentence that could refer to either
            of two people, a model goes with the stereotyped reading instead of flagging that the
            sentence is ambiguous.
            <Cite n={REF.winobias} />
          </p>

          <PullQuote>Are knowledge biases addressable by System 2 thinking?</PullQuote>
        </section>
        <Note kicker="References">
          <RefItem n={REF.winobias} href="https://arxiv.org/abs/1804.06876">
            Zhao et al., &ldquo;Gender Bias in Coreference Resolution: Evaluation and Debiasing
            Methods&rdquo; (NAACL 2018).
          </RefItem>
        </Note>

        {/* Step 3 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">3. Thinking it through</h2>

          <p className="text-ink">
            Both of these failures stem from System 1 thinking, answering immediately. Here is what a
            System 2 pass does instead.
          </p>

          <System2Comic />

          <p className="text-ink">
            In the first panel, rereading the question fixes the <strong>bias</strong> on its own,
            with no new information. The <strong>knowledge gap</strong> is different. The 2026 final
            was after its cutoff, so rereading won&apos;t help. Instead, the next two panels spot the
            gap and then fix it with a lookup.
          </p>

          <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
            The model itself never changed between the two answers. It had the same training data
            and the same cutoff. The only difference is that it spent more time, and more compute,
            before answering. Why not just retrain the model on newer data instead?
          </div>
        </section>
        <div aria-hidden="true" />
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
