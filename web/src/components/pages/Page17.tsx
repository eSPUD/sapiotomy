/**
 * Page 17, the glossary: the deck's last page, and only ever the glossary. It
 * belongs to no act (its PAGES entry has none), so its kicker reads "Appendix",
 * and analytics count only the 16 story pages.
 *
 * Token and greedy decoding moved here from page 5's "Terms" margin note on
 * 2026-09-27 (author). The definitions are page 5's wording, with the
 * page-bound phrases generalised: "this page" became "this explainer", and
 * "both runs decode greedily" became a definition, since not every run in the
 * deck is greedy (page 7 samples).
 */
import { PageNav } from "@/components/PageNav";
import { GLOSSARY } from "@/lib/pages";

/** Alphabetical. Each entry is one term and a definition a first-year reader can use. */
const TERMS: { term: string; id: string; definition: string }[] = [
  {
    term: "Greedy decoding",
    id: "greedy",
    definition:
      "At every step the model takes its single most likely next token, so the same prompt always produces the same chain.",
  },
  {
    term: "Token",
    id: "token",
    definition:
      "A word-piece, the unit a model writes one at a time. Every length in this explainer is counted in tokens.",
  },
];

export function Page17() {
  const page = GLOSSARY;
  return (
    <article className="flex flex-col gap-6">
      <p className="text-xs font-eyebrow uppercase tracking-wide text-ink-muted">Appendix</p>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>
      <dl className="flex flex-col gap-5">
        {TERMS.map((t) => (
          <div key={t.id} id={t.id} className="flex flex-col gap-1 border-l-4 border-grid pl-3">
            <dt className="font-semibold text-ink">{t.term}</dt>
            <dd className="text-ink-muted">{t.definition}</dd>
          </div>
        ))}
      </dl>
      <PageNav n={page.n} />
    </article>
  );
}
