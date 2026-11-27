// The arithmetic behind the Bogleheads chapters. Pure functions, no React, so they are easy to test.

/** Future value of a level payment. `due` = paid at the start of each period (annuity due). */
export function fvAnnuity(pmt: number, r: number, n: number, due = false): number {
  const f = r === 0 ? n : ((1 + r) ** n - 1) / r;
  return pmt * f * (due ? 1 + r : 1);
}

/** The level payment that grows to `fv` in n periods. */
export function pmtForTarget(fv: number, r: number, n: number, due = false): number {
  return fv / fvAnnuity(1, r, n, due);
}

/** Present value of a single amount. */
export const pv = (fv: number, r: number, n: number) => fv / (1 + r) ** n;

/** Present value of cash flows c[0] at t = 1, c[1] at t = 2, ... */
export const npv = (r: number, flows: number[]) => flows.reduce((s, c, i) => s + c / (1 + r) ** (i + 1), 0);

/** The yield y at which the cash flows are worth `price` (bisection, so it never diverges). */
export function yieldFor(price: number, flows: number[]): number {
  let lo = -0.99;
  let hi = 1;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    if (npv(mid, flows) > price) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** The rate at which `now` today and `later` in n years are worth the same. */
export const breakEvenRate = (now: number, later: number, n: number) => (later / now) ** (1 / n) - 1;

export const aprToApy = (apr: number, m: number) => (1 + apr / m) ** m - 1;
export const apyToApr = (apy: number, m: number) => ((1 + apy) ** (1 / m) - 1) * m;

/** Real return from nominal return and inflation (Fisher). */
export const realReturn = (nominal: number, inflation: number) => (1 + nominal) / (1 + inflation) - 1;

// ---------- Saving rate ----------

/** Balance after `years` of saving a share of a flat income, invested at year end (the wiki's table). */
export const savedBalance = (rate: number, ret: number, income: number, years = 30) => fvAnnuity(rate * income, ret, years);

/** The return a saver at `rateB` needs to match a saver at `rateA` earning `retA`. */
export function matchingReturn(rateA: number, retA: number, rateB: number, years = 30): number {
  const target = savedBalance(rateA, retA, 1, years);
  let lo = -0.5;
  let hi = 1;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    if (savedBalance(rateB, mid, 1, years) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Years until savings cover spending (our extension of the wiki page). Spending is the part of income
 * not saved, the goal is spending / withdrawal rate, and savings earn a real return r:
 *   s·((1+r)^N − 1)/r = (1 − s)/WR   =>   N = ln(1 + r(1 − s)/(s·WR)) / ln(1 + r)
 */
export function yearsToIndependence(s: number, r: number, wr: number): number {
  if (s <= 0) return Infinity;
  if (s >= 1) return 0;
  const k = (1 - s) / (s * wr);
  return r === 0 ? k : Math.log(1 + r * k) / Math.log(1 + r);
}

// ---------- Saving early ----------

/** Balance by age for someone who saves `pmt` at the start of each year from `start` to `end`. */
export function balancePath(start: number, end: number, pmt: number, r: number, fromAge = 20): { age: number; bal: number }[] {
  const out: { age: number; bal: number }[] = [];
  let bal = 0;
  for (let age = fromAge; age <= end; age++) {
    out.push({ age, bal });
    if (age >= start && age < end) bal += pmt;
    bal *= 1 + r;
  }
  return out;
}

// ---------- Costs (Bogle 2005) ----------

export interface CostDrag {
  free: number; // ending value with no costs
  net: number; // ending value after costs
  paid: number; // free − net: what the system kept, with compounding
  investorShare: number; // share of the cost-free profit the investor keeps
  crossover: number | null; // first year the system's cumulative take exceeds the investor's profit
}

export function costDrag(gross: number, cost: number, years: number, start = 1000): CostDrag {
  const free = start * (1 + gross) ** years;
  const net = start * (1 + gross - cost) ** years;
  let crossover: number | null = null;
  for (let t = 1; t <= years; t++) {
    const take = start * ((1 + gross) ** t - (1 + gross - cost) ** t);
    const profit = start * ((1 + gross - cost) ** t - 1);
    if (take > profit) {
      crossover = t;
      break;
    }
  }
  return { free, net, paid: free - net, investorShare: (net - start) / (free - start), crossover };
}

/** Bogle's Tables 1 and 2: 1983–2003, S&P 500 index fund vs the average equity fund and its investors. */
export const BOGLE_LADDER = [
  { label: "Stock market (S&P 500)", ret: 13.0, note: "gross return" },
  { label: "Index fund", ret: 12.8, note: "after about 0.2 points of cost" },
  { label: "Average equity fund", ret: 10.0, note: "after about 3.0 points of cost and lag" },
  { label: "Average fund investor", ret: 6.3, note: "after 3.7 more points lost to bad timing" },
] as const;

/** Profit per $1 after n years at an annual return. */
export const profitPerDollar = (ret: number, n: number) => (1 + ret) ** n - 1;

// ---------- Portfolio rules of thumb ----------

export type BondRule = "age" | "age-10" | "age-20";

/** Bond share from an age rule, kept inside Graham's 25%–75% band. */
export function bondShare(age: number, rule: BondRule): number {
  const raw = rule === "age" ? age : rule === "age-10" ? age - 10 : age - 20;
  return Math.min(0.75, Math.max(0.25, raw / 100));
}

export interface ThreeFund {
  us: number;
  intl: number;
  bonds: number;
  er: number; // blended expense ratio
  crashDrop: number; // fall if stocks drop 50% and bonds are flat
}

/** Split into the three-fund portfolio. `intlShare` is the international share of the stock part. */
export function threeFund(bonds: number, intlShare: number, ers = { us: 0.0003, intl: 0.0006, bonds: 0.0003 }): ThreeFund {
  const stocks = 1 - bonds;
  const us = stocks * (1 - intlShare);
  const intl = stocks * intlShare;
  return { us, intl, bonds, er: us * ers.us + intl * ers.intl + bonds * ers.bonds, crashDrop: stocks * 0.5 };
}

export interface Rebalance {
  stocksNow: number; // stock share after the market move
  drift: number; // stocksNow − target, in share points
  act: boolean; // drift beyond the band
  trade: number; // amount of stock to sell (+) or buy (−) per $1 of portfolio, to restore target
}

export function rebalance(target: number, stockMove: number, bondMove: number, band: number): Rebalance {
  const s = target * (1 + stockMove);
  const b = (1 - target) * (1 + bondMove);
  const total = s + b;
  const stocksNow = s / total;
  const drift = stocksNow - target;
  return { stocksNow, drift, act: Math.abs(drift) > band, trade: drift };
}
