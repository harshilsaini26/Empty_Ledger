// Small, dependency-free implementations of the models in the three research papers.
// They power the interactive labs on /research and are covered by tests/research.test.ts.

export type Mat = number[][];

export function inv(a: Mat): Mat {
  const n = a.length;
  const m = a.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r;
    if (Math.abs(m[p][c]) < 1e-12) throw new Error("Matrix is singular");
    [m[c], m[p]] = [m[p], m[c]];
    const d = m[c][c];
    for (let k = 0; k < 2 * n; k++) m[c][k] /= d;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = m[r][c];
      if (f) for (let k = 0; k < 2 * n; k++) m[r][k] -= f * m[c][k];
    }
  }
  return m.map((row) => row.slice(n));
}

export const mulMV = (a: Mat, v: number[]) => a.map((row) => row.reduce((s, x, j) => s + x * v[j], 0));
const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);

// ---------------------------------------------------------------------------
// 1. Enhanced Portfolio Optimization (Pedersen, Babu & Levine, FAJ 2021)
// ---------------------------------------------------------------------------

/** Shrunk covariance: Sigma_w = sigma [ (1 - w) Omega + w I ] sigma   (their Eq. 19 with V = sigma^2). */
export function shrunkCov(vol: number[], corr: Mat, w: number): Mat {
  return corr.map((row, i) => row.map((c, j) => vol[i] * vol[j] * (i === j ? 1 : (1 - w) * c)));
}

export interface EpoResult {
  weights: number[]; // scaled to the target volatility
  grossLeverage: number; // sum |weights|
  exAnteSharpe: number; // using the unshrunk risk model
}

/**
 * Simple EPO (their Eq. 20): EPO_s(w) = (1/gamma) Sigma_w^{-1} s.
 * w = 0 is standard mean-variance optimization, w = 1 ignores correlations entirely.
 * Weights are rescaled to a target ex-ante volatility (gamma drops out, as the paper notes).
 */
export function simpleEpo(vol: number[], corr: Mat, signal: number[], w: number, targetVol = 0.1): EpoResult {
  const raw = mulMV(inv(shrunkCov(vol, corr, w)), signal);
  const full = shrunkCov(vol, corr, 0);
  const variance = dot(raw, mulMV(full, raw));
  const k = targetVol / Math.sqrt(variance);
  const weights = raw.map((x) => x * k);
  return {
    weights,
    grossLeverage: weights.reduce((s, x) => s + Math.abs(x), 0),
    exAnteSharpe: dot(raw, signal) / Math.sqrt(variance),
  };
}

/** Eigenvalues of a small symmetric matrix by Jacobi rotations (for showing "problem portfolios"). */
export function eigenvalues(a: Mat): number[] {
  const n = a.length;
  const m = a.map((r) => [...r]);
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += m[i][j] ** 2;
    if (off < 1e-14) break;
    for (let p = 0; p < n; p++)
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(m[p][q]) < 1e-15) continue;
        const theta = (m[q][q] - m[p][p]) / (2 * m[p][q]);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        for (let k = 0; k < n; k++) {
          const mkp = m[k][p];
          const mkq = m[k][q];
          m[k][p] = c * mkp - s * mkq;
          m[k][q] = s * mkp + c * mkq;
        }
        for (let k = 0; k < n; k++) {
          const mpk = m[p][k];
          const mqk = m[q][k];
          m[p][k] = c * mpk - s * mqk;
          m[q][k] = s * mpk + c * mqk;
        }
      }
  }
  return m.map((r, i) => r[i]).sort((x, y) => y - x);
}

// ---------------------------------------------------------------------------
// 2. Buffett's Alpha (Frazzini, Kabiller & Pedersen, FAJ 2018)
// ---------------------------------------------------------------------------

/** Leverage L = (TA - Cash) / Equity, all at market value. */
export const buffettLeverage = (totalAssets: number, cash: number, equity: number) => (totalAssets - cash) / equity;

/** Excess return of the levered holding company: [w (r_priv - rf) + (1 - w)(r_pub - rf)] * L. */
export const leveredExcess = (wPrivate: number, privExcess: number, pubExcess: number, L: number) =>
  (wPrivate * privExcess + (1 - wPrivate) * pubExcess) * L;

/** Annualized alpha of Berkshire's stock as factors are added (Table 4, 10/1976 to 3/2017). */
export const BUFFETT_ALPHA_STEPS = [
  { model: "Market only", factors: "MKT", alpha: 13.4, t: 4.01 },
  { model: "+ size, value, momentum", factors: "MKT, SMB, HML, UMD", alpha: 11.0, t: 3.3 },
  { model: "+ betting against beta", factors: "… + BAB", alpha: 8.5, t: 2.55 },
  { model: "+ quality minus junk", factors: "… + QMJ", alpha: 5.4, t: 1.55 },
] as const;

/** Same exercise for the portfolio of public stocks in Berkshire's 13F filings (4/1980 to 3/2017). */
export const PUBLIC_ALPHA_STEPS = [
  { model: "Market only", alpha: 5.8, t: 3.09 },
  { model: "+ size, value, momentum", alpha: 4.5, t: 2.46 },
  { model: "+ betting against beta", alpha: 3.0, t: 1.62 },
  { model: "+ quality minus junk", alpha: 0.3, t: 0.16 },
] as const;

// ---------------------------------------------------------------------------
// 3. Redefining the Optimal Retirement Income Strategy (Blanchett, FAJ 2023)
// ---------------------------------------------------------------------------

/**
 * Utility of income as a fraction of the goal, x = i / g (their Eqs. 3 to 5, written per unit of goal).
 * Needs are painful to miss (gamma_n = 4), wants are linear (gamma_w = 1), excess has diminishing value (gamma_e = 0.25).
 */
export function goalUtility(x: number, need: number, gN = 4, gW = 1, gE = 0.25): number {
  if (x <= 0) return 0;
  if (x <= need) return need * Math.pow(x / need, gN);
  if (x <= 1) return need + (1 - need) * Math.pow((x - need) / (1 - need), gW);
  return Math.pow(x, gE);
}

/** Wants spending change by wants funded ratio (Table 1). Linear between the listed points. */
const ADJ: [number, number][] = [
  [0, -0.2], [0.25, -0.15], [0.5, -0.1], [0.75, -0.05], [1, 0], [1.25, 0.02], [1.5, 0.04], [1.75, 0.08], [2, 0.1],
];
export function wantsAdjustment(fr: number): number {
  if (fr <= 0) return ADJ[0][1];
  if (fr >= 2) return ADJ[ADJ.length - 1][1];
  for (let k = 1; k < ADJ.length; k++) {
    const [x1, y1] = ADJ[k];
    const [x0, y0] = ADJ[k - 1];
    if (fr <= x1) return y0 + ((fr - x0) / (x1 - x0)) * (y1 - y0);
  }
  return 0;
}

export interface RetireInputs {
  savings: number;
  goal: number; // total real income goal per year
  needShare: number; // fraction of the goal that is "needs"
  pension: number; // guaranteed real income per year
  equity: number; // static equity allocation 0..1
  years?: number;
  runs?: number;
  seed?: number;
}
export interface RetireResult {
  probSuccess: number; // static spending: share of runs that never run out
  goalCompletion: number; // dynamic spending: certainty-equivalent utility income / goal
  percentiles: { p: number; path: number[] }[]; // real total income by year, dynamic strategy
  depletedShare: number; // dynamic strategy: share of runs where the portfolio hits zero
}

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1e9) / 1e9;
  };
}
function gauss(r: () => number) {
  const u = Math.max(r(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}
const pvAnnuity = (amount: number, rate: number, n: number) => (n <= 0 ? 0 : rate === 0 ? amount * n : (amount * (1 - Math.pow(1 + rate, -n))) / rate);

/**
 * Monte Carlo in real terms using the paper's Appendix A capital-market assumptions
 * (equity 7.5% / 20%, bonds 2.5% / 5%, zero correlation, inflation 2%, discount rates 3/5/4%).
 * Static strategy: always spend the goal. Dynamic strategy: needs fixed, wants adjusted each year by Table 1.
 */
export function simulateRetirement(inp: RetireInputs): RetireResult {
  const T = inp.years ?? 30;
  const R = inp.runs ?? 1000;
  const r = rng(inp.seed ?? 7);
  const infl = 0.02;
  const real = (nom: number) => (1 + nom) / (1 + infl) - 1;
  const [rp, rn, rw] = [real(0.03), real(0.05), real(0.04)];
  const needs = inp.goal * inp.needShare;
  const wants0 = inp.goal - needs;
  const lambda = 2;

  let survived = 0;
  let depleted = 0;
  const II: number[] = [];
  const incomes: number[][] = Array.from({ length: T }, () => []);

  for (let run = 0; run < R; run++) {
    const rets: number[] = [];
    for (let t = 0; t < T; t++) {
      const eq = 0.075 + 0.2 * gauss(r);
      const bd = 0.025 + 0.05 * gauss(r);
      rets.push(real(inp.equity * eq + (1 - inp.equity) * bd));
    }
    // Static spending: probability of success.
    let A = inp.savings;
    let ok = true;
    for (let t = 0; t < T; t++) {
      A -= Math.max(0, inp.goal - inp.pension);
      if (A < 0) {
        ok = false;
        break;
      }
      A *= 1 + rets[t];
    }
    if (ok) survived++;

    // Dynamic spending with the wants funded ratio.
    A = inp.savings;
    let wants = wants0;
    let utilSum = 0;
    let hitZero = false;
    for (let t = 0; t < T; t++) {
      const left = T - t;
      if (t > 0) {
        const fr = wants > 0 ? (A + pvAnnuity(inp.pension, rp, left) - pvAnnuity(needs, rn, left)) / pvAnnuity(wants, rw, left) : 0;
        wants = Math.max(wants0 * 0.05, wants * (1 + wantsAdjustment(Math.max(0, fr))));
      }
      const want = needs + wants;
      const fromPortfolio = Math.min(Math.max(0, want - inp.pension), Math.max(0, A));
      const income = inp.pension + fromPortfolio;
      if (A <= 0 && want > inp.pension) hitZero = true;
      A = (A - fromPortfolio) * (1 + rets[t]);
      incomes[t].push(income);
      utilSum += goalUtility(income / inp.goal, inp.needShare) * inp.goal;
    }
    if (hitZero) depleted++;
    II.push(utilSum / T);
  }

  // Certainty equivalent (their Eq. 7): U = [ sum p_i II_i^(-lambda) ]^(-1/lambda), p_i = 1/R.
  const mean = II.reduce((s, x) => s + Math.pow(Math.max(x, 1e-9), -lambda), 0) / R;
  const U = Math.pow(mean, -1 / lambda);
  const pct = (arr: number[], p: number) => {
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.min(s.length - 1, Math.floor(p * s.length))];
  };
  return {
    probSuccess: survived / R,
    goalCompletion: U / inp.goal,
    percentiles: [0.05, 0.25, 0.5, 0.75, 0.95].map((p) => ({ p, path: incomes.map((col) => pct(col, p)) })),
    depletedShare: depleted / R,
  };
}

export { dot };
