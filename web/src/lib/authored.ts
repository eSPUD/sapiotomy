/**
 * Authored, ILLUSTRATIVE content for Act 1 (not digitized from a paper).
 * Clearly separated from the cited curve data so the "no invented numbers"
 * discipline stays intact: these are hand-authored teaching examples, and the
 * UI labels them as such.
 *
 * House rules carried over from the approved prototypes (prototypes/slide-*):
 * no accuracy percentages anywhere in Act 1; the word "inference" never
 * appears in Pages 1-3 copy or data; "training" stays off Page 1 but is
 * central to Pages 2-3 after their refactors (docs/page_2_refactor.md,
 * docs/page_3_refactor.md); copy is em-dash-free.
 */

// --- Page 1: Think Fast, Think Slow (the game) ---------------------------
export interface GameRound {
  prompt: string;
  answer: number;
  /** Grouped display form, e.g. "223,300". */
  display: string;
}

export const GAME_ROUNDS: GameRound[] = [
  { prompt: "2 + 2", answer: 4, display: "4" },
  { prompt: "17 × 24", answer: 408, display: "408" },
  { prompt: "350 × 638", answer: 223300, display: "223,300" },
];

/**
 * The computer's playthrough of the game: a hand-scripted simulation of a
 * human player with ILLUSTRATIVE pacing (instant, then tens of seconds, then
 * minutes). Long rounds are time-compressed on screen behind a fast-forward
 * chip; these seconds are not measurements and the page says so.
 */
export interface ComputerMove {
  /** Index into GAME_ROUNDS. */
  round: number;
  typed: string;
  /** Illustrative wall-clock seconds for the round. */
  seconds: number;
}

export const COMPUTER_SCRIPT: ComputerMove[] = [
  { round: 0, typed: "4", seconds: 1 },
  { round: 1, typed: "408", seconds: 24 },
  { round: 2, typed: "223,300", seconds: 150 },
];

/**
 * Page 1 as an explicit System 1 vs System 2 contrast (Kahneman). One
 * operation, multiplication, at three sizes: a small product recognized whole
 * (System 1), a medium one built step by step (System 2), and a large one
 * neither system does in your head (the ceiling). Authored/illustrative; kept
 * separate from GAME_ROUNDS so the older game data and its consumers stay
 * untouched. The steps are arithmetically checked in act1.test.ts.
 */
export const SYSTEMS = {
  fast: { prompt: "3 × 4", answer: "12" },
  slow: {
    prompt: "17 × 24",
    steps: ["17 × 20 = 340", "17 × 4 = 68", "340 + 68 = 408"],
    answer: "408",
  },
} as const;

/**
 * Six everyday tasks across different topics (perception, language, emotion,
 * arithmetic, motor, deliberation) for the reader to sort into System 1 vs
 * System 2. `system: "fast"` = System 1 (the answer arrives); `"slow"` =
 * System 2 (you have to work for it). Authored/illustrative, after Kahneman.
 */
export interface SortItem {
  id: string;
  text: string;
  system: "fast" | "slow";
}

export const SORTING_ITEMS: SortItem[] = [
  { id: "face", text: "Recognize a friend's face", system: "fast" },
  { id: "salt", text: "Finish the phrase 'salt and ___'", system: "fast" },
  { id: "anger", text: "Hear that a voice is angry", system: "fast" },
  { id: "divide", text: "Divide 156 by 12 in your head", system: "slow" },
  { id: "park", text: "Park a car in a tight space", system: "slow" },
  { id: "compare", text: "Compare two phones for value", system: "slow" },
];

// --- Page 2: Two Systems (the "how many World Cups?" question) ------------
/**
 * The question is REAL and RECENT on purpose (docs/page_2_refactor.md): the
 * FIFA 2026 World Cup final is days old as this deck is built. A reader who
 * followed it counts Spain's titles instantly (System 1); a model whose memory
 * ends before the final counts off stale data and lands exactly one short — it
 * never saw the newest win.
 *
 * !! PLACEHOLDER FACT !! The trap needs Spain to have actually WON the 2026
 * final (their 2nd title, after the real 2010 win). This was authored by a tool
 * whose own training ALSO ends before the final — the page's failure mode, live.
 * Before shipping: verify the 2026 result. If Spain won, `trueCount` is 2 and it
 * ships as-is; if someone else won, swap `country`/`wins` to the real 2026 winner
 * and their true total (the machine still undercounts by one). Chip + footer flag
 * this until confirmed.
 *
 * The machine's reply is an authored EXAMPLE of the ideal System-1 blurt: a flat,
 * confident count off its frozen memory (2010 only -> "one"), wrong by omission.
 * The planned live route swaps it for a real completion from a small open model
 * with no web search; the swap point is fetchMachineReply() in Page2.tsx.
 */
export const SPAIN_WORLD_CUPS = {
  question: "How many World Cups has Spain won?",
  country: "Spain",
  /** Spain's titles as of the 2026 final. 2010 is real; 2026 is the flagged,
   *  verify-before-shipping part — the trap needs Spain to have won it. */
  wins: [2010, 2026],
  /** The answer a reader who kept up would give. */
  trueCount: 2,
  /** The most recent title — so recent the model was sealed before it. */
  latestYear: 2026,
  machine: {
    label: "a small open model",
    cutoffLabel: "memory sealed early 2025",
    constraintLabel: "no web search",
    /** The wins inside the model's frozen memory: everything before the seal. */
    knownWins: [2010],
    /** trueCount - 1: it counts only what it was trained on, missing 2026. */
    answer: 1,
    /**
     * System 1 - the pop: a confident count off the one title it knows, stated
     * as fact and short by one. No hedging — the page's reveal explains why.
     */
    reply: ["One. Spain won it in 2010."],
  },
  /**
   * Page 4, "The Third Option": the SAME question answered in thinking mode.
   * The trace never invents the 2026 title — it recognizes the gap (a recent,
   * post-cutoff result it may be missing), decides not to answer from memory,
   * and checks before committing. That recognition is the whole point: a model
   * that answers on reflex never reaches for the check, even when it could.
   * Authored placeholder EXAMPLE; a live reasoning model replaces it later.
   * (Currently unused by any page: the old Page 4 that rendered it was replaced
   * by "Reasoning: Diverse Pathfinding". Kept, with its guard test, for the
   * planned live-model return.) It names the newest year the blurt omits
   * (2026) and lands on the true count.
   */
  thinking: {
    steps: [
      "Let me not answer on reflex. This asks for a count of titles, and a count like that can change whenever there's a new final.",
      "The newest possibility is recent. My training was sealed in early 2025, so a 2026 result would fall after my cutoff; I could be a title behind.",
      "So I shouldn't count from memory alone. Before I commit, let me check a current source.",
      "The record: Spain won in 2010, and again in 2026.",
    ],
    /** The count it lands on once it has looked — the true total, not the blurt. */
    answer: "Two.",
  },
} as const;

// --- Page 4: Reasoning: Diverse Pathfinding (three roads, one destination) ----
/**
 * Page 1's hardest round (GAME_ROUNDS[2], 350 × 638) solved three ways:
 * standard long multiplication, Japanese line multiplication, and Indian
 * Vedic (the Urdhva-Tiryagbhyam sutra, "vertically and crosswise"). Every
 * number below is DERIVED from the two factors; src/lib/act1.test.ts
 * recomputes each step from the digits, so a typo here fails the tests,
 * never ships. No external citation needed: this is self-verifiable
 * arithmetic, authored as a teaching example.
 *
 * A deliberate beat: the line method's five diagonals and the Vedic method's
 * five columns are the SAME five sums (0, 40, 39, 39, 18), reached by
 * different journeys. Copy in this block stays em-dash-free (house rule) and,
 * like the rest of Act 1, never says the deck's Act 2+ jargon.
 */

export interface MultProblem {
  a: number;
  b: number;
  /** Most-significant digit first. */
  aDigits: readonly number[];
  bDigits: readonly number[];
  answer: number;
  display: string;
}

/** One row of standard long multiplication: a × (digit × placeValue). */
export interface StandardRow {
  say: string;
  digit: number;
  placeValue: number;
  partial: number;
}

/** One place-value column: the digit pairs [aDigit, bDigit] that land on it. */
export interface ColumnStep {
  say: string;
  place: string;
  placeValue: number;
  pairs: readonly (readonly [number, number])[];
  sum: number;
}

/** A Vedic column additionally carries as it goes and writes result digits. */
export interface VedicColumn extends ColumnStep {
  carryIn: number;
  /** What gets written this column (the last column writes everything left). */
  digit: number;
  carryOut: number;
}

export const MULT_METHODS = {
  problem: {
    a: 350,
    b: 638,
    aDigits: [3, 5, 0],
    bDigits: [6, 3, 8],
    answer: GAME_ROUNDS[2].answer,
    display: GAME_ROUNDS[2].display,
  } as MultProblem,

  standard: {
    key: "standard",
    name: "Standard long multiplication",
    origin: "the school algorithm: one partial product per digit, then add",
    limitation:
      "General at any size, but slow: every digit pair gets touched, and every carry is a chance for a digit to slip.",
    rows: [
      { say: "Multiply by the units digit: 350 × 8.", digit: 8, placeValue: 1, partial: 2800 },
      { say: "Multiply by the tens digit: 350 × 30.", digit: 3, placeValue: 10, partial: 10500 },
      { say: "Multiply by the hundreds digit: 350 × 600.", digit: 6, placeValue: 100, partial: 210000 },
    ] as readonly StandardRow[],
    landing: "Add the three partial products.",
  },

  lines: {
    key: "lines",
    name: "Japanese line multiplication",
    origin: "a visual method often taught in East Asia: draw each digit as a bundle of lines, count the crossings",
    limitation:
      "No times tables needed, but big digits mean counting dozens of crossings (5 × 8 alone is 40), and a zero needs a ghost line.",
    diagonals: [
      { say: "Units column: the 0-bundle is a ghost line, so 0 crossings.", place: "units", placeValue: 1, pairs: [[0, 8]], sum: 0 },
      { say: "Tens column: 5 lines cross 8 lines. Count them all: 40 crossings.", place: "tens", placeValue: 10, pairs: [[5, 8], [0, 3]], sum: 40 },
      { say: "Hundreds column: three clusters land here. 24 + 15 + 0 = 39 crossings.", place: "hundreds", placeValue: 100, pairs: [[3, 8], [5, 3], [0, 6]], sum: 39 },
      { say: "Thousands column: two clusters. 9 + 30 = 39 crossings.", place: "thousands", placeValue: 1000, pairs: [[3, 3], [5, 6]], sum: 39 },
      { say: "Ten-thousands column: 3 lines cross 6 lines. 18 crossings.", place: "ten-thousands", placeValue: 10000, pairs: [[3, 6]], sum: 18 },
    ] as readonly ColumnStep[],
    landing: "Read the columns right to left, carrying: 0, 40, 39, 39, 18.",
  },

  vedic: {
    key: "vedic",
    name: "Indian Vedic (Urdhva-Tiryagbhyam)",
    origin: "the 'vertically and crosswise' sutra: one pass, one result digit per column",
    limitation:
      "The fastest road, but the crosswise pattern must be memorized for each size, and the carries stack up in your head.",
    columns: [
      { say: "Units, vertically: 0 × 8 = 0. Write 0.", place: "units", placeValue: 1, pairs: [[0, 8]], sum: 0, carryIn: 0, digit: 0, carryOut: 0 },
      { say: "Tens, crosswise: 5 × 8 + 0 × 3 = 40. Write 0, carry 4.", place: "tens", placeValue: 10, pairs: [[5, 8], [0, 3]], sum: 40, carryIn: 0, digit: 0, carryOut: 4 },
      { say: "Hundreds, three ways: 3 × 8 + 5 × 3 + 0 × 6 = 39, plus the carry makes 43. Write 3, carry 4.", place: "hundreds", placeValue: 100, pairs: [[3, 8], [5, 3], [0, 6]], sum: 39, carryIn: 4, digit: 3, carryOut: 4 },
      { say: "Thousands, crosswise: 3 × 3 + 5 × 6 = 39, plus the carry makes 43. Write 3, carry 4.", place: "thousands", placeValue: 1000, pairs: [[3, 3], [5, 6]], sum: 39, carryIn: 4, digit: 3, carryOut: 4 },
      { say: "Ten-thousands, vertically: 3 × 6 = 18, plus the carry makes 22. Write it all.", place: "ten-thousands", placeValue: 10000, pairs: [[3, 6]], sum: 18, carryIn: 4, digit: 22, carryOut: 0 },
    ] as readonly VedicColumn[],
    landing: "The digits, assembled right to left.",
  },
} as const;

export type MultMethodKey = "standard" | "lines" | "vedic";

// --- Page 5: How to Reason (few-shot chain of thought) ---------------------
/**
 * The toggle demo QUOTES the canonical example from Wei et al. 2022, Figure 1
 * (arXiv:2201.11903): the cafeteria word problem, the standard-prompting blurt
 * ("The answer is 27.", wrong), and the chain-of-thought completion that lands
 * 9. The arithmetic is self-verifiable (23 - 20 + 6) and re-checked in
 * src/lib/act2reason.test.ts. No live model: this is an authored, cited
 * example, and the page's chip says so.
 *
 * `exemplar` is the ONE-SHOT worked example the few-shot prompt prepends — the
 * blue exemplar from the SAME Figure 1: the tennis-ball problem, worked step by
 * step, landing 11 (5 + 2 x 3). The model imitates its reasoning shape on the
 * cafeteria question. Both halves are verbatim from Fig. 1, so the page's
 * "quoted from Wei et al. Fig. 1" chip stays fully accurate.
 */
export const COT_DEMO = {
  question:
    "The cafeteria had 23 apples. If they used 20 to make lunch and bought 6 more, how many apples do they have?",
  start: 23,
  used: 20,
  bought: 6,
  /** The standard-prompting output quoted from the paper's Figure 1: wrong. */
  blurt: "The answer is 27.",
  blurtNumber: 27,
  /** The chain-of-thought completion, quoted from the same figure. */
  steps: [
    "The cafeteria had 23 apples originally.",
    "They used 20 to make lunch. So they had 23 - 20 = 3.",
    "They bought 6 more apples, so they have 3 + 6 = 9.",
  ],
  answer: "The answer is 9.",
  answerNumber: 9,
  /**
   * The prepended one-shot exemplar, quoted from the same Figure 1: a DIFFERENT
   * problem, solved out loud, that the model copies the shape of. Arithmetic
   * (5 + 2 x 3 = 11) is re-checked in src/lib/act2reason.test.ts.
   */
  exemplar: {
    question:
      "Roger has 5 tennis balls. He buys 2 more cans of tennis balls. Each can has 3 tennis balls. How many tennis balls does he have now?",
    steps: [
      "Roger started with 5 balls.",
      "2 cans of 3 tennis balls each is 6 tennis balls.",
      "5 + 6 = 11.",
    ],
    answer: "The answer is 11.",
    answerNumber: 11,
  },
} as const;

// --- Page 6: Thinking Longer (a token budget on the chain) -----------------
/**
 * An authored hard-arithmetic chain for the compute-budget slider: five
 * dependent steps, each landing one intermediate value.
 *
 * UNITS: the cost of a step is its WHITESPACE WORD COUNT, and the field is
 * named `words` because that is literally what it is. It is NOT a tokenizer
 * token count, and the page must not present it as one. A real count is
 * model-specific — it comes from a tokenizer (for Claude, the
 * /v1/messages/count_tokens endpoint), and a string like "2,820." does not
 * split into one token in any BPE vocabulary. Words are used here as a
 * countable stand-in a reader can verify by eye; the page says so on the chip.
 * Every count is re-derived from the step text in src/lib/act2reason.test.ts,
 * so a typo fails the suite rather than shipping.
 *
 * The System-1 blurt is an authored plausible near-miss (a borrow slip in the
 * final subtraction). This is a demonstration, not a measurement; the page
 * leans on the cited s1 result for the measured version of the trade.
 */
export interface BudgetStep {
  text: string;
  /** The intermediate value this step establishes (verified in tests). */
  value: number;
  /**
   * Cost of the step in WORDS (whitespace-split), verified in tests. Not a
   * tokenizer token count — see the units note above.
   */
  words: number;
}

export const THINK_BUDGET = {
  question: "What is 47 × 63 − 29 × 41?",
  answer: 1772,
  display: "1,772",
  /** The zero-budget System-1 blurt: confident, instant, wrong by a borrow. */
  blurt: "1,822",
  blurtNumber: 1822,
  steps: [
    { text: "First product, tens part: 47 × 60 = 2,820.", value: 2820, words: 9 },
    { text: "Ones part: 47 × 3 = 141, so 47 × 63 = 2,961.", value: 2961, words: 13 },
    { text: "Second product, tens part: 29 × 40 = 1,160.", value: 1160, words: 9 },
    { text: "One more 29: 1,160 + 29 = 1,189.", value: 1189, words: 8 },
    { text: "Subtract the products: 2,961 − 1,189 = 1,772.", value: 1772, words: 8 },
  ] as readonly BudgetStep[],
} as const;

// --- Page 7: Frequency Voting (the sampling chamber) ----------------------
/**
 * One word problem with FOUR landing places: the right answer and three
 * distractors, each reachable by a specific, nameable misreading. That shape
 * matters — the anchored self-consistency model (lib/sim SELF_CONSISTENCY_MODEL,
 * calibrated to Wang et al. 2022) samples exactly one correct answer plus three
 * distractors, so every ballot the chamber draws maps onto a real chain a reader
 * can read and judge for themselves.
 *
 * All four arithmetic paths are self-verifiable from the two factors and are
 * recomputed in src/lib/act2vote.test.ts, so a typo here fails the suite rather
 * than shipping. Authored teaching example, not a model transcript; the page
 * says so on the chip.
 *
 * Index 0 MUST be the correct path: lib/sim's answer indices use 0 = correct,
 * 1..D = distractor, and the chamber renders paths[i] for answer index i.
 */
export interface ReasoningPath {
  /** The number this path lands on. */
  answer: number;
  display: string;
  correct: boolean;
  /** One-line label for the tile and the histogram row. */
  gist: string;
  steps: readonly string[];
}

export const SAMPLING_CHAMBER = {
  question:
    "Marta bought 4 boxes of 12 candles. She used 15 of them, then gave away a third of what was left. How many candles does she have now?",
  boxes: 4,
  perBox: 12,
  used: 15,
  answer: 22,
  display: "22",
  paths: [
    {
      answer: 22,
      display: "22",
      correct: true,
      gist: "gives away a third of the remainder",
      steps: [
        "4 boxes of 12 is 4 × 12 = 48 candles.",
        "She used 15, so 48 − 15 = 33 are left.",
        "A third of that remainder is 33 ÷ 3 = 11 given away.",
        "So she keeps 33 − 11 = 22.",
      ],
    },
    {
      answer: 33,
      display: "33",
      correct: false,
      gist: "stops at the remainder, never gives any away",
      steps: [
        "4 × 12 = 48 candles to start.",
        "She used 15 of them: 48 − 15 = 33.",
        "So she has 33 candles.",
      ],
    },
    {
      answer: 17,
      display: "17",
      correct: false,
      gist: "takes the third from the original 48, not the remainder",
      steps: [
        "4 × 12 = 48 candles.",
        "A third of 48 is 16, so she gives away 16.",
        "She also used 15, so 48 − 15 − 16 = 17.",
      ],
    },
    {
      answer: 11,
      display: "11",
      correct: false,
      gist: "reads 'gave away a third' as 'kept a third'",
      steps: [
        "4 × 12 = 48, and 48 − 15 = 33 left.",
        "She is left with a third of them: 33 ÷ 3 = 11.",
      ],
    },
  ] as readonly ReasoningPath[],
} as const;

// --- Page 8: Best-of-N and verifiers (generate, then select) ---------------
/**
 * The lily-pad (doubling) problem — chosen because its wrong answer is not a
 * random slip but an ATTRACTOR: "half the lake in half the days" is what a fast
 * chain reaches, so the wrong answer (day 24) is genuinely the popular one and
 * the right answer (day 47) is the rare one. That is the exact regime where
 * majority voting fails and selection has to do the work, without inventing a
 * pathological example. It also pays back Act 1: this is the System-1 trap, and
 * the exponential twist makes it more than a one-line arithmetic slip.
 *
 * Every answer is checkable by one doubling step (verified in
 * src/lib/act2verifiers.test.ts), which is the page's other point: a verifier's
 * job is easier than a generator's, because checking "does day 47, doubled
 * once, fill the lake on day 48?" is one step, while FINDING day 47 means
 * resisting the "half the days" pull.
 *
 * Index 0 is the correct answer, matching lib/sim's answer-index convention.
 */
export const LILY_PADS = {
  question:
    "A patch of lily pads on a lake doubles in area every day. It covers the whole lake on day 48. On which day is the lake half covered?",
  fullDay: 48,
  halfDay: 47,
  answers: [
    {
      display: "Day 47",
      correct: true,
      gist: "works backward one day: doubling means the day before full is half",
      chain:
        "The pads double each day, so the day before the lake is full it was half full. Full on day 48, so half on day 47.",
      /** One doubling step is all a verifier has to check. */
      check: "day 47 is half; one doubling fills the lake on day 48 ✓",
      checks: true,
    },
    {
      display: "Day 24",
      correct: false,
      gist: "halves the timeline, not the lake (the intuitive leap)",
      chain: "The lake is full on day 48, so it is half covered halfway through, on day 24.",
      check: "day 24 still needs 24 more doublings to fill; that is far less than half ✗",
      checks: false,
    },
    {
      display: "Day 46",
      correct: false,
      gist: "steps back one day too many; that leaves a quarter, not a half",
      chain: "Full on day 48, and half must be a couple of days earlier, so day 46.",
      check: "day 46 doubles to half on day 47, so day 46 is only a quarter ✗",
      checks: false,
    },
  ],
} as const;

// --- Page 9: Outcome vs Process Supervision -------------------------------
/**
 * Three sampled solutions to ONE arithmetic question, chosen so the ORM/PRM
 * contrast has somewhere to bite:
 *
 *   lucky   — the famous "cancel the 6s" fake-cancellation. 16/64 really is
 *             1/4, so the FINAL ANSWER IS RIGHT and an outcome grader signs
 *             off, while the middle step is mathematical nonsense. This is
 *             "right answer, wrong reasoning" in its cleanest known form, and
 *             it is why a teacher makes you show your work.
 *   broken  — a wrong GCD at step 2; every later step is valid GIVEN that
 *             mistake, so the chain reads fluently and lands on 2/8. An
 *             outcome grader can only say "wrong"; a process grader points at
 *             step 2 and the steps after it are not the reader's problem.
 *   clean   — the correct road, for contrast.
 *
 * Every claim here is self-verifiable arithmetic (16/64 = 1/4; gcd(16,64) = 16;
 * 16/8 = 2 and 64/8 = 8) and is recomputed in src/lib/act2verifiers.test.ts.
 * Authored teaching examples, not model transcripts; the page's chip says so.
 */
export interface TraceStep {
  text: string;
  /** Is this step itself valid reasoning? (the process label) */
  ok: boolean;
  /** Shown when a step is flagged — why it is wrong. */
  note?: string;
}

export interface SupervisionTrace {
  key: string;
  label: string;
  /** One-line description of what kind of solution this is. */
  kind: string;
  steps: readonly TraceStep[];
  finalAnswer: string;
  /** Is the FINAL answer right? (the outcome label) */
  outcomeOk: boolean;
  /** What each grader concludes — the whole point of the page. */
  ormVerdict: string;
  prmVerdict: string;
}

export const SUPERVISION = {
  question: "Reduce 16/64 to lowest terms.",
  answer: "1/4",
  traces: [
    {
      key: "lucky",
      label: "Solution A",
      kind: "right answer, wrong reasoning",
      steps: [
        { text: "16/64: I need to simplify this fraction.", ok: true },
        {
          text: "Cancel the 6 on top with the 6 on the bottom.",
          ok: false,
          note: "Not a valid operation. Digits inside a number cannot be cancelled; only common factors of the whole numerator and denominator can.",
        },
        { text: "That leaves 1 over 4.", ok: true, note: "Follows from step 2, which was invalid." },
      ],
      finalAnswer: "1/4",
      outcomeOk: true,
      ormVerdict:
        "Thumbs up. The final answer is 1/4, which is correct, so an outcome grader sees nothing wrong and rewards the whole chain, nonsense step included.",
      prmVerdict:
        "Step 2 is flagged. The answer happens to be right (16/64 really is 1/4), but the method would fail on almost any other fraction; a process grader refuses to reward it.",
    },
    {
      key: "broken",
      label: "Solution B",
      kind: "wrong answer, one broken step",
      steps: [
        { text: "16/64: divide the top and bottom by their greatest common divisor.", ok: true },
        {
          text: "The greatest common divisor of 16 and 64 is 8.",
          ok: false,
          note: "The GCD is 16, not 8. 16 divides 64 exactly four times, so 16 is itself the greatest common divisor.",
        },
        { text: "16 ÷ 8 = 2 and 64 ÷ 8 = 8, so the fraction becomes 2/8.", ok: true, note: "Arithmetic is correct given step 2's wrong divisor." },
        { text: "So 16/64 = 2/8.", ok: true, note: "Follows from step 3; 2/8 is not in lowest terms." },
      ],
      finalAnswer: "2/8",
      outcomeOk: false,
      ormVerdict:
        "Thumbs down. The answer is wrong, but that is all an outcome grader can say. It cannot tell you which of the four steps to fix.",
      prmVerdict:
        "Step 2 is flagged, and only step 2. Steps 3 and 4 are correct arithmetic on a wrong divisor, so the break is localised to one line: exactly the signal you need to fix the chain.",
    },
    {
      key: "clean",
      label: "Solution C",
      kind: "right answer, sound reasoning",
      steps: [
        { text: "16/64: divide the top and bottom by their greatest common divisor.", ok: true },
        { text: "The greatest common divisor of 16 and 64 is 16.", ok: true },
        { text: "16 ÷ 16 = 1 and 64 ÷ 16 = 4.", ok: true },
        { text: "So 16/64 = 1/4, and 1/4 is in lowest terms.", ok: true },
      ],
      finalAnswer: "1/4",
      outcomeOk: true,
      ormVerdict: "Thumbs up. The answer is correct, and this time the chain deserves it.",
      prmVerdict: "Every step passes. Both graders agree, which is what agreement is supposed to look like.",
    },
  ] as readonly SupervisionTrace[],
} as const;

// --- Page 10: Searching Through Thoughts (the Game of 24 instance) ---------
/**
 * The search page needs a problem where BRANCHING is the whole difficulty, not
 * arithmetic. Game of 24 (use each of four numbers exactly once, with + − × ÷,
 * to make 24) is that problem, and it is the task Yao et al. 2023 use for the
 * Tree-of-Thoughts result this page's curve is anchored to — so the interactive
 * and the cited numbers are about the same thing.
 *
 * The instance below is authored, not quoted, and it was CHOSEN by running every
 * strategy in lib/game24.ts over a set of candidates and keeping the one whose
 * outcomes actually differ: greedy dead-ends, a beam of width 1 dead-ends with
 * it, a beam of 2 or more finds the answer, depth-first finds it by backtracking,
 * breadth-first finds it by brute force at roughly six times the cost, and MCTS
 * finds it cheapest of all. Those are measurements of the engine, re-asserted in
 * src/lib/act2search.test.ts, not claims made up to fit the story.
 *
 * The solution is checkable by hand — 2 × 5 = 10, 10 − 6 = 4, 4 × 6 = 24, using
 * each of 2, 5, 6, 6 exactly once — and game24.ts re-derives it by search, so
 * the page never displays a solution it has not actually found.
 *
 * `plainCot` is the contrast case: one cheap chain that commits to a reasonable
 * first move, gets agonisingly close, and cannot back out — which is what a
 * single chain does on a problem that needs backtracking.
 */
export const GAME24 = {
  numbers: [2, 5, 6, 6] as const,
  target: 24,
  /** Human-readable solution; lib/game24 finds it independently. */
  solution: "(2 × 5 − 6) × 6 = 4 × 6 = 24",
  plainCot: {
    steps: [
      "The 6 and the 5 look promising: 6 × 5 = 30, which is close to 24.",
      "That leaves 30, 6 and 2. And 30 − 6 = 24 exactly.",
      "But that uses only three of the numbers; the 2 is still on the table.",
      "Fold the 2 in: 30 − 6 × 2 = 18, and 30 − 6 ÷ 2 = 27. Neither is 24.",
      "I am stuck, and I committed to 6 × 5 four steps ago. Best guess: 30 − 6 = 24.",
    ],
    answer: "24, but using only three of the four numbers (not a valid solution)",
    correct: false,
  },
} as const;
