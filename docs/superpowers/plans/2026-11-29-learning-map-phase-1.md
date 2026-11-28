# Learning Map, phase 1: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixed 11-lesson path at `/learn` with a constellation map of 11 regions. Every built star gets three depths (Get it, Work it, Prove it), three trails cross the map, today's progress carries over, and hidden CFA coverage is tracked but never shown.

**Architecture:** Star content lives in typed TypeScript files under `content/map/`, one per star. Pure logic lives in `lib/map/` and is unit-tested with vitest: registries, lints, progress model, trails, layout, the public view of a star, analytics paths and coverage. The UI goes in `components/map/` and `components/node/`. Static routes under `app/learn/` read the content at build time and pass only a stripped "public" view of each star to client components. Nothing is computed on a server at runtime, so the site stays a static Vercel deploy.

**Tech Stack:** Next.js 16 (app router, static generation), React 19, TypeScript 5.9, Tailwind 4, vitest 5 (node environment, `tests/**/*.test.ts`), `tsx` (new dev dependency, for two scripts), GoatCounter (optional, script tag).

**Spec:** `docs/superpowers/specs/2026-11-29-learning-map-phase-1-design.md` (requirement IDs R1 to R11 below refer to it). The product reasoning is in the "Learning Map spec" Claude Doc.

## Global Constraints

- Node `>=20` (CI uses Node 24). No new runtime dependencies. The only new dev dependency is `tsx`.
- `npm run lint` (which is `tsc --noEmit`), `npm test` and `npm run build` must pass at the end of every task.
- No learner-visible string may contain `CFA` or `Chartered Financial Analyst`. The only exceptions are `lib/map/curriculum.ts` and the allowlist inside `tests/hidden-cfa.test.ts`.
- `lib/map/curriculum.ts` is never imported from `app/` or `components/`.
- The `cfa` field and `evaluate` functions never reach a client component or the client bundle. Server pages pass `PublicNode` (Task 9). Client components that need the star list (provider, map, dashboard, progress page) import `CATALOG` from `content/map/catalog.ts`, never `content/map/index.ts` or a star file.
- Content rules (spec §8): our own words only; no OpenStax text, figures or exercises in content or in an AI prompt; no CFA outline text or sample questions. Store outcome IDs plus our paraphrase.
- Get it: no formula symbols, Flesch-Kincaid grade ≤ 10, an analogy and a visual.
- Prove it: 3 to 6 questions, exactly 3 options, one answer, a why on every option. With 3 or more questions, each of index 0, 1 and 2 is the answer at least once. At least one question at level 2 or 3.
- Work it: every step's `result` equals `evaluate(inputs)` within 0.5%.
- Sources: at least 2 distinct register IDs per star, at least one of kind `government` or `university`. Sources with `aiReadable: false` are read by a person, never pasted into AI.
- Storage key stays `ledger-progress-v1`. Progress gains `v: 2`. State never goes down.
- XP: `VISIT_XP = 5`, `PRACTISE_XP = 10`, `PROVE_XP = 50`, awarded once per star for the highest state newly reached. Each right Prove it answer still goes through `answer(true)` (10 XP), as today.
- `PROVEN_MARK = 0.6`. It marks a star proven. It is not a lock.
- Design: existing tokens in `app/globals.css`, Bricolage Grotesque for headings, JetBrains Mono for numbers and tags, `<Stamp>` as the signature moment, and `prefers-reduced-motion` respected. Tap targets are at least 44 × 44 CSS px at 360 px width.
- Learner-facing copy follows the house style: plain words, full sentences, no em dashes.
- Commit after every task. Messages use the repo's style (imperative, sentence case), for example `Add the map's region and module registries`.

## Review Focus

1. **Odd stored progress.** A v1 record missing `lessons`, a v2 record holding star IDs that no longer exist, or `nodes` values that are not objects. The app must load without throwing, ignore unknown IDs in every count, and keep everything it can. Tests go in Task 7.
2. **Stale pointers.** `activeTrail` or `lastStar` naming a trail or star that a later build removed. Continue, Resume and the trail bar must skip it and fall back to the start-here state. Tests go in Task 7.
3. **Retaking a proven star and failing.** It stays proven, `best` keeps the higher score, and no XP or `ev/proven` event fires again. Tests go in Task 7, and the handler wiring is in Task 11.
4. **Deep links past Get it.** Opening `/learn/<id>/prove` first must still mark the star at least visited, so the map never shows a proven star that was never visited. Test in Task 7 (`raise` to proven from unexplored), wiring in Task 11.
5. **No JavaScript or blocked storage.** The Get it text must be in the server-rendered HTML, and a browser that throws on `localStorage` (private mode) must still browse the map and stars without saving. Verified in Task 11 (HTML check) and Task 8 (try/catch around every storage call, plus a manual check).

## Executing this plan

- Do the tasks in order. Each one ends green (`lint`, `test`, `build`) and is committed, so you can stop after any task.
- Tasks 5, 6 and 16 are mostly writing. Write one star at a time and run `npx vitest run tests/content.test.ts` after each. When a lint fails, fix the content. Never loosen a lint or a test to get green.
- The tables in this plan are decisions. Copy their values exactly. Where the plan leaves a choice open (wording, small layout details), pick the simplest option that meets the spec and note it in the PR description.
- If a URL in a table is dead, use the fallback the task gives. If there is none, leave the field out and list it in the PR.
- Stop and ask Harshil only for: PR #7 still unmerged when you reach Task 10 and the fallback doesn't fit, a source whose terms you can't determine, or any change to a rule in Global Constraints.

---

## File map

| Path | Responsibility | Task |
|---|---|---|
| `lib/map/types.ts` | All shared types: `RegionId`, `MapNode`, `WorkStep`, `ProveQ`, `Visual`, `ActivityId`, `SourceRef`, `StarState`, `Depth`, `Trail` | 1 |
| `lib/map/regions.ts` | The 11 regions: name, blurb, teaser, sky position, nearest built star | 1 |
| `lib/map/curriculum.ts` | Hidden module registry (102 modules, 340 outcomes) and ID helpers | 1 |
| `lib/map/sources.ts` | Sources register | 2 |
| `lib/map/activities.ts` | Resolve an `ActivityId` to label, href and kind; list every existing surface | 2 |
| `content/LICENSE` | CC BY-SA 4.0 notice for `content/` | 2 |
| `lib/map/lint.ts` | `hasFormulaSymbols`, `fkGrade`, `lintNode` | 3 |
| `content/map/<region>/<id>.ts` | One star per file | 4, 5, 6, 16 |
| `content/map/index.ts` | `NODES`, `nodeById`, `nodesIn`, `toCatalogEntry` (server only) | 4 |
| `content/map/catalog.ts` | `CATALOG`: the light star list for client code (no content, no tags) | 4, 5, 6, 16 |
| `tests/content.test.ts` | Every star passes the lints and cross-references | 4 |
| `lib/map/trails.ts` | The 3 trails | 6 |
| `lib/map/progress-model.ts` | `Progress` type, `EMPTY`, `migrate`, `stateOf`, `raise`, badges, trail and continue helpers | 7 |
| `lib/game/progress.tsx` | Provider wired to the model, with new context methods | 8 |
| `lib/map/public.ts` | `PublicNode` and `toPublic` (strips `cfa`, runs `evaluate`) | 9 |
| `lib/map/format.ts` | `formatValue(value, unit)` for Work it | 9 |
| `components/walkthrough/StepList.tsx` | Generic step list (shared with PR #7's walkthroughs) | 10 |
| `components/QuizCard.tsx` | Gains per-option `whys` | 11 |
| `components/node/*` | Star page: shell, depth tabs, Get it, visuals, Work it, Prove it, trail bar, footer | 11 |
| `app/learn/[id]/page.tsx`, `app/learn/[id]/work/page.tsx`, `app/learn/[id]/prove/page.tsx` | Star routes | 11 |
| `lib/map/layout.ts` | Star positions inside a region on the sky | 12 |
| `components/map/*` | Sky, region panel, list view, start-here/continue, trail cards, storage note | 12 |
| `app/learn/page.tsx` | The map page | 12 |
| `components/HomeDashboard.tsx`, `components/ProgressView.tsx`, `components/FeatureCards.tsx`, `app/page.tsx` | Switched from lessons to stars | 13 |
| `components/LessonRunner.tsx`, `components/LearnPath.tsx`, `lib/learn/lessons.ts` | Deleted | 13 |
| `lib/map/coverage.ts`, `scripts/coverage.ts` | Hidden coverage report | 14 |
| `tests/hidden-cfa.test.ts` | CFA string ban and registry import ban | 14 |
| `app/credits/page.tsx` | Credits page | 15 |
| `lib/analytics.ts`, `app/layout.tsx` | GoatCounter events | 15 |
| `lib/map/originality.ts`, `scripts/originality.ts` | 10-word overlap check | 15 |

---

### Task 1: Types, regions and the hidden module registry

**Files:**
- Create: `lib/map/types.ts`, `lib/map/regions.ts`, `lib/map/curriculum.ts`
- Test: `tests/map-registry.test.ts`

**Interfaces:**
- Produces:
  - `lib/map/types.ts` exports exactly the types in spec §7, plus:
    ```ts
    export const REGION_IDS = ["financial-statements", "time-value", "statistics", "investing", "financial-manager",
      "managing-risk", "stocks", "bonds", "economics", "alternatives", "ethics"] as const;
    export type RegionId = (typeof REGION_IDS)[number];
    export type Visual =
      | { kind: "balance-scale" }
      | { kind: "flow"; steps: string[] }
      | { kind: "bars"; caption: string; items: { label: string; value: number }[] }
      | { kind: "growth"; caption: string; rate: number; years: number };
    export interface Trail { id: string; title: string; question: string; stars: string[] }
    export interface CatalogEntry { id: string; region: RegionId; title: string; competency: string; easierAfter: string[]; badge?: string }
    export const STATE_ORDER = ["unexplored", "visited", "practised", "proven"] as const;
    ```
    `MapNode.get.visual` has type `Visual` (not `VisualId`).
  - `lib/map/regions.ts`: `export interface Region { id: RegionId; name: string; blurb: string; teaser: string; x: number; y: number; nearest: string }`, `export const REGIONS: Region[]` (11, in `REGION_IDS` order), `export const regionById: (id: RegionId) => Region`.
  - `lib/map/curriculum.ts`: `export type TopicCode = "QM" | "ECO" | "CF" | "FSA" | "EQ" | "FI" | "DER" | "ALT" | "PM" | "ETH"`, `export interface Module { id: string; topic: TopicCode; title: string; outcomes: number }`, `export const MODULES: Module[]`, `export const moduleById(id: string): Module | undefined`, `export const isOutcomeId(id: string): boolean` (true when `id` is `<module id>.<n>` with `1 ≤ n ≤ outcomes`).

- [ ] **Step 1: Start from an up-to-date main**

Run: `git fetch origin && git status && npm ci && npm test`
Expected: clean tree, 57 tests pass (the count when this plan was written; any higher number is fine if all pass).

- [ ] **Step 2: Write the failing test** `tests/map-registry.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { REGION_IDS } from "../lib/map/types";
import { REGIONS } from "../lib/map/regions";
import { MODULES, isOutcomeId, moduleById } from "../lib/map/curriculum";

describe("regions", () => {
  it("has the 11 constellations in order", () => {
    expect(REGIONS.map((r) => r.id)).toEqual([...REGION_IDS]);
    expect(REGIONS.map((r) => r.name)).toEqual([
      "Financial Statements", "Time Value of Money", "Statistics for Finance", "How to Think About Investing",
      "The Financial Manager", "Managing Risk", "Stocks and Stock Valuation", "Bonds and Bond Valuation",
      "Economic Foundations", "Alternative Investments", "Why Ethics Matter",
    ]);
  });
  it("places every region inside the 1000 x 640 sky with room for its hit area", () => {
    for (const r of REGIONS) {
      expect(r.x).toBeGreaterThanOrEqual(70);
      expect(r.x).toBeLessThanOrEqual(930);
      expect(r.y).toBeGreaterThanOrEqual(70);
      expect(r.y).toBeLessThanOrEqual(570);
    }
  });
});

describe("hidden module registry", () => {
  it("lists 102 modules and 340 outcomes", () => {
    expect(MODULES).toHaveLength(102);
    expect(MODULES.reduce((s, m) => s + m.outcomes, 0)).toBe(340);
  });
  it("has the per-topic totals", () => {
    const by = (t: string) => MODULES.filter((m) => m.topic === t);
    const outcomes = (t: string) => by(t).reduce((s, m) => s + m.outcomes, 0);
    expect([by("FSA").length, outcomes("FSA")]).toEqual([12, 53]);
    expect([by("FI").length, outcomes("FI")]).toEqual([19, 51]);
    expect([by("PM").length, outcomes("PM")]).toEqual([6, 40]);
    expect([by("EQ").length, outcomes("EQ")]).toEqual([12, 37]);
    expect([by("ETH").length, outcomes("ETH")]).toEqual([10, 33]);
    expect([by("QM").length, outcomes("QM")]).toEqual([11, 30]);
    expect([by("ECO").length, outcomes("ECO")]).toEqual([8, 30]);
    expect([by("CF").length, outcomes("CF")]).toEqual([7, 22]);
    expect([by("DER").length, outcomes("DER")]).toEqual([10, 22]);
    expect([by("ALT").length, outcomes("ALT")]).toEqual([7, 22]);
  });
  it("validates outcome IDs against the module's count", () => {
    expect(moduleById("FSA.02")?.outcomes).toBe(5);
    expect(isOutcomeId("FSA.02.4")).toBe(true);
    expect(isOutcomeId("FSA.02.6")).toBe(false);
    expect(isOutcomeId("FSA.13.1")).toBe(false);
    expect(isOutcomeId("FSA.02")).toBe(false);
  });
});
```

- [ ] **Step 3: Run it to see it fail**

Run: `npx vitest run tests/map-registry.test.ts`
Expected: FAIL, cannot resolve `../lib/map/types`.

- [ ] **Step 4: Create `lib/map/types.ts`** with the types from spec §7 and the Interfaces block above.

- [ ] **Step 5: Create `lib/map/regions.ts`** with this data. `blurb` shows on built regions and `teaser` on charted ones. `nearest` is a star built in phase 1.

| id | name | x | y | nearest | blurb | teaser |
|---|---|---|---|---|---|---|
| financial-statements | Financial Statements | 180 | 170 | income-statement | How to read what a company reports, and what the numbers say about its health. | (same as blurb) |
| time-value | Time Value of Money | 420 | 110 | compounding | Why a dollar today is worth more than a dollar next year, and how that shapes every price. | Compounding, discounting, loans and annuities, one picture at a time. |
| statistics | Statistics for Finance | 650 | 140 | diversification | How to describe risk with numbers, and when a pattern is real. | How to describe risk with numbers, and when a pattern is real. |
| investing | How to Think About Investing | 860 | 230 | index-funds | Risk, return and the simple habits that decide most investors' results. | (same as blurb) |
| financial-manager | The Financial Manager | 300 | 330 | budget-vs-actual | How a company plans, funds its day-to-day cash and picks its projects. | (same as blurb) |
| managing-risk | Managing Risk | 560 | 300 | diversification | How companies protect themselves against swings in prices, rates and currencies. | How companies protect themselves against swings in prices, rates and currencies. |
| stocks | Stocks and Stock Valuation | 780 | 420 | company-worth | What a share is, how markets price it, and how to estimate what a company is worth. | (same as blurb) |
| bonds | Bonds and Bond Valuation | 520 | 500 | compounding | Why bond prices fall when interest rates rise, and what a yield really tells you. | Why bond prices fall when interest rates rise, and what a yield really tells you. |
| economics | Economic Foundations | 220 | 520 | compounding | What central banks do, and how booms, busts and trade move markets. | What central banks do, and how booms, busts and trade move markets. |
| alternatives | Alternative Investments | 880 | 560 | index-funds | Private equity, property, hedge funds and crypto: what they are and what they cost. | Private equity, property, hedge funds and crypto: what they are and what they cost. |
| ethics | Why Ethics Matter | 80 | 360 | earnings-quality | Why trust is the whole business, and what you owe the people whose money you handle. | Why trust is the whole business, and what you owe the people whose money you handle. |

Write "(same as blurb)" rows with the blurb text repeated in `teaser`.

- [ ] **Step 6: Create `lib/map/curriculum.ts`**

Start the file with this comment: `// INTERNAL. The hidden coverage checklist. Titles are our own paraphrase; no outline text lives here. Never import this from app/ or components/.` Then add the data below as `MODULES`, with `id` built as `<topic>.<two-digit number>` (for example `FSA.02`).

| Topic | # | Our title | Outcomes |
|---|---|---|---|
| QM | 01 | What returns are and what they're made of | 2 |
| QM | 02 | Kinds of return and how to calculate them | 1 |
| QM | 03 | Comparing returns with benchmarks and indexes | 2 |
| QM | 04 | Valuing future cash flows today | 3 |
| QM | 05 | Describing returns: centre, spread, shape and co-movement | 4 |
| QM | 06 | Probability distributions for prices and returns | 4 |
| QM | 07 | Sampling, confidence and testing ideas with data | 3 |
| QM | 08 | A portfolio's return and risk | 3 |
| QM | 09 | Simulating prices and returns | 3 |
| QM | 10 | Fitting a straight line to financial data | 4 |
| QM | 11 | Data science and AI in investing | 1 |
| ECO | 01 | How firms compete in different market structures | 5 |
| ECO | 02 | The business cycle and how we measure it | 3 |
| ECO | 03 | Government taxing and spending | 4 |
| ECO | 04 | Central banks and interest rates | 4 |
| ECO | 05 | Geopolitics and the institutions of world trade | 6 |
| ECO | 06 | Why countries trade, and barriers to trade | 3 |
| ECO | 07 | Capital flows and currency markets | 3 |
| ECO | 08 | Working with exchange rates | 2 |
| CF | 01 | Business forms and who owns companies | 3 |
| CF | 02 | Lenders, shareholders and other stakeholders | 3 |
| CF | 03 | Governance: conflicts and how companies manage them | 3 |
| CF | 04 | Working capital and staying liquid | 3 |
| CF | 05 | Choosing which projects to invest in | 4 |
| CF | 06 | Mixing debt and equity | 4 |
| CF | 07 | How businesses make money | 2 |
| FSA | 01 | What financial analysis is for and where its information comes from | 5 |
| FSA | 02 | Reading the income statement | 5 |
| FSA | 03 | Reading the balance sheet | 5 |
| FSA | 04 | Building and linking the cash flow statement | 4 |
| FSA | 05 | Analysing cash flows and free cash flow | 2 |
| FSA | 06 | Inventory accounting and its effects | 3 |
| FSA | 07 | Long-lived and intangible assets | 3 |
| FSA | 08 | Leases, pensions and pay in shares | 3 |
| FSA | 09 | Income taxes in the accounts | 4 |
| FSA | 10 | How trustworthy the numbers are | 8 |
| FSA | 11 | Ratio analysis and DuPont | 6 |
| FSA | 12 | Building a simple forecast model | 5 |
| EQ | 01 | What a share is | 2 |
| EQ | 02 | Share classes and voting | 2 |
| EQ | 03 | How shares are issued and traded | 4 |
| EQ | 04 | Where shareholders' returns come from | 3 |
| EQ | 05 | Price versus value | 3 |
| EQ | 06 | Valuing a company from its future cash | 4 |
| EQ | 07 | Valuing with multiples and peers | 4 |
| EQ | 08 | Forecast models for valuation | 3 |
| EQ | 09 | Sizing up an industry | 4 |
| EQ | 10 | Sizing up a company | 3 |
| EQ | 11 | Reading an analyst's report | 3 |
| EQ | 12 | Required return from risk models | 2 |
| FI | 01 | What a bond is | 2 |
| FI | 02 | Bond cash flows and bond types | 2 |
| FI | 03 | How bonds are issued and traded | 3 |
| FI | 04 | Company borrowing markets | 3 |
| FI | 05 | Government borrowing markets | 2 |
| FI | 06 | Bond prices and yields | 3 |
| FI | 07 | Yield and spread measures for fixed-rate bonds | 2 |
| FI | 08 | Yield and spread measures for floating-rate debt | 2 |
| FI | 09 | The yield curve: spot, par and forward rates | 3 |
| FI | 10 | How rate changes affect bond returns | 3 |
| FI | 11 | Duration | 2 |
| FI | 12 | Convexity and portfolio measures | 3 |
| FI | 13 | Curve-based and real-world risk measures | 4 |
| FI | 14 | Credit risk basics | 3 |
| FI | 15 | Lending to governments: credit analysis | 1 |
| FI | 16 | Lending to companies: credit analysis | 3 |
| FI | 17 | Pooling loans into securities | 2 |
| FI | 18 | Asset-backed securities | 4 |
| FI | 19 | Mortgage-backed securities | 4 |
| DER | 01 | What derivatives are and where they trade | 2 |
| DER | 02 | Forwards, futures, swaps and options | 3 |
| DER | 03 | Who uses derivatives and why | 2 |
| DER | 04 | Arbitrage, replication and carrying costs | 2 |
| DER | 05 | Pricing forward contracts | 2 |
| DER | 06 | Pricing futures | 2 |
| DER | 07 | Pricing swaps | 2 |
| DER | 08 | What drives option values | 3 |
| DER | 09 | Put-call parity | 2 |
| DER | 10 | A one-step binomial option model | 2 |
| ALT | 01 | What makes an investment "alternative" | 3 |
| ALT | 02 | Measuring alternative returns and fees | 2 |
| ALT | 03 | Private equity and private debt | 3 |
| ALT | 04 | Real estate and infrastructure | 4 |
| ALT | 05 | Commodities, farmland and timber | 3 |
| ALT | 06 | Hedge funds | 3 |
| ALT | 07 | Digital assets | 4 |
| PM | 01 | Risk, return and diversification | 7 |
| PM | 02 | Market risk, CAPM and performance measures | 9 |
| PM | 03 | The portfolio approach and the asset management industry | 6 |
| PM | 04 | Planning a portfolio around goals and limits | 8 |
| PM | 05 | Behavioural biases | 3 |
| PM | 06 | Managing risk | 7 |
| ETH | 01 | Ethics and trust in investing | 8 |
| ETH | 02 | The profession's code and standards | 3 |
| ETH | 03 | Professionalism | 3 |
| ETH | 04 | Fair and honest markets | 3 |
| ETH | 05 | Duties to clients | 3 |
| ETH | 06 | Duties to employers | 3 |
| ETH | 07 | Research and recommendations | 3 |
| ETH | 08 | Conflicts of interest | 3 |
| ETH | 09 | Responsibilities of members and candidates | 2 |
| ETH | 10 | Applying the standards | 2 |

- [ ] **Step 7: Run the test**

Run: `npx vitest run tests/map-registry.test.ts && npm run lint`
Expected: PASS, and no type errors.

- [ ] **Step 8: Commit**

```bash
git add lib/map tests/map-registry.test.ts
git commit -m "Add the map's region and hidden module registries"
```

---

### Task 2: Sources register, activities and the content license

**Files:**
- Create: `lib/map/sources.ts`, `lib/map/activities.ts`, `content/LICENSE`
- Modify: `README.md` (one line under the existing license note, or a new "License" heading at the end)
- Test: `tests/map-registry.test.ts` (extend)

**Interfaces:**
- Consumes: `ActivityId` from Task 1. `GAMES` from `components/games/registry.ts`, `PAPERS` from `lib/research/papers.ts`, `CHAPTERS` from `lib/bogleheads/chapters.ts`.
- Produces:
  - `export type SourceKind = "government" | "university" | "open-text" | "reference"`
  - `export interface Source { id: string; title: string; url: string; kind: SourceKind; license: string; aiReadable: boolean }`
  - `export const SOURCES: Source[]` and `export const sourceById: (id: string) => Source | undefined`
  - `export interface Activity { id: ActivityId; kind: "game" | "research" | "bogleheads" | "walkthrough"; label: string; href: string; blurb: string }`
  - `export function activity(id: string): Activity | undefined`
  - `export const ALL_ACTIVITY_IDS: ActivityId[]` (every game, paper, chapter and walkthrough that exists)

- [ ] **Step 1: Add failing tests** to `tests/map-registry.test.ts`

```ts
import { SOURCES, sourceById } from "../lib/map/sources";
import { ALL_ACTIVITY_IDS, activity } from "../lib/map/activities";

describe("sources register", () => {
  it("has unique IDs, https URLs and a known kind", () => {
    expect(new Set(SOURCES.map((s) => s.id)).size).toBe(SOURCES.length);
    for (const s of SOURCES) {
      expect(s.url).toMatch(/^https:\/\//);
      expect(["government", "university", "open-text", "reference"]).toContain(s.kind);
    }
  });
  it("marks sources whose terms bar or don't mention AI reading", () => {
    expect(sourceById("ifrs-framework")?.aiReadable).toBe(false);
    expect(sourceById("bogleheads-wiki")?.aiReadable).toBe(false);
    expect(sourceById("sec-fs-guide")?.aiReadable).toBe(true);
  });
});

describe("activities", () => {
  it("covers every game, paper, chapter and walkthrough", () => {
    expect(ALL_ACTIVITY_IDS).toHaveLength(4 + 3 + 6 + 3);
    expect(activity("game:ratio-rush")?.href).toBe("/play/ratio-rush");
    expect(activity("research:buffetts-alpha")?.href).toBe("/research/buffetts-alpha");
    expect(activity("bogleheads:saving-early")?.href).toBe("/bogleheads/saving-early");
    expect(activity("walkthrough:dcf")?.href).toBe("/company/NIMBUS?tab=dcf");
    expect(activity("game:nope")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run tests/map-registry.test.ts`
Expected: FAIL on the missing modules.

- [ ] **Step 3: Create `lib/map/sources.ts`** with these entries. Open every URL in a browser or with `curl -sIL <url> | head -1` before committing, and fix any that moved.

| id | title | url | kind | license | aiReadable |
|---|---|---|---|---|---|
| sec-fs-guide | SEC, Beginners' Guide to Financial Statements | https://www.sec.gov/about/reports-publications/beginners-guide-financial-statements | government | US government work, public domain | true |
| investor-gov-fs | Investor.gov, How do I look at a company's financial statements? | https://www.investor.gov/introduction-investing/investing-basics/glossary/how-do-i-look-companys-financial-statements | government | US government work, public domain | true |
| investor-gov-intro | Investor.gov, Introduction to Investing | https://www.investor.gov/introduction-investing | government | US government work, public domain | true |
| investor-gov-compound | Investor.gov, Compound Interest Calculator | https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator | government | US government work, public domain | true |
| sec-edgar | SEC EDGAR company filings | https://www.sec.gov/edgar/search/ | government | US government work, public domain | true |
| mit-15401 | MIT OpenCourseWare, 15.401 Finance Theory I | https://ocw.mit.edu/courses/15-401-finance-theory-i-fall-2008/ | university | CC BY-NC-SA 4.0; OCW terms allow non-commercial AI use with attribution | true |
| saylor-bus202 | Saylor Academy, BUS202 Principles of Finance | https://learn.saylor.org/course/BUS202 | university | CC BY 3.0 for Saylor-authored material | true |
| nist-handbook | NIST/SEMATECH e-Handbook of Statistical Methods | https://www.itl.nist.gov/div898/handbook/ | government | US government work, public domain | true |
| openintro-stats | OpenIntro Statistics | https://www.openintro.org/book/os/ | open-text | CC BY-SA 3.0 | true |
| ifrs-framework | IFRS Foundation, Conceptual Framework for Financial Reporting | https://www.ifrs.org/issued-standards/list-of-standards/conceptual-framework.html | reference | © IFRS Foundation; free to read, terms bar automated collection | false |
| bogleheads-wiki | Bogleheads wiki | https://www.bogleheads.org/wiki/Main_Page | reference | Terms not yet read | false |

- [ ] **Step 4: Create `lib/map/activities.ts`**

Build the list from the existing registries, so a new game or paper shows up automatically:
- `game:<id>` for each of `GAMES`: label is the game's `name`, href is `/play/<id>`, and blurb is its `pitch`.
- `research:<id>` for each of `PAPERS`: label is the paper's title field, href is `/research/<id>`.
- `bogleheads:<id>` for each of `CHAPTERS`: label is the chapter's title field, href is `/bogleheads/<id>`.
- `walkthrough:dcf` is "Price a company (DCF)", `walkthrough:model` is "Build a 3-statement model" and `walkthrough:variance` is "Budget versus actual". Each href is `/company/NIMBUS?tab=<dcf|model|variance>`.

Read `lib/research/papers.ts` and `lib/bogleheads/chapters.ts` for the exact name of their title and one-line summary fields before writing this.

- [ ] **Step 5: Create `content/LICENSE`**

```text
Learning content in this folder (content/) is licensed under the Creative Commons
Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0).
https://creativecommons.org/licenses/by-sa/4.0/

Copyright (c) 2026 Harshil26 and contributors.

You may share and adapt it, including commercially, as long as you give credit
and release your changes under the same license. The code elsewhere in this
repository is under the MIT License (see ../LICENSE).
```

Add one line to `README.md`: `Learning content in content/ is CC BY-SA 4.0 (see content/LICENSE). The code is MIT.`

- [ ] **Step 6: Run the tests**

Run: `npx vitest run tests/map-registry.test.ts && npm run lint`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/map content/LICENSE README.md tests/map-registry.test.ts
git commit -m "Add the sources register, the activity index and the content license"
```

---

### Task 3: Content lints

**Files:**
- Create: `lib/map/lint.ts`
- Test: `tests/lint.test.ts`

**Interfaces:**
- Consumes: `MapNode` (Task 1), `sourceById` (Task 2), `isOutcomeId`, `moduleById` (Task 1), `activity` (Task 2).
- Produces:
  - `export function hasFormulaSymbols(text: string): boolean` is true for any of `= × ÷ √ Σ ∑ ^` or a digit, optional spaces, one of `+ - − * /`, optional spaces, and a digit.
  - `export function fkGrade(text: string): number` returns the Flesch-Kincaid grade: `0.39 × (words / sentences) + 11.8 × (syllables / words) − 15.59`. Syllables are vowel groups (`[aeiouy]+`) per word, minus one for a trailing silent `e`, with a minimum of 1. Sentences split on `.`, `!` and `?`, with a minimum of 1.
  - `export function lintNode(node: MapNode): string[]` returns one plain message per broken rule, or an empty array when the star is clean.

- [ ] **Step 1: Write the failing tests** in `tests/lint.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { fkGrade, hasFormulaSymbols, lintNode } from "../lib/map/lint";
import type { MapNode } from "../lib/map/types";

const good: MapNode = {
  id: "test-star", region: "financial-statements", title: "A test star", competency: "I can test things",
  summary: "A star for tests.", minutes: 3, aliases: ["test"], easierAfter: [],
  get: { body: ["A plain sentence about money.", "Another short one."], analogy: "It is like a jar of coins.", visual: { kind: "balance-scale" } },
  work: { intro: "Two steps.", drills: [], steps: [
    { label: "Add", formula: "A + B", inputs: { A: 1, B: 2 }, unit: "plain", evaluate: (i) => i.A + i.B, result: 3 },
  ] },
  prove: [
    { stem: "Q1?", answer: 0, level: 1, options: [{ text: "a", why: "w" }, { text: "b", why: "w" }, { text: "c", why: "w" }] },
    { stem: "Q2?", answer: 1, level: 2, options: [{ text: "a", why: "w" }, { text: "b", why: "w" }, { text: "c", why: "w" }] },
    { stem: "Q3?", answer: 2, level: 3, options: [{ text: "a", why: "w" }, { text: "b", why: "w" }, { text: "c", why: "w" }] },
  ],
  activities: ["game:ratio-rush"],
  sources: [{ id: "sec-fs-guide", checked: "2026-11-29" }, { id: "investor-gov-fs", checked: "2026-11-29" }],
  cfa: { module: "FSA.02", outcomes: ["FSA.02.1"], note: "revenue recognition" },
};

describe("formula symbols", () => {
  it("flags maths and leaves plain words alone", () => {
    expect(hasFormulaSymbols("Revenue = price x units")).toBe(true);
    expect(hasFormulaSymbols("about 3 / 4 of it")).toBe(true);
    expect(hasFormulaSymbols("growth^2")).toBe(true);
    expect(hasFormulaSymbols("A well-run shop keeps 3 months of cash.")).toBe(false);
  });
});

describe("reading grade", () => {
  it("scores simple text low and dense text high", () => {
    expect(fkGrade("The cat sat on the mat. It was warm.")).toBeLessThan(3);
    expect(fkGrade("Notwithstanding considerable methodological heterogeneity, comprehensive international accounting harmonization initiatives substantially improved comparability.")).toBeGreaterThan(14);
  });
});

describe("lintNode", () => {
  it("passes a clean star", () => {
    expect(lintNode(good)).toEqual([]);
  });
  it("catches a formula in Get it", () => {
    expect(lintNode({ ...good, get: { ...good.get, body: ["Profit = revenue - costs"] } })).toContain("Get it has formula symbols");
  });
  it("catches a missing why", () => {
    const bad = { ...good, prove: [{ ...good.prove[0], options: [{ text: "a", why: "" }, { text: "b", why: "w" }, { text: "c", why: "w" }] }, ...good.prove.slice(1)] } as MapNode;
    expect(lintNode(bad)).toContain('Prove it question 1 option 1 has no why');
  });
  it("needs answers spread across A, B and C", () => {
    const same = { ...good, prove: good.prove.map((q) => ({ ...q, answer: 0 as const })) };
    expect(lintNode(same)).toContain("Prove it answers must use each of A, B and C at least once");
  });
  it("needs a step whose result matches evaluate", () => {
    const off = { ...good, work: { ...good.work, steps: [{ ...good.work.steps[0], result: 4 }] } };
    expect(lintNode(off)).toContain('Work it step "Add" says 4 but evaluates to 3');
  });
  it("needs two sources with one government or university source", () => {
    expect(lintNode({ ...good, sources: [{ id: "sec-fs-guide", checked: "2026-11-29" }] })).toContain("Needs at least 2 sources");
    expect(lintNode({ ...good, sources: [{ id: "openintro-stats", checked: "2026-11-29" }, { id: "ifrs-framework", checked: "2026-11-29" }] })).toContain("Needs a government or university source");
  });
  it("checks hidden tags and activities exist", () => {
    expect(lintNode({ ...good, cfa: { ...good.cfa, outcomes: ["FSA.02.9"] } })).toContain("Unknown outcome FSA.02.9");
    expect(lintNode({ ...good, activities: ["game:nope" as never] })).toContain("Unknown activity game:nope");
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run tests/lint.test.ts`
Expected: FAIL, cannot resolve `../lib/map/lint`.

- [ ] **Step 3: Implement `lib/map/lint.ts`.** `lintNode` checks, with exactly these messages (the tests match them):
  - `id` is kebab-case (`/^[a-z0-9]+(-[a-z0-9]+)*$/`), else `Bad id <id>`.
  - `Get it has formula symbols`: any `get.body` paragraph or `get.analogy` fails `hasFormulaSymbols`.
  - `Get it reads above grade 10 (<n>)`: `fkGrade` of the body joined with spaces is above 10, with `<n>` to one decimal.
  - `Get it needs an analogy`: `analogy` is empty.
  - `Prove it needs 3 to 6 questions`.
  - `Prove it question <q> needs exactly 3 options` and `Prove it question <q> option <o> has no why` (1-based numbers).
  - `Prove it answers must use each of A, B and C at least once` (only when there are 3 or more questions).
  - `Prove it needs a level 2 or 3 question`.
  - `Work it step "<label>" says <result> but evaluates to <value>` when `|evaluate(inputs) − result| > 0.005 × max(1, |result|)`. Print both numbers with `Number(x.toFixed(4))`.
  - `Needs at least 2 sources` (distinct IDs), `Unknown source <id>`, `Needs a government or university source`.
  - `Unknown module <id>` and `Unknown outcome <id>` via `moduleById` and `isOutcomeId`.
  - `Unknown activity <id>` via `activity`.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/lint.test.ts && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/map/lint.ts tests/lint.test.ts
git commit -m "Add the content lints for stars"
```

---

### Task 4: The content index and the first two stars

**Files:**
- Create: `content/map/financial-statements/income-statement.ts`, `content/map/financial-statements/balance-sheet.ts`, `content/map/index.ts`, `content/map/catalog.ts`
- Test: `tests/content.test.ts`

**Interfaces:**
- Consumes: `MapNode` (Task 1), `lintNode` (Task 3), `REGION_IDS` (Task 1).
- Produces: `content/map/index.ts` exports `NODES: MapNode[]`, `nodeById(id: string): MapNode | undefined`, `nodesIn(region: RegionId): MapNode[]` and `toCatalogEntry(n: MapNode): CatalogEntry` (copies `id`, `region`, `title`, `competency`, `easierAfter` and `badge` when set). `content/map/catalog.ts` exports `CATALOG: CatalogEntry[]`, written by hand in the same order as `NODES`, importing nothing but the type. Each star file has `export default` of a `MapNode`, typed with `satisfies MapNode`.

**How to migrate a lesson into a star** (this task and Task 5 follow it):
1. Copy the lesson's `id`, `title` and `summary` from `lib/learn/lessons.ts`. Its `minutes` becomes the Get it reading time.
2. Write `competency` as an "I can ..." sentence.
3. **Get it:** rewrite the lesson's cards as 2 to 4 short paragraphs with no formula symbols. Add one everyday analogy and pick a `Visual`.
4. **Work it:** turn each card formula into one or more `WorkStep`s with small round numbers. Write `evaluate` from the formula. Copy `drills` and `explore` unchanged.
5. **Prove it:** take the lesson's concept questions. Drop the weakest distractor so 3 options remain, then write a `why` for every option: why it's tempting, and why it's right or wrong. Add questions until there are at least 3, and include one at level 2 or 3. Reorder options so A, B and C are each the answer at least once.
6. Set `cfa`, `furtherReading`, `sources`, `activities`, `easierAfter` and `badge` from the table in Task 5.
7. Fact-check each claim against the two sources, record today's date in `checked`, and run the lints.

- [ ] **Step 1: Write the failing test** `tests/content.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { NODES, nodeById, toCatalogEntry } from "../content/map";
import { CATALOG } from "../content/map/catalog";
import { lintNode } from "../lib/map/lint";
import { REGION_IDS } from "../lib/map/types";

describe("map content", () => {
  it("keeps the client catalog in step with the content", () => {
    expect(CATALOG).toEqual(NODES.map(toCatalogEntry));
  });
  it("has unique star IDs", () => {
    expect(new Set(NODES.map((n) => n.id)).size).toBe(NODES.length);
  });
  it.each(NODES.map((n) => [n.id, n] as const))("%s passes every lint", (_id, n) => {
    expect(lintNode(n)).toEqual([]);
  });
  it("links easierAfter only to stars that exist", () => {
    for (const n of NODES) for (const e of n.easierAfter) expect(nodeById(e), `${n.id} -> ${e}`).toBeDefined();
  });
  it("puts every star in a known region", () => {
    for (const n of NODES) expect(REGION_IDS).toContain(n.region);
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run tests/content.test.ts`
Expected: FAIL, cannot resolve `../content/map`.

- [ ] **Step 3: Create `content/map/financial-statements/income-statement.ts`** with this content. It is the model for every other star's tone, length and structure.

```ts
import type { MapNode } from "@/lib/map/types";

export default {
  id: "income-statement",
  region: "financial-statements",
  title: "The Income Statement",
  competency: "I can walk an income statement from sales down to profit per share",
  summary: "How a company gets from revenue to earnings per share, and which lines are operating versus financing.",
  minutes: 6,
  aliases: ["profit and loss", "p&l", "how is profit calculated", "what is net income"],
  easierAfter: [],
  get: {
    body: [
      "An income statement is a company's report card for a period, usually a year or a quarter. It starts with everything the company sold and takes away its costs in layers, until you reach the profit left for its owners.",
      "Each layer answers a different question. Gross profit shows whether the product itself makes money. Operating income shows whether the whole business does, after paying for staff, offices and research. Net income is what is left after interest and tax.",
      "Sales count when the company delivers, not when the cash arrives. That is why a profitable year can still leave a company short of cash.",
    ],
    analogy: "Think of a lemonade stand. The cups you sell are revenue. Lemons and sugar are the cost of goods. Rent for the stand is an operating cost. Then you pay interest on the loan from your parents, and tax. What is left is yours.",
    visual: { kind: "flow", steps: ["Revenue", "Gross profit", "Operating income", "Pre-tax income", "Net income"] },
  },
  work: {
    intro: "Here is a small company's year, one line at a time.",
    steps: [
      { label: "Gross profit", formula: "Revenue − Cost of goods sold", inputs: { Revenue: 1000, COGS: 600 }, unit: "usd", evaluate: (i) => i.Revenue - i.COGS, result: 400 },
      { label: "Operating income (EBIT)", formula: "Gross profit − Operating expenses", inputs: { "Gross profit": 400, OpEx: 250 }, unit: "usd", evaluate: (i) => i["Gross profit"] - i.OpEx, result: 150 },
      { label: "Pre-tax income", formula: "EBIT − Interest", inputs: { EBIT: 150, Interest: 30 }, unit: "usd", evaluate: (i) => i.EBIT - i.Interest, result: 120 },
      { label: "Net income", formula: "Pre-tax income × (1 − Tax rate)", inputs: { "Pre-tax income": 120, "Tax rate": 0.25 }, unit: "usd", evaluate: (i) => i["Pre-tax income"] * (1 - i["Tax rate"]), result: 90 },
      { label: "Diluted EPS", formula: "Net income ÷ (Shares + Dilutive shares)", inputs: { "Net income": 90, Shares: 40, "Dilutive shares": 5 }, unit: "usd", evaluate: (i) => i["Net income"] / (i.Shares + i["Dilutive shares"]), result: 2, note: "In millions of dollars and shares, so EPS is $2.00." },
    ],
    drills: ["gross_margin", "operating_margin", "net_margin"],
    explore: { ticker: "NIMBUS", tab: "statements", prompt: "Open Nimbus Cloud Software's income statement and switch to common-size view." },
  },
  prove: [
    {
      stem: "A company ships goods in December, but the customer pays in February. When does the company record the revenue?",
      level: 1, answer: 1,
      options: [
        { text: "February, when the cash arrives", why: "Tempting, because cash feels like the real sale. But revenue is recorded when it is earned. The cash only settles a receivable later." },
        { text: "December, when control passes to the customer", why: "Right. Revenue is recorded once the company has delivered what it promised, which is when control of the goods passes." },
        { text: "When the invoice is sent", why: "An invoice is paperwork. It can go out before or after delivery, so it does not decide when revenue is earned." },
      ],
    },
    {
      stem: "Which line sits between gross profit and operating income?",
      level: 1, answer: 2,
      options: [
        { text: "Interest expense", why: "Interest comes after operating income. It is a cost of how the company is financed, not of running it." },
        { text: "Income tax", why: "Tax is the last cost before net income, well below operating income." },
        { text: "Operating expenses such as SG&A and R&D", why: "Right. Selling, general and administrative costs and research are taken from gross profit to reach operating income." },
      ],
    },
    {
      stem: "Why is diluted EPS never higher than basic EPS?",
      level: 2, answer: 0,
      options: [
        { text: "It counts shares that options and convertibles could create", why: "Right. Dilutive securities add shares to the divisor. Anti-dilutive ones are left out, so diluted EPS can't rise above basic." },
        { text: "It uses a higher tax rate", why: "The tax rate is the same. Dilution changes the share count, not the profit." },
        { text: "It leaves out one-off gains", why: "Both measures use the same profit. Stripping one-offs is a separate adjustment some analysts make." },
      ],
    },
    {
      stem: "Net income is $90 million. There are 40 million shares, and options would add 5 million more, all dilutive. Diluted EPS is closest to:",
      level: 3, answer: 0,
      options: [
        { text: "$2.00", why: "Right. $90 million divided by 45 million shares is $2.00." },
        { text: "$2.25", why: "That divides by the 40 million basic shares only, so it is basic EPS." },
        { text: "$1.80", why: "That adds the option shares twice, dividing by 50 million." },
      ],
    },
  ],
  activities: ["game:mystery-ledger"],
  furtherReading: { title: "Principles of Finance 2e, 5.1 The Income Statement (OpenStax)", url: "https://openstax.org/books/principles-finance-2e/pages/5-1-the-income-statement" },
  sources: [
    { id: "sec-fs-guide", checked: "2026-11-29" },
    { id: "investor-gov-fs", checked: "2026-11-29" },
  ],
  cfa: { module: "FSA.02", outcomes: ["FSA.02.1", "FSA.02.2", "FSA.02.4"], note: "revenue and expense recognition; basic and diluted EPS" },
} satisfies MapNode;
```

Set each `checked` date to the day you verify the source yourself.

- [ ] **Step 4: Create `content/map/financial-statements/balance-sheet.ts`** by following the migration steps, with the row for `balance-sheet` in the Task 5 table. Use `visual: { kind: "balance-scale" }`, which renders the existing `components/BalanceScale.tsx`.

- [ ] **Step 5: Create `content/map/index.ts` and `content/map/catalog.ts`**

Import each star file explicitly (no globbing), keep `NODES` ordered by region in `REGION_IDS` order and then in file-list order, and export `nodeById`, `nodesIn` and `toCatalogEntry`. Write the two catalog entries by hand. Every later task that adds a star also adds its catalog entry, and the catalog test catches a mismatch.

- [ ] **Step 6: Run the tests**

Run: `npx vitest run tests/content.test.ts && npm run lint`
Expected: PASS for both stars. If the reading-grade lint fails, shorten sentences and swap long words. Don't loosen the lint.

- [ ] **Step 7: Commit**

```bash
git add content/map tests/content.test.ts
git commit -m "Add the first two Financial Statements stars"
```

---

### Task 5: The other nine Financial Statements stars

**Files:**
- Create: `content/map/financial-statements/{cash-flow,profitability,liquidity-solvency,efficiency,returns-dupont,earnings-quality,distress-scores,banks,forecasting}.ts`
- Modify: `content/map/index.ts`, `content/map/catalog.ts`
- Test: `tests/content.test.ts` (extend)

**Interfaces:**
- Consumes: the migration steps in Task 4, `lib/learn/lessons.ts` (source lesson content), and `DRILLS` IDs from `lib/game/questions.ts`.
- Produces: 11 Financial Statements stars in `NODES`.

| Star (= lesson id) | Competency | `cfa.module` / `outcomes` | `easierAfter` | `activities` | `furtherReading` (OpenStax Principles of Finance 2e page slug) | `sources` | `badge` | Visual |
|---|---|---|---|---|---|---|---|---|
| income-statement | (Task 4) | FSA.02 / .1 .2 .4 | | game:mystery-ledger | 5-1-the-income-statement | sec-fs-guide, investor-gov-fs | | flow |
| balance-sheet | I can explain what a company owns, owes and keeps for its owners | FSA.03 / .1 .2 .4 | | | 5-2-the-balance-sheet | sec-fs-guide, investor-gov-fs | | balance-scale |
| cash-flow | I can tell where a company's cash really came from and went | FSA.04 / FSA.04.1, FSA.04.2, FSA.05.2 | income-statement, balance-sheet | | 5-5-the-statement-of-cash-flows | sec-fs-guide, investor-gov-fs | three_statements | flow |
| profitability | I can judge how much of each sale a company keeps as profit | FSA.11 / FSA.11.2, FSA.02.5 | income-statement | game:ratio-rush | 6-6-profitability-ratios-and-the-dupont-method | sec-fs-guide, saylor-bus202 | | bars |
| liquidity-solvency | I can tell whether a company can pay its bills this year and its debts later | FSA.11 / FSA.11.2, FSA.03.5 | balance-sheet | game:higher-lower | 6-3-liquidity-ratios | sec-fs-guide, saylor-bus202 | | bars |
| efficiency | I can explain how fast a company turns stock and invoices into cash | FSA.11 / FSA.11.2, CF.04.1 | balance-sheet, income-statement | game:ratio-rush | 6-2-operating-efficiency-ratios | sec-fs-guide, saylor-bus202 | | flow |
| returns-dupont | I can break return on equity into margin, turnover and leverage | FSA.11 / FSA.11.3, FSA.11.4 | profitability, efficiency | | 6-6-profitability-ratios-and-the-dupont-method | saylor-bus202, mit-15401 | dupont | bars |
| earnings-quality | I can spot when reported profit may not be what it seems | FSA.10 / FSA.10.1, FSA.10.3, FSA.10.7, FSA.10.8 | cash-flow | game:red-flag-hunt | (none) | sec-fs-guide, ifrs-framework | | bars |
| distress-scores | I can explain what a distress score says about a company and where it misleads | FSA.11 / FSA.11.1, FSA.10.8 | liquidity-solvency | game:red-flag-hunt | 6-4-solvency-ratios | sec-fs-guide, saylor-bus202 | | bars |
| banks | I can read a bank's results, which work differently from other companies' | FSA.11 / FSA.11.5 | income-statement, balance-sheet | | (none) | sec-fs-guide, sec-edgar | | flow |
| forecasting | I can turn a company's history into a simple, honest forecast | FSA.12 / FSA.12.1, FSA.11.6 | profitability | walkthrough:model | (none) | mit-15401, saylor-bus202 | graduate is NOT set here | growth |

Notes for this table:
- Further reading URLs are `https://openstax.org/books/principles-finance-2e/pages/<slug>`, with the title written as `Principles of Finance 2e, <section number> <section title> (OpenStax)`. Check each with `curl -sIL <url> | head -1`. If one 404s, use the chapter's first section instead, or leave the field out.
- `ifrs-framework` is `aiReadable: false`. A person reads it for `earnings-quality`; don't paste it into AI.
- The `banks` lesson's facts (efficiency ratio, net interest income) also need a second government source. If `sec-edgar` doesn't support a claim, add an FDIC or Federal Reserve page to the register (kind `government`) in this task and cite it.
- Reword the old card text "the CFA curriculum uses the average of opening and closing balances" (efficiency) as "analysts use the average of the opening and closing balances".
- `graduate` is awarded by the progress model (Task 7), not by a star.

- [ ] **Step 1: Add failing expectations** to `tests/content.test.ts`

Add the two imports at the top of the file and the two tests inside the `describe` block:

```ts
import { LESSONS } from "../lib/learn/lessons";
import { nodesIn } from "../content/map";

it("turns every lesson into a Financial Statements star with the same ID", () => {
  const fs = nodesIn("financial-statements").map((n) => n.id);
  for (const l of LESSONS) expect(fs).toContain(l.id);
});
it("keeps every lesson's drills", () => {
  for (const l of LESSONS) expect(nodeById(l.id)?.work.drills).toEqual(l.drills);
});
```

(Task 13 deletes `lib/learn/lessons.ts`. That task also replaces these two tests with a fixed list of the 11 IDs and their drills.)

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run tests/content.test.ts`
Expected: FAIL, 9 lesson IDs are missing.

- [ ] **Step 3: Write the nine star files** following the migration steps and the table, and add them to `content/map/index.ts` in table order.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/content.test.ts && npm run lint`
Expected: PASS for all 11 stars.

- [ ] **Step 5: Commit**

```bash
git add content/map tests/content.test.ts lib/map/sources.ts
git commit -m "Turn the remaining lessons into Financial Statements stars"
```

---

### Task 6: Six hub stars and the three trails

**Files:**
- Create: `content/map/time-value/compounding.ts`, `content/map/investing/{diversification,index-funds,retirement-spending}.ts`, `content/map/stocks/company-worth.ts`, `content/map/financial-manager/budget-vs-actual.ts`, `lib/map/trails.ts`
- Modify: `content/map/index.ts`, `content/map/catalog.ts`
- Test: `tests/content.test.ts` (extend), `tests/trails.test.ts`

**Interfaces:**
- Consumes: `Trail` (Task 1), `ALL_ACTIVITY_IDS` (Task 2), `NODES` and `nodeById` (Task 4).
- Produces: `lib/map/trails.ts` exports `TRAILS: Trail[]` and `trailById(id: string): Trail | undefined`.

These are new stars, written from scratch using the authoring steps in spec §8. There are no lessons to migrate.

| Star | Region | Title | Competency | `cfa.module` / outcomes | `easierAfter` | `activities` | Further reading | `sources` | Visual |
|---|---|---|---|---|---|---|---|---|---|
| compounding | time-value | Compounding | I can explain how compounding turns small, early savings into large sums | QM.04 / QM.04.1 | | bogleheads:saving-rate, bogleheads:saving-early | 7-2-time-value-of-money-tvm-basics | investor-gov-compound, mit-15401 | growth |
| diversification | investing | Spreading Your Bets | I can explain why owning many different assets lowers risk without giving up return | PM.01 / PM.01.6, QM.08.1 | compounding | research:enhanced-portfolio-optimization | 15-2-risk-and-return-to-multiple-assets | investor-gov-intro, mit-15401 | bars |
| index-funds | investing | Index Funds | I can explain why low-cost index funds are hard for most investors to beat | PM.03 / PM.03.6, PM.02.3 | diversification | bogleheads:philosophy, bogleheads:start-up-kit, bogleheads:humble-arithmetic, bogleheads:comparing-investments, research:buffetts-alpha | (none) | investor-gov-intro, mit-15401 | bars |
| retirement-spending | investing | Spending in Retirement | I can explain the trade-offs in turning savings into an income that lasts | PM.04 / PM.04.3, PM.04.5 | compounding | research:retirement-income | (none) | investor-gov-intro, mit-15401 | growth |
| company-worth | stocks | What Is a Company Worth? | I can explain what a discounted cash flow says a company is worth, and why it is only an estimate | EQ.06 / EQ.05.1, EQ.06.1, EQ.06.2 | compounding, cash-flow | walkthrough:dcf | 11-4-discounted-cash-flow-dcf-model | mit-15401, saylor-bus202 | flow |
| budget-vs-actual | financial-manager | Budget Versus Actual | I can explain why actual results differ from the plan, line by line | FSA.11 / FSA.11.1 | income-statement | walkthrough:variance | (none) | saylor-bus202, sec-edgar | bars |

Each Work it uses round numbers. Examples: $1,000 at 7% for 30 years (compounding); a two-asset portfolio's weighted return and the risk drop when correlation is below 1 (diversification); fee drag of 1% against 0.05% over 30 years (index-funds); a 4% first-year withdrawal grown with inflation (retirement-spending); a three-year FCFF, a terminal value and their discounted sum (company-worth); price and volume variances (budget-vs-actual). Every number goes through `evaluate`.

- [ ] **Step 1: Write the failing tests** in `tests/trails.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { TRAILS } from "../lib/map/trails";
import { NODES, nodeById } from "../content/map";
import { ALL_ACTIVITY_IDS } from "../lib/map/activities";

describe("trails", () => {
  it("has the three launch trails", () => {
    expect(TRAILS.map((t) => t.id)).toEqual(["company-health", "company-worth", "beginner-investor"]);
  });
  it("uses 4 to 8 stars that all exist", () => {
    for (const t of TRAILS) {
      expect(t.stars.length).toBeGreaterThanOrEqual(4);
      expect(t.stars.length).toBeLessThanOrEqual(8);
      for (const s of t.stars) expect(nodeById(s), `${t.id}: ${s}`).toBeDefined();
    }
  });
  it("ends the worth trail on the DCF star", () => {
    expect(TRAILS.find((t) => t.id === "company-worth")?.stars.at(-1)).toBe("company-worth");
  });
});

describe("one front door", () => {
  it("links every existing surface from at least one star", () => {
    const linked = new Set(NODES.flatMap((n) => n.activities));
    for (const a of ALL_ACTIVITY_IDS) expect(linked, a).toContain(a);
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run tests/trails.test.ts`
Expected: FAIL, cannot resolve `../lib/map/trails`.

- [ ] **Step 3: Create `lib/map/trails.ts`** with the trails from spec R5. `title` is the learner-facing question. `question` is a one-line promise, for example "Seven stars from the income statement to a distress score."

- [ ] **Step 4: Write the six hub stars** and add them to `content/map/index.ts`.

- [ ] **Step 5: Run all tests**

Run: `npm test && npm run lint`
Expected: PASS, including every new star's lint.

- [ ] **Step 6: Commit**

```bash
git add content/map lib/map/trails.ts tests/trails.test.ts
git commit -m "Add the six hub stars and the three launch trails"
```

---

### Task 7: The progress model

**Files:**
- Create: `lib/map/progress-model.ts`
- Test: `tests/progress-model.test.ts`

**Interfaces:**
- Consumes: `CatalogEntry`, `StarState`, `Trail` (Task 1).
- Produces (all pure, no React, no `window`):
  ```ts
  export interface StarRecord { s: 1 | 2 | 3; best?: number }          // 1 visited, 2 practised, 3 proven
  export interface Progress {
    v: 2;
    xp: number; answered: number; correct: number; days: string[]; badges: string[];
    lessons: Record<string, number>;   // kept read-only for history; no longer written
    games: Record<string, number>; viewed: string[]; calls: Record<string, boolean>;
    nodes: Record<string, StarRecord>;
    activeTrail: string | null; trailLast: Record<string, string>; lastStar: string | null;
    firstSeen: number | null; firstStarSent: boolean; notes: Record<string, boolean>;
  }
  export const EMPTY: Progress;
  export const PROVEN_MARK = 0.6, VISIT_XP = 5, PRACTISE_XP = 10, PROVE_XP = 50;
  export function migrate(raw: unknown): Progress;
  export function stateOf(p: Progress, id: string): StarState;
  export function raise(p: Progress, id: string, to: Exclude<StarState, "unexplored">, best?: number):
    { p: Progress; xp: number; firstProven: boolean };
  export function badgesEarned(p: Progress, stars: CatalogEntry[]): string[];   // badge IDs now due, not yet held, no duplicates
  export function trailProgress(p: Progress, t: Trail): { done: number; total: number; next: string };
  export function continueTarget(p: Progress, trails: Trail[], exists: (id: string) => boolean): string | null;
  export function regionLit(p: Progress, stars: CatalogEntry[]): { proven: number; total: number };   // pass one region's entries
  ```

- [ ] **Step 1: Write the failing tests** `tests/progress-model.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { EMPTY, PROVE_XP, VISIT_XP, badgesEarned, continueTarget, migrate, raise, stateOf, trailProgress } from "../lib/map/progress-model";
import { CATALOG as NODES } from "../content/map/catalog";
import { nodeById } from "../content/map";
import { TRAILS } from "../lib/map/trails";

const v1 = { xp: 320, answered: 40, correct: 30, days: ["2026-11-20"], badges: ["first_step"], lessons: { "income-statement": 0.8, "balance-sheet": 0.4 }, games: { "ratio-rush": 9 }, viewed: ["AAPL"], calls: {} };

describe("migrate", () => {
  it("keeps everything from v1 and maps lesson scores to star states", () => {
    const p = migrate(v1);
    expect(p.v).toBe(2);
    expect([p.xp, p.badges, p.games, p.viewed]).toEqual([320, ["first_step"], { "ratio-rush": 9 }, ["AAPL"]]);
    expect(p.nodes["income-statement"]).toEqual({ s: 3, best: 0.8 });
    expect(p.nodes["balance-sheet"]).toEqual({ s: 2, best: 0.4 });
  });
  it("is idempotent", () => {
    const once = migrate(v1);
    expect(migrate(once)).toEqual(once);
  });
  it("survives junk", () => {
    expect(migrate(null)).toEqual(EMPTY);
    expect(migrate("nope")).toEqual(EMPTY);
    expect(migrate({ xp: 5 }).xp).toBe(5);
    expect(migrate({ v: 2, nodes: { a: "bad", b: { s: 9 } } }).nodes).toEqual({});
  });
});

describe("raise", () => {
  it("only moves up, awards XP once and keeps the best score", () => {
    let r = raise(EMPTY, "x", "visited");
    expect([stateOf(r.p, "x"), r.xp]).toEqual(["visited", VISIT_XP]);
    r = raise(r.p, "x", "visited");
    expect(r.xp).toBe(0);
    r = raise(r.p, "x", "proven", 0.75);
    expect([stateOf(r.p, "x"), r.firstProven]).toEqual(["proven", true]);
    expect(r.xp).toBe(PROVE_XP);
    r = raise(r.p, "x", "practised", 0.2);
    expect([stateOf(r.p, "x"), r.p.nodes.x.best, r.xp, r.firstProven]).toEqual(["proven", 0.75, 0, false]);
  });
  it("goes straight to proven from unexplored", () => {
    expect(stateOf(raise(EMPTY, "y", "proven", 1).p, "y")).toBe("proven");
  });
  it("records the last star", () => {
    expect(raise(EMPTY, "z", "visited").p.lastStar).toBe("z");
  });
});

describe("badges", () => {
  it("awards three_statements, dupont and graduate from proven stars", () => {
    let p = EMPTY;
    for (const id of ["income-statement", "balance-sheet", "cash-flow"]) p = raise(p, id, "proven", 1).p;
    expect(badgesEarned(p, NODES)).toContain("three_statements");
    expect(badgesEarned(p, NODES)).not.toContain("graduate");
    for (const n of NODES.filter((n) => n.region === "financial-statements")) p = raise(p, n.id, "proven", 1).p;
    expect(badgesEarned(p, NODES)).toEqual(expect.arrayContaining(["three_statements", "dupont", "graduate"]));
    expect(badgesEarned({ ...p, badges: ["graduate", "dupont", "three_statements"] }, NODES)).toEqual([]);
  });
});

describe("trails and continue", () => {
  const health = TRAILS[0];
  it("counts visited stars and points at the next one", () => {
    const p = raise(EMPTY, health.stars[0], "visited").p;
    expect(trailProgress(p, health)).toEqual({ done: 1, total: health.stars.length, next: health.stars[1] });
  });
  it("continues the active trail, then the last star, and skips missing IDs", () => {
    const exists = (id: string) => !!nodeById(id);
    expect(continueTarget(EMPTY, TRAILS, exists)).toBeNull();
    const onTrail = { ...raise(EMPTY, health.stars[0], "visited").p, activeTrail: health.id };
    expect(continueTarget(onTrail, TRAILS, exists)).toBe(health.stars[1]);
    expect(continueTarget({ ...EMPTY, activeTrail: "gone", lastStar: "gone-too" }, TRAILS, exists)).toBeNull();
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run tests/progress-model.test.ts`
Expected: FAIL, cannot resolve the module.

- [ ] **Step 3: Implement `lib/map/progress-model.ts`.** Rules the tests don't fully pin:
  - `migrate` copies only fields of the right type from `raw`, so wrong types fall back to `EMPTY`'s. It keeps only `nodes` entries whose value is `{ s: 1 | 2 | 3 }`. When `raw.v !== 2`, each `lessons[id]` is merged into `nodes[id]` as `s: 3` (score ≥ `PROVEN_MARK`) or `s: 2`, with `best = score`, never lowering an existing record.
  - `raise` awards the XP of the highest state newly reached: `VISIT_XP` for visited, `PRACTISE_XP` for practised, `PROVE_XP` for proven. Skipped states earn nothing extra, so unexplored straight to proven gives `PROVE_XP` only. It returns that `xp` (0 when the state doesn't rise), sets `lastStar = id`, keeps `best` as the higher score, and does not touch `p.xp` (the provider adds XP, so toasts fire there).
  - `badgesEarned` returns `three_statements`, `dupont` and `graduate` (rules in spec R7 AC5), plus any star `badge` whose star is proven. It leaves out badges already in `p.badges`.
  - `trailProgress.next` is the first star in the trail that isn't at least visited, or the last star when all are.
  - `continueTarget` returns the active trail's `next` when the trail exists, otherwise `lastStar` when `exists(lastStar)`, otherwise `null`.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/progress-model.test.ts && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/map/progress-model.ts tests/progress-model.test.ts
git commit -m "Add the versioned progress model with star states and migration"
```

---

### Task 8: Wire the provider to the model

**Files:**
- Modify: `lib/game/progress.tsx`

**Interfaces:**
- Consumes: everything from Task 7, `CATALOG` (Task 4).
- Produces: new context methods. Existing ones keep their signatures, except `setLesson`, which is removed in Task 13.
  ```ts
  markStar: (id: string, to: "visited" | "practised" | "proven", best?: number) => { firstProven: boolean };
  startTrail: (trailId: string) => void;        // sets activeTrail
  noteTrailStep: (trailId: string, starId: string) => void;   // sets trailLast[trailId]
  dismissNote: (key: string) => void;           // notes[key] = true
  seeMap: () => boolean;                        // sets firstSeen if null; returns true the first time
  markFirstStarSent: () => void;
  ```
  `BADGES.graduate` becomes `{ name: "Statements Lit", desc: "Prove every star in Financial Statements", icon: "🎓" }`. Update `three_statements.desc` to "Prove the income statement, balance sheet and cash flow stars" and `dupont.desc` to "Prove the DuPont star".

- [ ] **Step 1: Move the types.** Delete the local `Progress` interface and `EMPTY` from `progress.tsx`, then import and re-export `Progress` from `lib/map/progress-model.ts`, so existing `import { Progress } from "@/lib/game/progress"` lines still compile.

- [ ] **Step 2: Load through `migrate`.** Replace `setP({ ...EMPTY, ...JSON.parse(raw) })` with `setP(migrate(JSON.parse(raw)))`. Keep the existing try/catch, and wrap every new `localStorage` access in try/catch too.

- [ ] **Step 3: Add the methods.** `markStar` calls `raise` inside `update`. It adds the returned `xp` to `p.xp` and toasts `+N XP · <reason>` (reasons: "star visited", "worked through", "star proven"). Then it calls `badgesEarned(next, CATALOG)` and grants each badge with the existing toast. `update`'s existing streak and level logic runs unchanged.

- [ ] **Step 4: Check types, tests and build**

Run: `npm run lint && npm test && npm run build`
Expected: all pass. The old learn page still builds, because `setLesson` still exists.

- [ ] **Step 5: Manual check of blocked storage**

Run `npm run dev`. Open `/` in a private window, or run `localStorage.setItem = () => { throw new Error("blocked") }` in devtools, then reload. Expected: the page renders with no uncaught error in the console.

- [ ] **Step 6: Commit**

```bash
git add lib/game/progress.tsx
git commit -m "Load progress through the new model and add star and trail actions"
```

---

### Task 9: The public view of a star and value formatting

**Files:**
- Create: `lib/map/public.ts`, `lib/map/format.ts`
- Test: `tests/public.test.ts`

**Interfaces:**
- Consumes: `MapNode` (Task 1), `activity` (Task 2), `sourceById` (Task 2), `money`, `pct` from `lib/format.ts`.
- Produces:
  ```ts
  export interface PublicStep { label: string; formula: string; inputs: [string, string][]; result: string; note?: string }
  export interface PublicNode {
    id: string; region: RegionId; title: string; competency: string; summary: string; minutes: number;
    easierAfter: { id: string; title: string }[];
    get: MapNode["get"];
    work: { intro: string; steps: PublicStep[]; drills: string[]; explore?: MapNode["work"]["explore"] };
    prove: MapNode["prove"];
    activities: { label: string; href: string; kind: string; blurb: string }[];
    furtherReading?: { title: string; url: string };
    sources: { title: string; url: string }[];
  }
  export function toPublic(n: MapNode, titleOf: (id: string) => string | undefined): PublicNode;
  export function formatValue(v: number, unit: WorkStep["unit"]): string;   // in lib/map/format.ts
  ```
  `formatValue`: `usd` is `money(v)` from `lib/format.ts` when `|v| ≥ 1,000,000`; below that it is `$` plus `v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })`, with a leading `-` for negatives (`$2.00`, `$1,000.00`). `pct` is `pct(v, 1)`. `x` is `v.toFixed(2) + "×"`. `plain` is `toLocaleString("en-US", { maximumFractionDigits: 3 })`. `years` is `"<v> years"`. Input values are formatted with the step's unit, except names containing "rate", "growth", "margin" or "weight", which use `pct`.

- [ ] **Step 1: Write the failing test** `tests/public.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { toPublic } from "../lib/map/public";
import { formatValue } from "../lib/map/format";
import { NODES, nodeById } from "../content/map";

describe("toPublic", () => {
  it("never carries the hidden tags or functions", () => {
    for (const n of NODES) {
      const json = JSON.stringify(toPublic(n, (id) => nodeById(id)?.title));
      expect(json).not.toMatch(/"cfa"|FSA\.\d|QM\.\d|PM\.\d|EQ\.\d|evaluate/);
    }
  });
  it("formats the income statement's steps", () => {
    const p = toPublic(nodeById("income-statement")!, (id) => nodeById(id)?.title);
    expect(p.work.steps[0]).toMatchObject({ label: "Gross profit", result: "$400.00" });
    expect(p.work.steps[3].inputs).toContainEqual(["Tax rate", "25.0%"]);
    expect(p.sources).toHaveLength(2);
  });
});

describe("formatValue", () => {
  it("formats each unit", () => {
    expect(formatValue(2, "usd")).toBe("$2.00");
    expect(formatValue(1000, "usd")).toBe("$1,000.00");
    expect(formatValue(1_500_000, "usd")).toBe("$1.5M");
    expect(formatValue(0.073, "pct")).toBe("7.3%");
    expect(formatValue(1.5, "x")).toBe("1.50×");
    expect(formatValue(30, "years")).toBe("30 years");
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run tests/public.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement both files.** `toPublic` computes each step's displayed `result` from `step.result` (not by calling `evaluate`, which the lint already checked). It resolves `easierAfter` titles with `titleOf` and drops IDs that don't resolve. It resolves activities and sources through their registries and drops unknown ones.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/public.test.ts && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/map/public.ts lib/map/format.ts tests/public.test.ts
git commit -m "Add the public view of a star that pages pass to the client"
```

---

### Task 10: A shared step list (with PR #7)

**Files:**
- Create: `components/walkthrough/StepList.tsx`
- Modify (only if PR #7 is merged): `components/report/Walkthroughs.tsx`

**Interfaces:**
- Consumes: `PublicStep` (Task 9).
- Produces: `export function StepList({ steps, start = 1 }: { steps: PublicStep[]; start?: number })`, which renders an `<ol>` of step cards. Each card has the number, label, result (mono, gold), the formula (mono) and input chips, using the same classes as `StepCard` in PR #7's `Walkthroughs.tsx` (`rounded-2xl border border-line bg-panel-2/60 p-3`, `chip font-mono text-[11px]`). A step's `note` renders as small muted text.

- [ ] **Step 1: Check whether PR #7 has merged**

Run: `git fetch origin main && git ls-tree origin/main components/report/Walkthroughs.tsx`
Expected: a line naming the file when merged. No output means it isn't merged.

- [ ] **Step 2: Create `StepList.tsx`.**

- [ ] **Step 3: If merged, refactor `Walkthroughs.tsx`.** Change its `Steps` to map each `Step` into a `PublicStep` (with its own `fmt` and `inputUnit`) and render `<StepList>`. Its look must not change: compare the DCF tab on `/company/NIMBUS?tab=dcf` before and after. If PR #7 isn't merged, skip this step and say so in the PR description. The `walkthrough:*` links will work once #7 merges.

- [ ] **Step 4: Check**

Run: `npm run lint && npm test && npm run build`
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add components/walkthrough components/report/Walkthroughs.tsx
git commit -m "Share one step list between walkthroughs and Work it"
```

---

### Task 11: The star page and its three depths

**Files:**
- Create: `components/node/NodeShell.tsx`, `components/node/DepthTabs.tsx`, `components/node/GetIt.tsx`, `components/node/Visual.tsx`, `components/node/WorkIt.tsx`, `components/node/ProveIt.tsx`, `components/node/TrailBar.tsx`, `components/node/NodeFooter.tsx`, `app/learn/[id]/work/page.tsx`, `app/learn/[id]/prove/page.tsx`
- Modify: `app/learn/[id]/page.tsx`, `components/QuizCard.tsx`
- Test: `tests/public.test.ts` (add the `toQuizItem` test)

**Interfaces:**
- Consumes: `PublicNode` (Task 9), `StepList` (Task 10), `useProgress().markStar`, `noteTrailStep` and `answer` (Task 8), `TRAILS` and `trailProgress` (Tasks 6 and 7), `track` (Task 15; until then, call nothing). Also `getAllCompanies` and `toBank`, as in today's lesson page.
- Produces:
  - `QuizItem` gains `whys?: string[]`. After an answer, `QuizCard` shows `whys[chosen]` and, when that is wrong, also `whys[answer]` under a "Right answer" label. When `whys` is absent, it shows `explain` as today.
  - `export function toQuizItem(q: ProveQ): QuizItem` in `lib/map/public.ts` gives `{ prompt: q.stem, choices: q.options.map(o => o.text), answer: q.answer, whys: q.options.map(o => o.why), explain: q.options[q.answer].why }`.
  - Pages: each of the three routes exports `dynamicParams = false` and `generateStaticParams = () => NODES.map(n => ({ id: n.id }))`, plus `generateMetadata` with the title "<star title>" for Get it, "<title> · Work it" and "<title> · Prove it". Each renders `<NodeShell node={toPublic(...)} depth="get|work|prove">` with the depth component inside. Only the work and prove routes load the company bank (for drills).

Behaviour:
- `NodeShell` is a client component. It shows a back link "← The map" to `/learn`, the region name, title, competency, and `DepthTabs` (three links, with `aria-current="page"` on the active one). It shows an "Easier after: <links>" line when `easierAfter` is non-empty, and `TrailBar` when the active trail contains this star. On mount it calls `markStar(id, "visited")` on every depth (Review Focus 4) and `noteTrailStep(activeTrail, id)` when this star is in the active trail.
- `GetIt` renders paragraphs, the analogy in a highlighted card ("Think of it like this"), and `Visual`. The Get it text is server-rendered: `GetIt` takes it as props and holds no state.
- `Visual` handles `balance-scale` (renders `BalanceScale`), `flow` (a horizontal chain of chips with arrows that wraps on phones), `bars` (proportional bars with labels and values) and `growth` (a slider for years from 1 to the given years, showing the grown value of $1,000 at `rate`, with the curve drawn as an SVG polyline).
- `WorkIt` renders the intro, `StepList`, then the drills section "Try it on real companies". It builds questions exactly as `buildQuiz` in `LessonRunner.tsx` does for drills (real companies first, a fallback to training companies, up to 30 tries per drill), with a `QuizCard` per drill. Each answer calls `answer(correct)`. When every drill is answered, or "Done" is pressed when there are no drills, it calls `markStar(id, "practised")`. It shows `explore` as today's Explore box.
- `ProveIt` runs `prove` through `QuizCard` one at a time, calling `answer(correct)` on each. At the end it scores right ÷ total. At or above `PROVEN_MARK` it calls `markStar(id, "proven", score)` and shows `<Stamp large>Proven</Stamp>` with `<Confetti>` only when `firstProven` is true. Below the mark it shows "Not yet: <n> of <total>. Read the whys and try again whenever you like." It has a Retry button and a link back to Get it. There is never a lock or a "you must" message.
- `NodeFooter` shows activities (cards with label, blurb and link), "Further reading" (an external link with `rel="noopener"`) and "Sources" (a list of links).

- [ ] **Step 1: Write the failing test** (append to `tests/public.test.ts`)

```ts
import { toQuizItem } from "../lib/map/public";
it("turns a Prove it question into a quiz item with whys", () => {
  const q = nodeById("income-statement")!.prove[0];
  const item = toQuizItem(q);
  expect(item.choices).toHaveLength(3);
  expect(item.whys).toEqual(q.options.map((o) => o.why));
  expect(item.explain).toBe(q.options[q.answer].why);
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run tests/public.test.ts`
Expected: FAIL, `toQuizItem` is not exported.

- [ ] **Step 3: Implement `toQuizItem`, the `QuizCard` change, the components and the three routes.**

- [ ] **Step 4: Run tests, types and build**

Run: `npm test && npm run lint && npm run build`
Expected: pass. The build output lists `/learn/[id]`, `/learn/[id]/work` and `/learn/[id]/prove` with 17 paths each.

- [ ] **Step 5: Check the HTML holds the Get it text and no hidden tags**

Run: `npm run build && grep -rl "report card for a period" .next/server/app/learn && ! grep -rE "FSA\.[0-9]|\"cfa\"" .next/server/app/learn .next/static`
Expected: the first grep prints the prerendered `income-statement` HTML file, and the second finds nothing (exit 0).

- [ ] **Step 6: Manual check**

Run `npm run dev` and open `/learn/income-statement`, `/learn/income-statement/work` and `/learn/income-statement/prove`. Expected: tabs switch, steps show `$400.00`, a wrong answer shows its why and the right answer's why, and passing shows the Proven stamp once. Opening `/learn/balance-sheet/prove` first still marks the star visited. Check this in devtools under `localStorage["ledger-progress-v1"]`, where `nodes["balance-sheet"].s` should be at least 1.

- [ ] **Step 7: Commit**

```bash
git add components/node components/QuizCard.tsx app/learn lib/map/public.ts tests/public.test.ts
git commit -m "Add star pages with Get it, Work it and Prove it"
```

---

### Task 12: The map page

**Files:**
- Create: `lib/map/layout.ts`, `components/map/Sky.tsx`, `components/map/RegionPanel.tsx`, `components/map/ListView.tsx`, `components/map/StartHere.tsx`, `components/map/TrailCards.tsx`, `components/map/StorageNote.tsx`, `components/map/MapView.tsx`
- Modify: `app/learn/page.tsx`
- Test: `tests/layout.test.ts`

**Interfaces:**
- Consumes: `REGIONS` (Task 1), `CATALOG` (Task 4), `TRAILS` (Task 6), `stateOf`, `regionLit`, `trailProgress`, `continueTarget` (Task 7), the provider methods (Task 8).
- Produces: `export function starPositions(n: number, cx: number, cy: number, radius: number): { x: number; y: number }[]` in `lib/map/layout.ts`. It uses a golden-angle spiral: point `i` sits at distance `radius × sqrt((i + 0.5) / n)` and angle `i × 2.399963` radians.

Behaviour:
- `app/learn/page.tsx` (server) renders the page head and the client `MapView`, which reads `REGIONS`, `CATALOG` and `TRAILS` itself. The page head eyebrow is "11 constellations · go anywhere". The title is "The <highlight>map</highlight>". The intro reads "Every star is one idea. Open any of them, in any order. Stars brighten as you visit, practise and prove them."
- `MapView` holds `selected: RegionId | null` and `view: "sky" | "list"`. When progress is first `ready`, it calls `seeMap()`. Task 15 adds `track("map-first-visit")` when that returns true. The layout from top to bottom:
  1. `StorageNote`, shown while `notes.storage` isn't true, with the text "Your progress is saved in this browser only." and a "Got it" button that calls `dismissNote("storage")`.
  2. `StartHere` (no `nodes` at all: three trail cards with "Start", which calls `startTrail` and links to the trail's first star with `?from=start-here`). Otherwise, a Continue card when `continueTarget` returns a star (link with `?from=continue`).
  3. `TrailCards`: each trail with a progress bar (hatched track, accent fill, as in `LearnPath`) and Start or Resume (`?from=trail`).
  4. A toggle with two buttons, "Sky" and "List view", with `aria-pressed`.
  5. `Sky` or `ListView`.
- `Sky` is an SVG with `viewBox="0 0 1000 640"` and `width="100%"`. It sits in a card with the dark ink background in both themes (`bg-ink` with light star colours), so it reads as a night sky. For each region it draws its stars at `starPositions(count, x, y, 56)`, lines between same-region `easierAfter` pairs, and the region name under it in the display font. Each region is a `<g role="button" tabIndex={0}>` with a transparent hit circle of radius 64, an `aria-label` of "<name>, <proven> of <total> stars proven" (or "<name>, being charted"), and Enter or Space to select. Star fill by state: unexplored is an outline only, visited is the muted colour, practised is `--accent` and proven is `--hi`. Charted regions draw three faint placeholder dots and a dashed outline.
- `RegionPanel` opens below the sky on phones and to its right from `lg:` up (a two-column grid). It shows the name, blurb (or teaser) and lit count, then one row per star. Each row is a link to `/learn/<id>?from=map`, at least 56 px tall, with the title, competency and a state chip whose text says the state. For a charted region it shows "Being charted", the teaser, and a link to the `nearest` star ("Start nearby: <title>").
- `ListView` is nested lists: regions (as `h3`) with their stars as links, each with the state in text. Charted regions get a "Being charted" item.

- [ ] **Step 1: Write the failing test** `tests/layout.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { starPositions } from "../lib/map/layout";

describe("starPositions", () => {
  it.each([1, 3, 6, 11, 14])("places %i stars inside the radius, apart from each other", (n) => {
    const pts = starPositions(n, 500, 300, 56);
    expect(pts).toHaveLength(n);
    for (const p of pts) expect(Math.hypot(p.x - 500, p.y - 300)).toBeLessThanOrEqual(56);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++)
      expect(Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y)).toBeGreaterThan(56 * 0.2);
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run tests/layout.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `starPositions`, then the components and the page.** Delete the "Beyond the path" Research and Bogleheads cards from `app/learn/page.tsx`. The stars now reach both.

- [ ] **Step 4: Run tests, types and build**

Run: `npm test && npm run lint && npm run build`
Expected: pass.

- [ ] **Step 5: Check phone width and keyboard with Playwright**

Write `scripts/check-map.mjs` (kept in the repo for later phases). It starts from `BASE_URL` (default `http://localhost:3000`), opens `/learn` at 360 × 740, and:
- asserts `document.documentElement.scrollWidth <= 360`;
- asserts every `[role=button]` in the SVG and every region-panel link has a bounding box of at least 44 × 44;
- presses Tab until a region is focused, presses Enter, and asserts the panel heading shows that region's name;
- clicks "List view" and asserts 11 `h3` headings;
- saves a screenshot to `/tmp/map-360.png` for a person to look at.

Run: `npm run build && (npx next start -p 3000 & sleep 4) && node scripts/check-map.mjs`
Expected: "map checks passed" and a screenshot. Look at the screenshot in both themes: run once with `colorScheme: "dark"` in the browser context.

- [ ] **Step 6: Commit**

```bash
git add lib/map/layout.ts components/map app/learn/page.tsx tests/layout.test.ts scripts/check-map.mjs
git commit -m "Draw the learning map as a sky of 11 constellations"
```

---

### Task 13: Retire the old path

**Files:**
- Delete: `components/LessonRunner.tsx`, `components/LearnPath.tsx`, `lib/learn/lessons.ts`
- Modify: `components/HomeDashboard.tsx`, `components/ProgressView.tsx`, `components/FeatureCards.tsx`, `app/page.tsx`, `lib/game/progress.tsx` (remove `setLesson`), `tests/content.test.ts`

**Interfaces:**
- Consumes: `CATALOG` (Task 4), `stateOf`, `regionLit`, `continueTarget` (Task 7), `REGIONS` (Task 1).

- [ ] **Step 1: Replace the lesson-based tests.** In `tests/content.test.ts`, replace the two Task 5 tests that import `LESSONS` with:

```ts
const LESSON_DRILLS: Record<string, string[]> = {
  "income-statement": ["gross_margin", "operating_margin", "net_margin"],
  "balance-sheet": ["current_ratio", "debt_to_equity"],
  // Copy the other nine entries from lib/learn/lessons.ts before deleting it.
};
it("keeps every lesson as a star with its drills", () => {
  for (const [id, drills] of Object.entries(LESSON_DRILLS)) expect(nodeById(id)?.work.drills).toEqual(drills);
});
```

Fill in all 11 entries from `lib/learn/lessons.ts` before you delete it. The test must list 11 IDs.

- [ ] **Step 2: Update the callers.**
- `HomeDashboard`: "x / N lessons" becomes "x / N stars proven" (N = `CATALOG.length`). The next-lesson link becomes `continueTarget(...)`'s star title linking to `/learn/<id>?from=continue`, or "Open the map" linking to `/learn` when there is none.
- `ProgressView`: the Lessons section becomes "Constellations": one row per region with built stars, showing `regionLit` as a bar and "p / t proven".
- `FeatureCards` Learn card body: "A map of finance in 11 constellations. Start anywhere, go as deep as you like."
- `app/page.tsx` chip: "Finance for everyone · 11 constellations".
- `lib/game/progress.tsx`: remove `setLesson` from `Ctx` and the value.

- [ ] **Step 3: Delete the three files.**

Run: `git rm components/LessonRunner.tsx components/LearnPath.tsx lib/learn/lessons.ts`

- [ ] **Step 4: Check nothing still imports them**

Run: `! grep -rn "learn/lessons\|LessonRunner\|LearnPath\|PASS_MARK\|setLesson" app components lib tests && npm run lint && npm test && npm run build`
Expected: the grep finds nothing, and all checks pass.

- [ ] **Step 5: Commit**

```bash
git add -A components app lib tests
git commit -m "Retire the fixed learning path now that the map replaces it"
```

---

### Task 14: Hidden coverage report and the CFA string ban

**Files:**
- Create: `lib/map/coverage.ts`, `scripts/coverage.ts`, `tests/hidden-cfa.test.ts`
- Modify: `package.json` (add `tsx` and the script), `app/about/page.tsx`, `app/research/page.tsx`, `lib/game/questions.ts`
- Test: `tests/hidden-cfa.test.ts`, `tests/coverage.test.ts`

**Interfaces:**
- Consumes: `MODULES` (Task 1), `NODES` (Task 4).
- Produces: `export function coverage(nodes: MapNode[]): { topic: TopicCode; modules: number; modulesCovered: number; outcomes: number; outcomesTagged: number }[]`. A module is covered when any star has it as `cfa.module` or has an outcome inside it. `outcomesTagged` counts distinct outcome IDs.

- [ ] **Step 1: Write the failing tests**

`tests/coverage.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { coverage } from "../lib/map/coverage";
import { NODES } from "../content/map";

describe("coverage", () => {
  it("adds up to the registry and counts phase 1 tags", () => {
    const rows = coverage(NODES);
    expect(rows.reduce((s, r) => s + r.modules, 0)).toBe(102);
    expect(rows.reduce((s, r) => s + r.outcomes, 0)).toBe(340);
    const fsa = rows.find((r) => r.topic === "FSA")!;
    expect(fsa.modulesCovered).toBeGreaterThanOrEqual(7);
  });
});
```

`tests/hidden-cfa.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["app", "components", "content", "lib"];
const ALLOW = new Set(["lib/map/curriculum.ts"]);
const BANNED = /\bCFA\b|Chartered Financial Analyst/;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(tsx?|css|md|json)$/.test(p) ? [p] : [];
  });
}

describe("hidden CFA", () => {
  it("keeps CFA out of every learner-facing file", () => {
    const hits = ROOTS.flatMap(files).filter((f) => !ALLOW.has(f) && BANNED.test(readFileSync(f, "utf8")));
    expect(hits).toEqual([]);
  });
  it("never imports the hidden registry into the UI", () => {
    const hits = ["app", "components"].flatMap(files).filter((f) => /map\/curriculum/.test(readFileSync(f, "utf8")));
    expect(hits).toEqual([]);
  });
  it("keeps full star content out of client components", () => {
    const client = ROOTS.flatMap(files).filter((f) => /^["']use client["']/.test(readFileSync(f, "utf8")));
    const hits = client.filter((f) => /from ["']@\/content\/map(["']|\/(?!catalog["'])[^"']+["'])/.test(readFileSync(f, "utf8")));
    expect(hits).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run tests/coverage.test.ts tests/hidden-cfa.test.ts`
Expected: coverage fails (no module). The CFA test lists `app/about/page.tsx`, `app/research/page.tsx`, `lib/game/questions.ts` and any other remaining hits.

- [ ] **Step 3: Reword the remaining hits.**
- `app/about/page.tsx`: change "using average balances as the CFA curriculum does" to "using average balances, as standard analysis does". Delete the `<li>` about trademarks and replace it with `<li>Topics, explanations and questions are written by us. Further reading links to free books such as OpenStax. See <Link href="/credits">Credits</Link>.</li>`.
- `app/research/page.tsx`: change "CFA Institute and the authors do not endorse this project." to "The journal's publisher and the authors do not endorse this project."
- `lib/game/questions.ts` (roa drill `why`): "Analysts average opening and closing balances when a flow (net income) is divided by a stock (assets)."
- Any comment hits: reword them. Comments count, because the test scans source files.

- [ ] **Step 4: Implement `lib/map/coverage.ts` and `scripts/coverage.ts`.** The script prints a table with columns Topic, Modules covered, Outcomes tagged and Total, plus a total row.

Run: `npm i -D tsx` and add `"coverage:hidden": "tsx scripts/coverage.ts"` to `package.json` scripts.

- [ ] **Step 5: Run**

Run: `npm test && npm run lint && npm run coverage:hidden`
Expected: tests pass, and the table prints FSA with at least 7 of 12 modules covered.

- [ ] **Step 6: Commit**

```bash
git add lib/map/coverage.ts scripts/coverage.ts tests package.json package-lock.json app/about/page.tsx app/research/page.tsx lib/game/questions.ts
git commit -m "Track hidden coverage and keep CFA out of learner-facing text"
```

---

### Task 15: Credits, analytics and the originality check

**Files:**
- Create: `app/credits/page.tsx`, `lib/analytics.ts`, `lib/map/originality.ts`, `scripts/originality.ts`
- Modify: `app/layout.tsx`, `components/map/MapView.tsx`, `components/node/NodeShell.tsx`, `components/node/ProveIt.tsx`, `components/map/TrailCards.tsx`, `components/map/StartHere.tsx`, `components/Shell.tsx` (footer link), `package.json`
- Test: `tests/analytics.test.ts`, `tests/originality.test.ts`

**Interfaces:**
- Consumes: `NODES`, `SOURCES`, `TRAILS`, and the provider's `seeMap` and `markFirstStarSent`.
- Produces:
  ```ts
  // lib/analytics.ts
  export type EventName = "map-first-visit" | "star-open" | "first-star-under-2m" | "depth" | "proven" | "trail-start" | "trail-done";
  export type OpenSource = "map" | "trail" | "continue" | "start-here" | "link" | "direct";
  export function eventPath(name: EventName, detail?: string): string;     // "ev/star-open/map"
  export function openSource(search: string, referrer: string): OpenSource;
  export function track(name: EventName, detail?: string): void;           // no-op without window.goatcounter
  // lib/map/originality.ts
  export function sharedRuns(ours: string, theirs: string, n?: number): string[];   // default n = 10
  ```

- [ ] **Step 1: Write the failing tests**

```ts
// tests/analytics.test.ts
import { describe, expect, it } from "vitest";
import { eventPath, openSource } from "../lib/analytics";

describe("analytics", () => {
  it("builds event paths", () => {
    expect(eventPath("star-open", "map")).toBe("ev/star-open/map");
    expect(eventPath("map-first-visit")).toBe("ev/map-first-visit");
  });
  it("reads where a star was opened from", () => {
    expect(openSource("?from=trail", "")).toBe("trail");
    expect(openSource("?from=weird", "https://x.test")).toBe("link");
    expect(openSource("", "")).toBe("direct");
  });
});
```

```ts
// tests/originality.test.ts
import { describe, expect, it } from "vitest";
import { sharedRuns } from "../lib/map/originality";

describe("sharedRuns", () => {
  it("finds a 10-word overlap regardless of case and punctuation", () => {
    const theirs = "The time value of money is the idea that money today is worth more than money later.";
    const ours = "Put simply, money today is worth more than money later, because it can earn.";
    expect(sharedRuns(ours, theirs, 8)).toEqual(["money today is worth more than money later"]);
    expect(sharedRuns(ours, theirs, 10)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run tests/analytics.test.ts tests/originality.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement analytics.**
- `app/layout.tsx`: read `process.env.NEXT_PUBLIC_GOATCOUNTER_CODE`. When it is set, add `<Script data-goatcounter={`https://${code}.goatcounter.com/count`} src="https://gc.zgo.at/count.js" strategy="afterInteractive" />` from `next/script`.
- `track` calls `window.goatcounter?.count({ path, title: path, event: true })` inside try/catch.
- Wire the events from spec R10. `NodeShell` sends `star-open/<openSource(...)>` once per page load. The first time `firstStarSent` is false and `Date.now() − firstSeen ≤ 120000`, it also sends `first-star-under-2m`. Either way it then calls `markFirstStarSent()`. `DepthTabs` sends `depth/<depth>`. `ProveIt` sends `proven` when `firstProven`. `TrailCards` and `StartHere` send `trail-start/<id>`. `NodeShell` sends `trail-done/<id>` when visiting the active trail's last star.
- Learner links add `?from=` as listed in Task 12.

- [ ] **Step 4: Implement the originality check.** `sharedRuns` lowercases, strips punctuation to spaces, splits on whitespace, then returns each maximal run of at least `n` consecutive words in `ours` that also appears in `theirs` (joined with single spaces, without duplicates). `scripts/originality.ts` reads `OPENSTAX_DIR`. When that is unset or missing, it prints "OPENSTAX_DIR not set: originality check skipped" and exits 0. Otherwise it reads every `.txt` there, collects every learner string from `NODES` (Get it, analogy, Work it intro and notes, Prove it stems, options and whys), prints any run of 10 or more words with its star ID, and exits 1 if there are any. Add `"check:originality": "tsx scripts/originality.ts"` to `package.json`.

- [ ] **Step 5: Create `app/credits/page.tsx`.** It is a server page listing:
  - "Further reading": the distinct books behind `furtherReading` links (for now OpenStax *Principles of Finance 2e*, Rice University, CC BY-NC-SA 4.0, linked and not adapted), with a link to each star that cites it.
  - "Sources we check against": every register source used by a star, with title, link and `license`.
  - "Our content": "Our explanations and questions are CC BY-SA 4.0. The code is MIT."

  Add a "Credits" link next to "About" in the `Shell` footer.

- [ ] **Step 6: Run everything**

Run: `npm test && npm run lint && npm run build && npm run check:originality`
Expected: all pass, and the originality script prints the skip notice.

- [ ] **Step 7: Commit**

```bash
git add lib/analytics.ts lib/map/originality.ts scripts/originality.ts app components tests package.json
git commit -m "Add credits, privacy-friendly event counts and the originality check"
```

---

### Task 16: Financial Statements enrichment (R11)

**Files:**
- Create: `content/map/financial-statements/{cash-vs-accrual,capitalize-or-expense,common-size}.ts`
- Modify: `content/map/index.ts`, `content/map/catalog.ts`, `lib/map/trails.ts` (insert `cash-vs-accrual` into `company-health` after `income-statement`, which makes 8 stars), `tests/trails.test.ts` (no change needed if the bounds hold)

These are new stars, written from scratch using spec §8, with these settings:

| Star | Competency | `cfa` | `easierAfter` | Further reading slug | `sources` | Visual |
|---|---|---|---|---|---|---|
| cash-vs-accrual | I can explain why profit and cash are different numbers | FSA.02 / FSA.02.1, FSA.02.2 | income-statement | 4-1-cash-versus-accrual-accounting | sec-fs-guide, investor-gov-fs | bars |
| capitalize-or-expense | I can explain when a cost goes on the balance sheet instead of the income statement | FSA.02 / FSA.02.2, FSA.07.1 | income-statement, balance-sheet | 4-4-when-should-a-company-capitalize-or-expense-an-item | sec-fs-guide, ifrs-framework (person check) | flow |
| common-size | I can read a statement as percentages to compare companies of any size | FSA.02 / FSA.02.5, FSA.03.5, FSA.05.1 | income-statement, balance-sheet | 5-7-common-size-statements | sec-fs-guide, saylor-bus202 | bars |

`common-size` gets `activities: ["game:mystery-ledger"]` and `drills: ["gross_margin", "operating_margin"]`. You may read the OpenStax section *titles* to scope a star, but do not open the section text while writing, and never paste it into AI.

- [ ] **Step 1: Write the three stars** and add them to the index.
- [ ] **Step 2: Run** `npm test && npm run lint && npm run coverage:hidden`. Expected: pass, and the FSA module count is unchanged or higher.
- [ ] **Step 3: Run** `OPENSTAX_DIR=<folder with the chapter text files> npm run check:originality` if a person has the files locally. Expected: no runs reported. Otherwise note in the PR that the check still needs a run.
- [ ] **Step 4: Commit**

```bash
git add content/map lib/map/trails.ts
git commit -m "Enrich Financial Statements with three new stars"
```

---

### Task 17: Final verification and handoff

- [ ] **Step 1: Full checks**

Run: `npm ci && npm run lint && npm test && npm run build && npm run coverage:hidden`
Expected: all pass. Paste the coverage table into the PR description.

- [ ] **Step 2: Hidden-tag scan of the build**

Run: `! grep -rE "FSA\.[0-9]{2}|QM\.[0-9]{2}|\"cfa\"|\bCFA\b" .next/server/app .next/static`
Expected: no matches.

- [ ] **Step 3: Phone and theme check**

Run: `(npx next start -p 3000 &) && sleep 4 && node scripts/check-map.mjs`
Expected: "map checks passed". Take 360 px screenshots of `/learn`, `/learn/income-statement` and `/learn/income-statement/prove` in light and dark at `deviceScaleFactor: 2`, and attach them to the PR.

- [ ] **Step 4: Migration check by hand**

In a fresh browser profile, set `localStorage["ledger-progress-v1"]` to the `v1` fixture from `tests/progress-model.test.ts` and open `/learn`. Expected: The Income Statement shows proven, The Balance Sheet shows practised, XP is 320, and the "First Entry" badge is still on `/progress`.

- [ ] **Step 5: Open the PR.** Mirror any PR template. The description lists: what changed per requirement R1 to R11; the PR #7 status (Task 10); that `NEXT_PUBLIC_GOATCOUNTER_CODE` must be set in Vercel by Harshil to turn on analytics; the coverage table; the screenshots; and whether the originality check was run with the OpenStax files.

---

## Later phases (outline only; each gets its own plan)

Every later phase reuses this plan's machinery unchanged: new star files, the same lints, the same register and trails. Each phase plan lists its stars in the same table format as Tasks 5, 6 and 16.

| Phase | Stars to plan | New pieces |
|---|---|---|
| 2 | Time Value of Money (OpenStax ch. 7 to 9 as scope), Statistics for Finance (ch. 13, 14) | Question-led search over `aliases`; the "what do I already know?" check (about 10 questions per region marking stars proven) |
| 3 | Bonds (ch. 10, 3.4, 12.3), Stocks (ch. 11, 12), The Financial Manager (ch. 2, 16 to 19) | Bond price seesaw game; build-the-factory NPV game; TreasuryDirect sources |
| 4 | Economic Foundations, How to Think About Investing (ch. 15), Managing Risk (ch. 20) | Central bank sandbox; payoff builder; spaced review (2, 7 and 21 days) |
| 5 | Alternative Investments, Why Ethics Matter | Judgment Call stories; fee waterfall game; Investor.gov bulletins and SEC release IA-5248 as sources |
