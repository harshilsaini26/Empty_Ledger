# Learning Map, phase 1: engineering spec

**Status:** approved for build, 29 November 2026
**Product spec:** the "Learning Map spec" Claude Doc (owner: Harshil). This file turns that doc into buildable requirements for phase 1 and records the rules that every later phase inherits.
**Plan that implements it:** `docs/superpowers/plans/2026-11-29-learning-map-phase-1.md`

---

## 1. Problem

Ledger Legends teaches one slice of finance (financial statement analysis) in a fixed order, behind a 60% score gate. A curious beginner can't skip ahead to the question they came with. Learn, Research, Bogleheads, the arcade and the company walkthroughs sit in separate corners with nothing tying them together. Each concept gets one short card and a formula, so someone without the vocabulary has no slower way in.

Phase 1 replaces the fixed path with a **learning map** over the content that already exists, so we can test the riskiest assumption first: that newcomers will steer themselves around a map instead of bouncing off it.

## 2. Goals (phase 1)

1. **The map is the front door.** `/learn` shows all 11 constellations. Every lesson, Research paper, Bogleheads chapter, walkthrough and arcade game is reachable from a star.
2. **Nothing is locked.** Every built star opens from the map. Prerequisites are suggestions.
3. **Three depths per star.** Every built star has Get it (plain words), Work it (steps with numbers) and Prove it (three-option questions with a why on every option).
4. **No one loses progress.** Today's XP, badges, lesson scores and streaks carry over.
5. **We can measure the gate.** A free, cookie-free event counter records first visits, star opens and depth opens, so we can check "70% of first visits open a star within 2 minutes".

## 3. Non-goals (phase 1)

| Not in phase 1 | Why |
|---|---|
| New regions' content (Bonds, Statistics, Economics and the rest) | Phases 2 to 5. Phase 1 tests the map, not breadth. |
| Question-led search, the "what do I already know?" check, spaced review | P1. They need the map to exist first. |
| Accounts or cross-device sync | P2. Progress stays in the browser. The model is versioned so it can move later. |
| An AI explainer at runtime | P2. The site stays static, with no model calls. |
| New arcade games | Phase 3 onward. Existing games are linked from stars. |
| Exam-prep features (mock exams, timers, pass rates) | Never. This is a public learning product. |

## 4. Users

- **Curious professional.** Heard a term and wants the plain answer in a couple of minutes.
- **New investor.** Wants to know what they own, without designing a curriculum.
- **Founder or manager.** Half-knows a concept and wants to jump to the worked example.
- **Ambitious learner.** Wants to see how much of each region they have explored and proven.

## 5. Concepts and vocabulary

| Term | Meaning |
|---|---|
| **Constellation** (code: `Region`) | One of 11 subject areas, drawn as a constellation. |
| **Star** (code: `MapNode`) | One concept, written as a competency ("I can explain why..."). |
| **Depth** | `get`, `work` or `prove`. The three layers of a star. |
| **State** | `unexplored` → `visited` → `practised` → `proven`. Brightness on the map. Never goes down. |
| **Built star** | A star with content. **Charted region** means a region with no built stars yet ("being charted"). |
| **Trail** | A curated route of 4 to 8 stars that starts from a real question and may cross regions. |
| **Activity** | An existing surface linked from a star: an arcade game, a Research paper, a Bogleheads chapter or a company walkthrough. |
| **Hidden tags** | The `cfa` block on each star: the CFA Level I module and outcome IDs it covers. Never rendered. |

### The 11 constellations

| `RegionId` | Learner-facing name | Hidden topic code | Phase |
|---|---|---|---|
| `financial-statements` | Financial Statements | `FSA` | 1 |
| `time-value` | Time Value of Money | `QM` | 2 (one star in phase 1) |
| `statistics` | Statistics for Finance | `QM` | 2 |
| `investing` | How to Think About Investing | `PM` | 4 (three stars in phase 1) |
| `financial-manager` | The Financial Manager | `CF` | 3 (one star in phase 1) |
| `managing-risk` | Managing Risk | `DER` | 4 |
| `stocks` | Stocks and Stock Valuation | `EQ` | 3 (one star in phase 1) |
| `bonds` | Bonds and Bond Valuation | `FI` | 3 |
| `economics` | Economic Foundations | `ECO` | 4 |
| `alternatives` | Alternative Investments | `ALT` | 5 |
| `ethics` | Why Ethics Matter | `ETH` | 5 |

## 6. Requirements: phase 1 (P0)

Each requirement has acceptance criteria. "AC" items are what the plan's tests and manual checks prove.

### R1. The map replaces the learning path at `/learn`

- AC1. `/learn` renders all 11 regions, each with its learner-facing name and a lit count ("3 of 11 stars proven").
- AC2. Selecting a region opens its panel. The panel lists every built star with title, competency line and state. Every star links to `/learn/<id>`.
- AC3. A region with no built stars shows "Being charted", its one-line teaser, and a link to the region's `nearest` built star.
- AC4. Stars are drawn by state: unexplored (outline), visited (dim), practised (accent), proven (highlighter). State is also given in text (`aria-label` and the list view), never by colour alone.
- AC5. Lines join a star to each of its `easierAfter` stars when both are in the same region.
- AC6. At 360 px width the sky fits without horizontal scroll, and every tap target is at least 44 × 44 px. The region panel works with one thumb.
- AC7. A "List view" toggle shows the same regions and stars as nested lists for screen readers and keyboard users. Tab order reaches every region and star. Focus rings use the existing `:focus-visible` style.
- AC8. Works in light and dark themes, with the existing tokens and fonts. No new colour tokens outside `app/globals.css`.

### R2. No locks

- AC1. The 60% gate is gone. `PASS_MARK` and every "Pass lesson N first" string are removed.
- AC2. Every built star's page opens directly, whatever the learner's progress.
- AC3. `easierAfter` shows as "Easier after: X, Y" links on the star page and never blocks entry.

### R3. Star page with three depths

- AC1. Routes: `/learn/<id>` (Get it), `/learn/<id>/work` (Work it) and `/learn/<id>/prove` (Prove it). All three are statically generated. Depth tabs are links, so each depth is reachable directly.
- AC2. **Get it** shows plain-words paragraphs, one analogy, and one visual or interaction. It has no formula symbols, reads at about grade 9 (Flesch-Kincaid ≤ 10), and opening it marks the star `visited`.
- AC3. **Work it** shows each formula as steps (label, formula, inputs, result). Every step's numbers come from an `evaluate` function that a test checks. When the star has drills, they appear as "Try it on real companies" questions using today's drill engine. Finishing Work it marks the star `practised`: either the drills are answered or, with no drills, "Done" is pressed after the last step.
- AC4. **Prove it** asks 3 to 6 questions with exactly three options each. After an answer, the learner sees the why for the option they picked and for the right answer. A score of at least 60% marks the star `proven`. It shows the `<Stamp>` "Proven" moment and awards XP the first time only.
- AC5. A learner can leave at any depth and lose nothing. State never goes down.
- AC6. The star page footer shows **Further reading** (when the star has one) and **Sources** (always at least two).
- AC7. Old lesson URLs `/learn/<lesson-id>` keep working, because migrated stars keep their lesson IDs.

### R4. Existing content becomes stars

- AC1. The 11 lessons become 11 stars in Financial Statements, keeping their IDs.
- AC2. Lesson cards become Get it text (formulas moved out) and Work it steps. Concept questions become Prove it questions, cut from four options to three by dropping the weakest distractor, and each option gets its own why. Drills move into Work it.
- AC3. Six hub stars host the other surfaces:

| Star ID | Region | Activities it links to |
|---|---|---|
| `compounding` | `time-value` | Bogleheads `saving-rate`, `saving-early` |
| `diversification` | `investing` | Research `enhanced-portfolio-optimization` |
| `index-funds` | `investing` | Bogleheads `philosophy`, `start-up-kit`, `humble-arithmetic`, `comparing-investments`; Research `buffetts-alpha` |
| `retirement-spending` | `investing` | Research `retirement-income` |
| `company-worth` | `stocks` | Walkthrough `dcf` |
| `budget-vs-actual` | `financial-manager` | Walkthrough `variance` |

- AC4. The `forecasting` star links walkthrough `model`. Games: `ratio-rush` on `profitability` and `efficiency`, `mystery-ledger` on `income-statement`, `red-flag-hunt` on `earnings-quality` and `distress-scores`, `higher-lower` on `liquidity-solvency`.
- AC5. A test proves that every lesson, paper, chapter, walkthrough and game is linked from at least one star.

### R5. Three trails

| Trail ID | Title (learner-facing) | Stars, in order |
|---|---|---|
| `company-health` | Is this company healthy? | `income-statement`, `balance-sheet`, `cash-flow`, `profitability`, `liquidity-solvency`, `earnings-quality`, `distress-scores` |
| `company-worth` | What is a company worth? | `income-statement`, `cash-flow`, `forecasting`, `compounding`, `company-worth` |
| `beginner-investor` | How should a beginner invest? | `compounding`, `diversification`, `index-funds`, `retirement-spending` |

- AC1. Each trail shows a progress bar (stars at least `visited` over total) and Start or Resume.
- AC2. Starting a trail sets it as the active trail. While a star in the active trail is open, a trail bar shows its position and next star. Leaving to another star keeps the trail and its last position. Resume opens the last star visited in that trail, or the first.
- AC3. A test checks that every trail has 4 to 8 stars and that each star exists and is built.

### R6. Empty-map starting points

- AC1. With no star progress at all, the map shows "Start here" with the three trails as cards, above the sky.
- AC2. After the first star is visited, "Start here" is replaced by "Continue": the active trail's next star, or the most recently visited star.

### R7. Progress migration

- AC1. Progress stays under the localStorage key `ledger-progress-v1` and gains `v: 2`.
- AC2. On load, a v1 record becomes v2 with no loss: for every `lessons[id]`, the star `id` becomes `proven` if the score is at least 0.6, otherwise `practised`. XP, badges, days, games, viewed and calls are untouched.
- AC3. Migration is idempotent: migrating a v2 record changes nothing.
- AC4. Corrupt or unreadable storage starts an empty v2 record, as today.
- AC5. Badges: `three_statements` is earned when `income-statement`, `balance-sheet` and `cash-flow` are proven. `dupont` is earned when `returns-dupont` is proven. `graduate` keeps its ID, is renamed "Statements Lit" and is earned when every built Financial Statements star is proven. Badges already earned are never removed.
- AC6. The map says once, plainly, "Your progress is saved in this browser only", with a dismiss button that remembers the choice.

### R8. Hidden CFA coverage

- AC1. Every star carries `cfa: { module, outcomes, note }`. `module` is an ID from the module registry (for example `FSA.02`), and `outcomes` are IDs like `FSA.02.4` whose number is within that module's outcome count. `note` is our own short paraphrase.
- AC2. The module registry (`lib/map/curriculum.ts`) lists all 102 modules: ID, topic, our paraphrased title and outcome count. The counts sum to 340. It never holds outline text.
- AC3. `npm run coverage:hidden` prints, per topic, the modules with at least one built star over the total, and the outcomes tagged over the total. The output is for us. Nothing imports the registry from `app/` or `components/`.
- AC4. A test fails if `CFA` or `Chartered Financial Analyst` appears in any file under `app/`, `components/`, `content/` or `lib/`, except `lib/map/curriculum.ts` and the tests' own allowlist. The `cfa` field key is lowercase and passes.
- AC5. Today's references are reworded: the home page chip, the learn page header, the lesson subtitle, the two explanations that cite "the CFA curriculum", the About page trademark line and topic note, the Research page disclaimer, and the comment at the top of `lib/learn/lessons.ts` (that file is deleted in R4).

### R9. Further reading, sources and credits

- AC1. Each star may have `furtherReading: { title, url }`, usually an OpenStax section. No OpenStax text, figures or exercises appear in our content.
- AC2. Each star has `sources: SourceRef[]` with at least two distinct register IDs, and at least one is of kind `government` or `university`. A test enforces it.
- AC3. The sources register (`lib/map/sources.ts`) holds each source's ID, title, URL, kind, license note and whether AI may read it (`aiReadable`).
- AC4. `/credits` lists every further-reading book used and every register source used by a built star, with its license note. The About page and the map footer link to it.
- AC5. `content/LICENSE` says the learning content in `content/` is CC BY-SA 4.0. The root `LICENSE` (MIT) still covers the code. The README says so in one line.

### R10. Free analytics

- AC1. When `NEXT_PUBLIC_GOATCOUNTER_CODE` is set, the layout loads GoatCounter's script. When it is unset (local, preview, tests), nothing loads and `track()` does nothing.
- AC2. Events, sent as GoatCounter events with paths under `ev/`:

| Event path | When |
|---|---|
| `ev/map-first-visit` | The map is shown and `firstSeen` was not set (then `firstSeen` is set). |
| `ev/star-open/<source>` | A star page opens. `source` is `map`, `trail`, `continue`, `start-here`, `link` or `direct`. |
| `ev/first-star-under-2m` | The first star ever opened, within 120 s of `firstSeen`. |
| `ev/depth/<depth>` | A depth tab opens (`get`, `work`, `prove`). |
| `ev/proven` | A star becomes proven for the first time. |
| `ev/trail-start/<trail-id>` and `ev/trail-done/<trail-id>` | A trail starts, or its last star is visited. |

- AC3. No cookies, no personal data, and no event carries a learner identifier.

### R11. Financial Statements enrichment (last in phase 1)

Three new stars in Financial Statements, written by us and scoped by OpenStax Finance 2e chapters 4 to 6:

| Star ID | Competency | Further reading |
|---|---|---|
| `cash-vs-accrual` | I can explain why profit and cash are different numbers | §4.1 Cash versus Accrual Accounting |
| `capitalize-or-expense` | I can explain when a cost goes on the balance sheet instead of the income statement | §4.4 When Should a Company Capitalize or Expense an Item? |
| `common-size` | I can read a statement as percentages to compare companies of any size | §5.7 Common-Size Statements |

## 7. Content model

```ts
type RegionId =
  | "financial-statements" | "time-value" | "statistics" | "investing" | "financial-manager"
  | "managing-risk" | "stocks" | "bonds" | "economics" | "alternatives" | "ethics";

type Depth = "get" | "work" | "prove";
type StarState = "unexplored" | "visited" | "practised" | "proven";

interface MapNode {
  id: string;                     // kebab-case, unique across the map; also the URL segment
  region: RegionId;
  title: string;                  // learner-facing, plain words
  competency: string;             // "I can ..." sentence
  summary: string;                // one line for the map
  minutes: number;                // Get it reading time
  aliases: string[];              // everyday phrasings (search is P1; author them now)
  easierAfter: string[];          // star IDs; soft, never a lock
  get: { body: string[]; analogy: string; visual: Visual };
  work: { intro: string; steps: WorkStep[]; drills: string[]; explore?: Explore };
  prove: ProveQ[];                // 3 to 6
  activities: ActivityId[];
  badge?: string;                 // badge earned when this star is proven
  furtherReading?: { title: string; url: string };
  sources: SourceRef[];           // at least 2
  cfa: { module: string; outcomes: string[]; note: string };   // HIDDEN: never rendered
}

interface WorkStep {
  label: string;
  formula: string;                         // shown as typed
  inputs: Record<string, number>;
  unit: "usd" | "pct" | "x" | "plain" | "years";
  evaluate: (inputs: Record<string, number>) => number;   // the test calls this
  result: number;                          // must equal evaluate(inputs) within 0.5%
  note?: string;
}

interface ProveQ { stem: string; options: [Opt, Opt, Opt]; answer: 0 | 1 | 2; level: 1 | 2 | 3 }
interface Opt { text: string; why: string }   // why it's tempting, and why it's right or wrong
interface SourceRef { id: string; checked: string }   // register ID, ISO date checked
interface Explore { ticker: string; tab: string; prompt: string }
type Visual =
  | { kind: "balance-scale" }
  | { kind: "flow"; steps: string[] }
  | { kind: "bars"; caption: string; items: { label: string; value: number }[] }
  | { kind: "growth"; caption: string; rate: number; years: number };
type ActivityId = `game:${string}` | `research:${string}` | `bogleheads:${string}` | `walkthrough:${"dcf" | "model" | "variance"}`;
```

Each star is one file: `content/map/<region>/<id>.ts`, exporting `default` as a `MapNode`. `content/map/index.ts` imports them all and exports `NODES`. Client code never imports star files: it uses `content/map/catalog.ts`, a light list (ID, region, title, competency, easierAfter, badge) that a test keeps in step with `NODES`. Server pages pass each client component a `PublicNode` with the hidden tags and `evaluate` functions stripped.

## 8. Content rules (every phase)

1. **Our own words only.** No OpenStax text, figures or exercises in our content or in an AI prompt. No CFA outline text or sample questions, copied or lightly reworded. The repo stores outcome IDs plus our paraphrase.
2. **Get it reads without finance.** No formula symbols (`=`, `×`, `÷`, `√`, `Σ`, `^`, or digit-operator-digit). Flesch-Kincaid grade ≤ 10. At least one analogy.
3. **Prove it is well formed.** Exactly three options, one answer, a why on every option. With 3 or more questions in a star, each of A, B and C is the answer at least once. Level 3 questions match Level I exam difficulty. Levels 1 and 2 ramp up to it.
4. **Every number is tested.** Each Work it step's `result` equals `evaluate(inputs)` within 0.5%.
5. **Every fact has two sources.** At least two register sources per star, at least one government or university. Sources marked `aiReadable: false` are checked by a person, never given to AI.
6. **Originality check.** `npm run check:originality` compares our text with local OpenStax files (path in `OPENSTAX_DIR`, never committed) and flags any run of 10 or more identical words. It skips with a notice when the folder is absent.
7. **Learner text lives in content files**, not in components, so other languages stay possible.

### How a star gets written and checked

1. **Scope:** the star's outcome IDs and our paraphrase are the brief. The OpenStax section title says what to cover; its text is never in the prompt.
2. **Draft:** write Get it, Work it and Prove it in our voice.
3. **Check facts** against two register sources and record them in `sources` with the date.
4. **Check numbers:** the Work it test covers every step.
5. **Check originality** with the script, when the OpenStax files are available.
6. **Review:** a person reads the star against these rules and its sources before merge.

## 9. Sources register (initial)

| ID | Title | Kind | AI may read |
|---|---|---|---|
| `sec-fs-guide` | SEC, Beginners' Guide to Financial Statements | government | yes |
| `investor-gov-fs` | Investor.gov, How do I look at a company's financial statements? | government | yes |
| `investor-gov-intro` | Investor.gov, Introduction to Investing | government | yes |
| `investor-gov-compound` | Investor.gov, Compound Interest Calculator | government | yes |
| `sec-edgar` | SEC EDGAR company filings | government | yes |
| `mit-15401` | MIT OpenCourseWare 15.401 Finance Theory I (CC BY-NC-SA 4.0) | university | yes |
| `saylor-bus202` | Saylor Academy BUS202 Principles of Finance (CC BY 3.0) | university | yes |
| `nist-handbook` | NIST/SEMATECH e-Handbook of Statistical Methods | government | yes |
| `openintro-stats` | OpenIntro Statistics (CC BY-SA 3.0) | open-text | yes |
| `ifrs-framework` | IFRS Foundation, Conceptual Framework for Financial Reporting | reference | no |
| `bogleheads-wiki` | Bogleheads wiki | reference | no (terms not read) |

Later phases add the rest of the register in the product spec (TreasuryDirect, Federal Reserve Board, BEA, BLS, Investor.gov alternatives bulletins, SEC release IA-5248 and others). An executor who adds a source records its kind and whether its terms allow AI reading. When unsure, they set `aiReadable: false`.

## 10. Success metrics

| Metric | Type | Success | Stretch | Source |
|---|---|---|---|---|
| First visits that open a star within 2 minutes | Leading (the phase 1 gate) | 70% | 80% | `ev/first-star-under-2m` ÷ `ev/map-first-visit` |
| Star opens from map, trail or start-here (not continue) | Leading | 60% | 75% | `ev/star-open/*` |
| Get it readers who open Work it | Leading | 30% | 45% | `ev/depth/work` ÷ `ev/depth/get` |
| First-try Prove it accuracy per star | Calibration | 60 to 80% | | Spot checks; per-star analytics is out of scope |
| Trail completion among starters | Leading | 40% | 55% | `ev/trail-done` ÷ `ev/trail-start` |
| Hidden modules with a built Get it | Internal | +10 per release | +15 | `npm run coverage:hidden` |

Review after 2 weeks and 6 weeks of data. If the gate misses, rework the map's entry (start-here, region panel) before writing more content.

## 11. Rollout

| Phase | Regions | Also |
|---|---|---|
| **1 (this spec)** | Map over existing content; Financial Statements enriched (R11) | Star pages, 3 trails, migration, hidden tags, sources, analytics |
| Gate | 70% of first visits open a star within 2 minutes | |
| 2 | Time Value of Money, Statistics for Finance | Question-led search, "what do I already know?" check |
| 3 | Bonds, Stocks, The Financial Manager | Bond price seesaw, build-the-factory game |
| 4 | Economic Foundations, How to Think About Investing, Managing Risk | Central bank sandbox, payoff builder, spaced review |
| 5 | Alternative Investments, Why Ethics Matter | Judgment Call stories, fee waterfall game |

## 12. Dependencies and decisions

- **PR #7** (DCF, 3-statement and variance walkthroughs) should merge before Task 10 of the plan. The `dcf`, `model` and `variance` report tabs come from it. If it hasn't merged, the plan's fallback applies (see Task 10).
- The arcade stays its own tab and is also linked from stars.
- XP, levels, badges and streaks stay as they are.
- Content license: CC BY-SA 4.0 for `content/`. Code: MIT.
- OpenStax: further-reading links only. Linking to chapter pages that show a "CFA Institute" note is accepted.
- Analytics: GoatCounter (free for non-commercial use, no cookies). Harshil creates the site code and sets `NEXT_PUBLIC_GOATCOUNTER_CODE` in Vercel.

## 13. Open questions

| Question | Who | Blocking? |
|---|---|---|
| GoatCounter site code | Harshil | No. Analytics stays off until it is set. |
| Run the 5-person prototype test before launch? | Harshil | No. The analytics gate stands in if not. |
