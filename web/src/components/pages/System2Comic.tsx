/**
 * The System 2 trace as a four-panel comic strip.
 *
 * Same authored steps as the prose list (SPAIN_SYSTEM2_TRACE), so the two can
 * never disagree: each panel takes its name and caption straight from the data
 * and adds a drawing of the move being made. The art is decorative and marked
 * aria-hidden; the caption carries the meaning, so a screen reader gets the
 * trace once, in order, exactly as the list would read it.
 *
 * Palette note: every stroke and fill is currentColor driven by a token text
 * class, so the strip inherits the Broadsheet theme and no raw hex appears.
 */

import { SPAIN_SYSTEM2_TRACE } from "@/lib/authored";

const CUTOFF_LABEL = "cutoff";

/** Panel 1: the question could mean either tournament. */
function ArtAmbiguity() {
  return (
    <svg viewBox="0 0 96 56" className="h-full w-full" aria-hidden="true">
      <text x="48" y="12" textAnchor="middle" fontSize="9" className="fill-current text-ink">
        &ldquo;World Cups&rdquo;
      </text>
      {/* two readings fork out of the one phrase */}
      <path
        d="M48 16 L28 30 M48 16 L68 30"
        className="stroke-current text-ink-muted"
        strokeWidth="1"
        fill="none"
      />
      <rect x="6" y="32" width="44" height="16" rx="8" className="fill-current text-compute-ink/15" />
      <text x="28" y="43" textAnchor="middle" fontSize="8" className="fill-current text-compute-ink">
        men&apos;s
      </text>
      <rect x="52" y="32" width="44" height="16" rx="8" className="fill-current text-compute-ink/15" />
      <text x="74" y="43" textAnchor="middle" fontSize="8" className="fill-current text-compute-ink">
        women&apos;s
      </text>
    </svg>
  );
}

/** Panel 2: a timeline sealed partway along. */
function ArtCutoff() {
  return (
    <svg viewBox="0 0 96 56" className="h-full w-full" aria-hidden="true">
      <line x1="8" y1="34" x2="88" y2="34" className="stroke-current text-ink-muted" strokeWidth="1" />
      {/* inside the cutoff */}
      <circle cx="22" cy="34" r="3.5" className="fill-current text-compute-ink" />
      <text x="22" y="48" textAnchor="middle" fontSize="7" className="fill-current text-ink-muted">
        2010
      </text>
      <circle cx="44" cy="34" r="3.5" className="fill-current text-compute-ink" />
      <text x="44" y="48" textAnchor="middle" fontSize="7" className="fill-current text-ink-muted">
        2023
      </text>
      {/* the seal */}
      <line
        x1="60"
        y1="16"
        x2="60"
        y2="42"
        className="stroke-current text-wrong-ink"
        strokeWidth="1.5"
        strokeDasharray="3 2"
      />
      <text x="60" y="12" textAnchor="middle" fontSize="7" className="fill-current text-wrong-ink">
        {CUTOFF_LABEL}
      </text>
      {/* beyond it, unseen */}
      <circle
        cx="78"
        cy="34"
        r="3.5"
        className="stroke-current text-wrong-ink"
        strokeWidth="1.5"
        fill="none"
      />
      <text x="78" y="48" textAnchor="middle" fontSize="7" className="fill-current text-wrong-ink">
        2026
      </text>
    </svg>
  );
}

/** Panel 3: memory alone is refused; a current source is chosen. */
function ArtCheckSource() {
  return (
    <svg viewBox="0 0 96 56" className="h-full w-full" aria-hidden="true">
      <text x="34" y="20" textAnchor="end" fontSize="8" className="fill-current text-ink-muted">
        memory
      </text>
      <text x="44" y="21" textAnchor="middle" fontSize="11" className="fill-current text-wrong-ink">
        ✗
      </text>
      <text x="34" y="42" textAnchor="end" fontSize="8" className="fill-current text-ink">
        source
      </text>
      <text x="44" y="43" textAnchor="middle" fontSize="11" className="fill-current text-correct-ink">
        ✓
      </text>
      {/* the page it goes and fetches */}
      <rect
        x="58"
        y="28"
        width="22"
        height="20"
        rx="2"
        className="stroke-current text-correct-ink"
        strokeWidth="1.2"
        fill="none"
      />
      <path
        d="M62 34 h14 M62 38 h14 M62 42 h9"
        className="stroke-current text-correct-ink"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

/** Panel 4: the three titles, counted. */
function ArtCount() {
  const years = [
    { label: "2010", tone: "text-compute-ink" },
    { label: "2023", tone: "text-compute-ink" },
    { label: "2026", tone: "text-compute-ink" },
  ];
  return (
    <svg viewBox="0 0 96 56" className="h-full w-full" aria-hidden="true">
      <text x="48" y="16" textAnchor="middle" fontSize="14" className="fill-current text-correct-ink">
        {SPAIN_SYSTEM2_TRACE.answer}
      </text>
      {years.map((y, i) => (
        <g key={y.label}>
          <circle cx={20 + i * 28} cy="34" r="5" className={`fill-current ${y.tone}/20`} />
          <circle
            cx={20 + i * 28}
            cy="34"
            r="5"
            className={`stroke-current ${y.tone}`}
            strokeWidth="1"
            fill="none"
          />
          <text
            x={20 + i * 28}
            y="50"
            textAnchor="middle"
            fontSize="7"
            className="fill-current text-ink-muted"
          >
            {y.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

const PANEL_ART = [ArtAmbiguity, ArtCutoff, ArtCheckSource, ArtCount];

export function System2Comic() {
  return (
    <ol
      aria-label="The same reasoning as a four panel strip"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      {SPAIN_SYSTEM2_TRACE.steps.map((step, i) => {
        const Art = PANEL_ART[i];
        return (
          <li key={step.name}>
            <figure className="flex h-full flex-col gap-2 rounded-lg border border-grid bg-surface p-3">
              <span className="text-xs font-eyebrow uppercase tracking-wide text-ink-muted">Step #{i + 1}</span>
              <div className="flex h-20 items-center justify-center rounded border border-grid bg-canvas px-2">
                {Art ? <Art /> : null}
              </div>
              <figcaption className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-ink">{step.name}</span>
                <span className="text-xs leading-snug text-ink-muted">{step.text}</span>
              </figcaption>
            </figure>
          </li>
        );
      })}
    </ol>
  );
}
