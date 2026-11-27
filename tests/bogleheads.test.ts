import { describe, expect, it } from "vitest";
import katex from "katex";
import {
  aprToApy,
  apyToApr,
  bondShare,
  breakEvenRate,
  costDrag,
  fvAnnuity,
  matchingReturn,
  npv,
  pmtForTarget,
  profitPerDollar,
  pv,
  rebalance,
  savedBalance,
  threeFund,
  yearsToIndependence,
  yieldFor,
} from "../lib/bogleheads/models";
import { CHAPTERS } from "../lib/bogleheads/chapters";
import { PAPERS } from "../lib/research/papers";

describe("saving rate (wiki table)", () => {
  it("reproduces Alice and Bob", () => {
    expect(Math.round(savedBalance(0.04, 0.06, 100_000))).toBe(316_233);
    expect(Math.round(savedBalance(0.06, 0.04, 100_000))).toBe(336_510);
  });
  it("matches the table's corner cells", () => {
    expect(Math.round(savedBalance(0.01, 0.01, 100_000))).toBe(34_785);
    expect(Math.abs(savedBalance(0.01, 0.12, 100_000) - 241_333)).toBeLessThan(2);
  });
  it("a 2% saver needs a little over 8% to match a 1% saver at 12%", () => {
    const r = matchingReturn(0.01, 0.12, 0.02);
    expect(r).toBeGreaterThan(0.08);
    expect(r).toBeLessThan(0.085);
  });
  it("years to independence: about 51 at 10% and 17 at 50%", () => {
    expect(yearsToIndependence(0.1, 0.05, 0.04)).toBeCloseTo(51.4, 0);
    expect(yearsToIndependence(0.5, 0.05, 0.04)).toBeCloseTo(16.6, 0);
    expect(yearsToIndependence(0, 0.05, 0.04)).toBe(Infinity);
  });
});

describe("saving early (wiki examples)", () => {
  it("$6,000 at the start of each year at 4% from 25 to 65", () => {
    expect(fvAnnuity(6000, 0.04, 40, true)).toBeCloseTo(592_959.22, 1);
    expect(Math.round(fvAnnuity(6000, 0.04, 25, true) / 1000)).toBe(260);
    expect(Math.round(fvAnnuity(6000, 0.04, 10, true) / 1000)).toBe(75);
  });
  it("saving needed for $100,000 by 65", () => {
    expect(Math.round(pmtForTarget(100_000, 0.04, 40, true))).toBeCloseTo(1012, -1);
    expect(Math.round(pmtForTarget(100_000, 0.04, 25, true))).toBeCloseTo(2309, -1);
    expect(pmtForTarget(100_000, 0.04, 10, true)).toBeGreaterThan(8000);
  });
});

describe("comparing investments (wiki examples)", () => {
  it("values an annuity and a lump sum", () => {
    expect(npv(0.055, Array(20).fill(500))).toBeCloseTo(5975.19, 1);
    expect(pv(18_000, 0.04, 4)).toBeCloseTo(15_386.48, 1);
    expect(breakEvenRate(15_000, 18_000, 4)).toBeCloseTo(0.0466, 3);
  });
  it("the bond-like example is worth less than its price", () => {
    const flows = [100, 100, 100, 100, 1100];
    expect(npv(0.0625, flows)).toBeCloseTo(1156.9, 1);
    expect(yieldFor(npv(0.0625, flows), flows)).toBeCloseTo(0.0625, 6);
  });
  it("the quarterly NPV example", () => {
    expect(npv(0.03, [1000, 1200, 1500, 1700, 1800, 2000])).toBeCloseTo(8212.79, 1);
  });
  it("APR and APY round-trip", () => {
    expect(aprToApy(0.12, 12)).toBeCloseTo(0.126825, 5);
    expect(apyToApr(aprToApy(0.07, 4), 4)).toBeCloseTo(0.07, 10);
  });
});

describe("Bogle's humble arithmetic", () => {
  it("65 years at 8% with 2.5 points of cost", () => {
    const d = costDrag(0.08, 0.025, 65);
    expect(Math.round(d.free / 100) * 100).toBe(148_800);
    expect(Math.round(d.net / 100) * 100).toBe(32_500);
    expect(d.investorShare).toBeCloseTo(0.21, 2);
    expect(d.crossover).not.toBeNull();
  });
  it("Table 1 and 2 profits per $1 over 20 years", () => {
    expect(profitPerDollar(0.13, 20)).toBeCloseTo(10.52, 1);
    expect(profitPerDollar(0.128, 20)).toBeCloseTo(10.12, 1);
    expect(profitPerDollar(0.1, 20)).toBeCloseTo(5.73, 1);
    expect(profitPerDollar(0.063, 20)).toBeCloseTo(2.39, 1);
  });
  it("no costs means you keep everything", () => {
    expect(costDrag(0.07, 0, 30).investorShare).toBeCloseTo(1);
    expect(costDrag(0.07, 0, 30).crossover).toBeNull();
  });
});

describe("portfolio rules of thumb", () => {
  it("age in bonds, clamped to Graham's band", () => {
    expect(bondShare(45, "age")).toBeCloseTo(0.45);
    expect(bondShare(45, "age-20")).toBeCloseTo(0.25);
    expect(bondShare(90, "age")).toBeCloseTo(0.75);
  });
  it("three-fund weights sum to one", () => {
    const f = threeFund(0.4, 0.3);
    expect(f.us + f.intl + f.bonds).toBeCloseTo(1);
    expect(f.intl).toBeCloseTo(0.18);
    expect(f.crashDrop).toBeCloseTo(0.3);
  });
  it("rebalancing only fires outside the band", () => {
    expect(rebalance(0.6, 0, 0, 0.05).act).toBe(false);
    const r = rebalance(0.6, 0.4, 0, 0.05);
    expect(r.stocksNow).toBeCloseTo(0.84 / 1.24);
    expect(r.act).toBe(true);
  });
});

describe("chapter content", () => {
  it("every chapter has the key sections, valid quizzes and formulas that render", () => {
    expect(CHAPTERS).toHaveLength(6);
    const ids = new Set([...PAPERS, ...CHAPTERS].map((c) => c.id));
    expect(ids.size).toBe(PAPERS.length + CHAPTERS.length);
    for (const c of CHAPTERS) {
      expect(c.summary.length).toBeGreaterThan(2);
      expect(c.learnings.length).toBeGreaterThan(2);
      expect(c.formulas.length).toBeGreaterThan(2);
      expect(c.sources?.length).toBeGreaterThan(0);
      expect(c.quiz).toHaveLength(5);
      for (const q of c.quiz) expect(q.answer).toBeLessThan(q.choices.length);
      for (const f of c.formulas) expect(() => katex.renderToString(f.tex, { throwOnError: true })).not.toThrow();
    }
  });
});
