"use client";

/**
 * Page 9, "Best-of-N: Select by Process" — measured, not authored.
 *
 * Page 8 ended on what the judge is actually reading. Here is the answer, and it
 * is a fork: grade the final answer, or grade every step.
 *
 * The beats:
 *   1. OUTCOME OR PROCESS? What reading the steps lets a judge do: tell a wrong
 *      answer from a right one by its reasoning, with no answer key. Then two
 *      solutions as an ORM sees them and as a PRM sees them (illustrative
 *      scores, in Page9OutcomeVsProcess.tsx). Only what each judge looks at.
 *   2. HOW DOES A PRM PICK? How step scores become one pick, then the select-by-process
 *      figure (illustrative scores, in Page9SelectByProcess.tsx).
 *   3. VOTE, VERIFIER, PROCESS. One chain, the vote and the judges on the same chains
 *      (Page9Measured.tsx).
 *   4. WHERE THE CHAIN BREAKS. What follows a chain's first low-scored step, wrong
 *      chains over right ones, then the turn to judging while the chain is written
 *      (Page9Measured.tsx).
 *
 * Run conditions are the notebook's to state, and so is the PRM's measured
 * reliability.
 */

import { Handoff } from "@/components/Handoff";
import { RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { NotebookDownload } from "@/components/NotebookDownload";
import { WhatIsAPrm } from "./Page9SelectByProcess";
import { OutcomeOrProcess, REF } from "./Page9OutcomeVsProcess";
import { DoesItPickBetter, WhereTheChainBreaks } from "./Page9Measured";
import { ACTS, getPage } from "@/lib/pages";

const PAGE_N = 9;
const NOTEBOOK_FILE = "/notebooks/9_Best_of_N_PRM_dev.ipynb";
const NOTEBOOK_SIZE = "28 KB";

export function Page9() {
  const page = getPage(PAGE_N)!;

  return (
    <article className="flex flex-col gap-6">
      <p className="text-xs font-eyebrow uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      {/* The notebook sits right beside the page title: the way to re-derive
          the page, where the page is named. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-3xl font-bold text-ink">
          <span className="font-mono text-ink-muted">{page.n}. </span>
          {page.title}
        </h1>
        <NotebookDownload href={NOTEBOOK_FILE} size={NOTEBOOK_SIZE} format="ipynb" />
      </div>

      {/* Held to the content column: the margin is the notes column (15rem) plus the
          grid's column gap (2rem), so its right edge meets the body text's. */}
      <p className="text-lg text-ink-muted lg:mr-[17rem]">
        A vote judges solutions by how often their answer comes up. A verifier judges the outcome,
        scoring the finished solution as a whole. A third way is to judge the <strong className="text-ink">process</strong>
        : the steps the model took to reach the answer. But accuracy is decided by the final answer,
        so why judge the steps?
      </p>

      {/* Page 3's grid: every beat sits in the content column with its margin note
          (or an empty cell) beside it, so nothing runs under the sidenote rail. */}
      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — outcome or process: one solution graded by an ORM and by a PRM. */}
        <OutcomeOrProcess />
        {/* House style, pages 3-8: the reference sits beside the beat that cites it. */}
        <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
          <p className="text-xs font-semibold font-eyebrow uppercase tracking-wide text-ink-muted">References</p>
          <RefItem n={REF.lightman} href="https://arxiv.org/abs/2305.20050">
            Lightman et al. 2023, <em>Let&apos;s Verify Step by Step</em> (arXiv 2305.20050).
          </RefItem>
        </aside>

        {/* Step 2 — what a PRM is, then the select-by-process figure. */}
        <WhatIsAPrm />
        <div aria-hidden="true" />

        {/* Step 3 — one chain, the vote and the judges, on the same chains. */}
        <DoesItPickBetter />
        <div aria-hidden="true" />

        {/* Step 4 — what follows a chain's first low-scored step. */}
        <WhereTheChainBreaks />
        <div aria-hidden="true" />

        {/* The hand-off, in the content column so it does not run under the notes. */}
        <Handoff className="min-w-0">
          A step-level grader can do what the others cannot: judge a chain{" "}
          <em>while it is still being written</em>. Once you can score a half-finished chain, you
          need not finish the ones going badly.{" "}
          <em className="text-ink-muted">
            You can branch, look ahead, and back out. Turn the page.
          </em>
        </Handoff>
        <div aria-hidden="true" />
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
