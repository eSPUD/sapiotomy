"use client";

/**
 * Page 3, "Match Night": the hinge of Act 1. Three picks, each gating the
 * next: the forecast (thinking pays), the breaking news (re-thinking pays
 * again), the past final (thinking buys nothing; a fixed fact is memory or
 * nowhere). The match is a HYPOTHETICAL (see MATCH_NIGHT in lib/authored):
 * no real teams, no real facts, no real result, so nothing here goes stale.
 * The page names a past year but never states that winner.
 */

import { useState } from "react";
import { PageNav } from "@/components/PageNav";
import { Reveal } from "@/components/Reveal";
import { ACTS, getPage } from "@/lib/pages";
import { MATCH_NIGHT } from "@/lib/authored";
import { useStore } from "@/store/useStore";

const PAGE_N = 3;

type ForecastPick = "favorite" | "underdog";
type NewsPick = "stick" | "switch";
type PastPick = "pop" | "nothing";

function ChoiceButton({
  label,
  selected,
  onPick,
}: {
  label: string;
  selected: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onPick}
      className={`rounded border px-4 py-2.5 text-center text-sm ${
        selected
          ? "border-compute bg-compute/40 font-semibold text-ink"
          : "border-grid bg-surface-raised text-ink"
      }`}
    >
      {label}
      {selected ? <span aria-hidden="true"> ✓</span> : null}
    </button>
  );
}

function FormSide({
  name,
  lines,
  struckIndex,
  replacement,
}: {
  name: string;
  lines: string[];
  struckIndex?: number;
  replacement?: string;
}) {
  return (
    <div className="rounded-lg border border-grid bg-surface-raised p-4">
      <p className="text-xs text-ink-muted">Tonight</p>
      <p className="mb-1 text-lg font-semibold text-ink">{name}</p>
      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-ink-muted">
        {lines.map((line, i) =>
          i === struckIndex && replacement !== undefined ? (
            <li key={line} className="text-wrong">
              <s>{line}</s> {replacement}
            </li>
          ) : (
            <li key={line}>{line}</li>
          ),
        )}
      </ul>
    </div>
  );
}

export function Page3() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);
  const [forecastPick, setForecastPick] = useState<ForecastPick | null>(null);
  const [newsPick, setNewsPick] = useState<NewsPick | null>(null);
  const [pastPick, setPastPick] = useState<PastPick | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const pickForecast = (pick: ForecastPick) => {
    if (forecastPick !== null) return;
    setForecastPick(pick);
    recordInteraction(PAGE_N);
    setAnnouncement(
      "Breaking: the favorite's star striker pulled up injured in the warm-up and is out. Think again: who wins now?",
    );
  };

  const pickNews = (pick: NewsPick) => {
    if (newsPick !== null) return;
    setNewsPick(pick);
    recordInteraction(PAGE_N);
    setAnnouncement(
      `One more question: who won the ${MATCH_NIGHT.pastYear} World Cup final?`,
    );
  };

  const pickPast = (pick: PastPick) => {
    if (pastPick !== null) return;
    setPastPick(pick);
    recordInteraction(PAGE_N);
    setAnnouncement("The two shelves: memorized, and understood. Then the teaser to page 4.");
  };

  return (
    <article className="flex flex-col gap-5">
      <p className="text-xs uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>
      <p className="max-w-2xl text-lg text-ink-muted">
        Page 2 ended on a rule: when the problem gets big, turn the thinking up. Tonight is the
        perfect test. Picture it: the <strong>World Cup final</strong> kicks off in a few hours,
        and nobody on Earth knows how it ends.
      </p>

      <section aria-label="The forecast">
        <div className="flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4 sm:p-6">
          <p className="text-xs uppercase tracking-wide text-ink-muted">
            A different kind of question
          </p>
          <p className="text-lg text-ink">Who wins tonight?</p>
          <p className="max-w-2xl text-ink">
            You cannot answer that from memory; there is nothing to remember, it has not happened.
            But you are not answering from nothing, either. Here is the form guide.
          </p>
          <div role="group" aria-label="The form guide" className="grid gap-3 sm:grid-cols-2">
            <FormSide
              name="The favorite"
              lines={MATCH_NIGHT.formGuide.favorite}
              struckIndex={newsPick !== null ? MATCH_NIGHT.injuredLineIndex : undefined}
              replacement={MATCH_NIGHT.injuredLineReplacement}
            />
            <FormSide name="The underdog" lines={MATCH_NIGHT.formGuide.underdog} />
          </div>
          <p className="max-w-2xl text-ink">Take a moment with it. Your call:</p>
          <div
            role="group"
            aria-label="Your pick for tonight's final"
            className="grid gap-2 sm:grid-cols-2"
          >
            <ChoiceButton
              label="The favorite"
              selected={forecastPick === "favorite"}
              onPick={() => pickForecast("favorite")}
            />
            <ChoiceButton
              label="The underdog"
              selected={forecastPick === "underdog"}
              onPick={() => pickForecast("underdog")}
            />
          </div>
          {forecastPick !== null ? (
            <p className="max-w-2xl text-ink">
              Wherever you landed, watch where the answer came from. Not a pop; there is no fact of
              the matter yet, anywhere, in any head. You <em>weighed facts against each other</em>:
              form against momentum, a rested squad against a hot goalkeeper. That is reasoning,
              and on this question it is the only tool there is. Give it more time and the call
              gets sharper, never certain: replay their semifinals, weigh the midfields, picture
              that keeper against ten shots. <strong>Thinking pays.</strong>
            </p>
          ) : null}
        </div>
      </section>

      {forecastPick !== null ? (
        <Reveal>
          <section aria-label="Breaking news">
            <div className="flex flex-col gap-3 rounded-lg border-l-4 border-wrong bg-surface p-4 sm:p-6">
              <p className="text-xs uppercase tracking-wide text-wrong">
                Breaking, an hour before kickoff
              </p>
              <p className="max-w-2xl text-lg text-ink">
                The favorite&apos;s star striker pulled up <strong>injured in the warm-up</strong>,
                and is out of the match.
              </p>
              <p className="max-w-2xl text-ink">
                One line of the form guide just died. Think again: who wins now?
              </p>
              <div role="group" aria-label="Rethink your pick" className="grid gap-2 sm:grid-cols-2">
                <ChoiceButton
                  label="Stick with my pick"
                  selected={newsPick === "stick"}
                  onPick={() => pickNews("stick")}
                />
                <ChoiceButton
                  label="Switch"
                  selected={newsPick === "switch"}
                  onPick={() => pickNews("switch")}
                />
              </div>
              {newsPick !== null ? (
                <p className="max-w-2xl text-ink">
                  Stick or switch, you just did it again: took one brand-new fact and{" "}
                  <em>rebuilt the whole call</em> around it. Nothing got recalled; there is still
                  nothing to recall. New fact in, sharper call out.{" "}
                  <strong>Thinking pays again.</strong>
                </p>
              ) : null}
            </div>
          </section>
        </Reveal>
      ) : null}

      {newsPick !== null ? (
        <Reveal>
          <section aria-label="The past final">
            <div className="flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4 sm:p-6">
              <p className="text-xs uppercase tracking-wide text-ink-muted">One more question</p>
              <p className="max-w-2xl text-lg text-ink">
                Who won the <strong>{MATCH_NIGHT.pastYear} World Cup final</strong>?
              </p>
              <div
                role="group"
                aria-label="Do you know that winner"
                className="grid gap-2 sm:grid-cols-2"
              >
                <ChoiceButton
                  label="It popped into my head"
                  selected={pastPick === "pop"}
                  onPick={() => pickPast("pop")}
                />
                <ChoiceButton
                  label="I've got nothing"
                  selected={pastPick === "nothing"}
                  onPick={() => pickPast("nothing")}
                />
              </div>
              {pastPick === "pop" ? (
                <p className="max-w-2xl text-ink">
                  Zero steps, zero effort; it was simply there. And notice: thinking harder would
                  not have made it arrive any better, or any faster. That was a lookup, not a
                  build.
                </p>
              ) : null}
              {pastPick === "nothing" ? (
                <p className="max-w-2xl text-ink">
                  Now sit with that for a second. An hour would not help. There is nothing to
                  reason <em>from</em>: no form guide, no team sheets, nothing to weigh. The result
                  is a fixed fact of history, and a fixed fact is either already in your head, or
                  it is nowhere.
                </p>
              ) : null}
              {pastPick !== null ? (
                <p className="max-w-2xl text-ink">
                  An agent is in exactly the same spot. Hand it tonight&apos;s form guide and the
                  injury news, and thinking time turns into a sharper forecast. Ask it about a
                  final it never saw, and an hour of thinking buys nothing; there is nothing to
                  work from.
                </p>
              ) : null}
            </div>
          </section>
        </Reveal>
      ) : null}

      {pastPick !== null ? (
        <Reveal>
          <section aria-label="The two shelves" className="flex flex-col gap-4">
            <p className="max-w-2xl text-ink">
              Put the whole evening next to page 2&apos;s multiplication, and the map draws itself.
              Every answer you have ever given came off one of <strong>two shelves</strong>:
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-grid bg-surface p-4">
                <p className="text-xs text-ink-muted">Memorized</p>
                <p className="mb-1 text-lg font-semibold text-ink">
                  &ldquo;I&apos;ve seen this one.&rdquo;
                </p>
                <p className="text-sm text-ink-muted">
                  The answer pops out whole. Zero steps, zero time. It only works for things that
                  have already crossed your path.
                </p>
              </div>
              <div className="rounded-lg border border-grid bg-surface p-4">
                <p className="text-xs text-ink-muted">Understood</p>
                <p className="mb-1 text-lg font-semibold text-ink">
                  &ldquo;I can rebuild it.&rdquo;
                </p>
                <p className="text-sm text-ink-muted">
                  Steps take time. But it works on things nobody has met yet: a fresh
                  multiplication, tonight&apos;s final. If the pieces exist, reasoning builds the
                  best answer they allow.
                </p>
              </div>
            </div>
            <div className="max-w-2xl rounded-lg border-l-4 border-wrong bg-wrong/15 p-4 text-ink">
              And the {MATCH_NIGHT.pastYear} final marks the boundary between them. It cannot be
              rebuilt: no pieces, nothing to reason from. It can only be remembered. On one kind of
              question, thinking is the whole game and turning it up keeps paying. On this kind,
              thinking buys nothing:{" "}
              <strong>the answer is either already in there, or it is nowhere.</strong>
            </div>
            <p className="max-w-2xl text-ink">
              <em>
                Which leaves the real question. How does an answer get <strong>in there</strong> in
                the first place? That is a different machine from the one you have been watching,
                with its own name and its own price tag. Next page.
              </em>
            </p>
            <p className="text-xs text-ink-muted">
              the match night is a hypothetical: no real teams, no real facts, no real result; the
              form guide is invented on purpose so nothing here can go stale · the{" "}
              {MATCH_NIGHT.pastYear} question names a year but never states the winner · framing:
              Kahneman, <em>Thinking, Fast and Slow</em>
            </p>
          </section>
        </Reveal>
      ) : null}

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
