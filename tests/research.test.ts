import { describe, expect, it } from "vitest";
import { buffettLeverage, eigenvalues, goalUtility, inv, leveredExcess, shrunkCov, simpleEpo, simulateRetirement, wantsAdjustment } from "../lib/research/models";
import { PAPERS } from "../lib/research/papers";

const VOL = [0.16, 0.17, 0.06];
const CORR = [
  [1, 0.9, -0.2],
  [0.9, 1, -0.2],
  [-0.2, -0.2, 1],
];
const S = [0.04, 0.03, 0.01];

describe("linear algebra helpers", () => {
  it("inverts a matrix", () => {
    const a = [[4, 7], [2, 6]];
    const b = inv(a);
    expect(b[0][0]).toBeCloseTo(0.6);
    expect(b[0][1]).toBeCloseTo(-0.7);
    expect(b[1][0]).toBeCloseTo(-0.2);
    expect(b[1][1]).toBeCloseTo(0.4);
  });
  it("finds eigenvalues of a correlation matrix that sum to its trace", () => {
    const e = eigenvalues(CORR);
    expect(e.reduce((s, x) => s + x, 0)).toBeCloseTo(3);
    expect(e[0]).toBeGreaterThan(e[2]);
  });
});

describe("Enhanced Portfolio Optimization", () => {
  it("w = 1 removes correlations; w = 0 keeps the sample covariance", () => {
    expect(shrunkCov(VOL, CORR, 1)[0][1]).toBe(0);
    expect(shrunkCov(VOL, CORR, 0)[0][1]).toBeCloseTo(0.16 * 0.17 * 0.9);
  });
  it("w = 1 gives weights proportional to s / sigma^2", () => {
    const { weights } = simpleEpo(VOL, CORR, S, 1);
    const ratio = (i: number) => weights[i] / (S[i] / VOL[i] ** 2);
    expect(ratio(0)).toBeCloseTo(ratio(1));
    expect(ratio(0)).toBeCloseTo(ratio(2));
  });
  it("shrinkage cuts the leverage plain MVO takes on near-duplicate assets", () => {
    const mvo = simpleEpo(VOL, CORR, S, 0);
    const epo = simpleEpo(VOL, CORR, S, 0.75);
    expect(epo.grossLeverage).toBeLessThan(mvo.grossLeverage);
    expect(mvo.exAnteSharpe).toBeGreaterThanOrEqual(epo.exAnteSharpe); // MVO always looks best ex ante
  });
});

describe("Buffett's Alpha", () => {
  it("computes leverage and the levered return identity", () => {
    expect(buffettLeverage(170, 0, 100)).toBeCloseTo(1.7);
    expect(buffettLeverage(180, 10, 100)).toBeCloseTo(1.7);
    expect(leveredExcess(0.65, 9.3, 12.0, 1.7)).toBeCloseTo((0.65 * 9.3 + 0.35 * 12) * 1.7);
  });
});

describe("Retirement income", () => {
  it("utility is continuous at the needs line and at the goal", () => {
    for (const n of [0.5, 0.7, 0.9]) {
      expect(goalUtility(n, n)).toBeCloseTo(n);
      expect(goalUtility(1, n)).toBeCloseTo(1);
      expect(goalUtility(1.0001, n)).toBeCloseTo(1, 3);
    }
    expect(goalUtility(0.5, 0.5)).toBeCloseTo(0.5); // Figure 3, panel A
    expect(goalUtility(0.5, 0.9)).toBeLessThan(0.11); // Figure 3, panel B: about 0.1
  });
  it("follows the wants adjustment table", () => {
    expect(wantsAdjustment(0)).toBe(-0.2);
    expect(wantsAdjustment(1)).toBe(0);
    expect(wantsAdjustment(1.5)).toBeCloseTo(0.04);
    expect(wantsAdjustment(3)).toBe(0.1);
  });
  it("base case: goal completion score well above probability of success", () => {
    const r = simulateRetirement({ savings: 1e6, goal: 80000, needShare: 0.7, pension: 40000, equity: 0.4, runs: 600 });
    expect(r.probSuccess).toBeGreaterThan(0.55);
    expect(r.probSuccess).toBeLessThan(0.9);
    expect(r.goalCompletion).toBeGreaterThan(0.9);
    expect(r.goalCompletion).toBeGreaterThan(r.probSuccess);
  });
});

describe("paper content", () => {
  it("every quiz question has a valid answer index and every paper has the key sections", () => {
    for (const p of PAPERS) {
      expect(p.summary.length).toBeGreaterThan(2);
      expect(p.learnings.length).toBeGreaterThan(2);
      expect(p.formulas.length).toBeGreaterThan(2);
      expect(p.quiz.length).toBe(5);
      for (const q of p.quiz) expect(q.answer).toBeLessThan(q.choices.length);
    }
  });
});
