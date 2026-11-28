// TypeScript port of pipeline/finlab/valuation.py (dcf_defaults, dcf_value).
// The DCF tab recalculates in the browser as the learner moves a slider;
// tests/parity.test.ts checks this against the Python output.
import { div, getItem } from "./core";
import type { Statements } from "./types";

type N = number | null;

export interface Step {
  id: string;
  label: string;
  formula: string;
  inputs: Record<string, N>;
  value: N;
  unit: "pct" | "usd" | "usd_share";
}

export interface DcfAssumptions {
  base_year: number;
  revenue: number;
  fcff_margin: number;
  revenue_growth: number;
  rf: number;
  erp: number;
  beta: number;
  kd: number;
  tax: number;
  wd: number;
  terminal_growth: number;
  net_debt: number;
  shares: N;
}

export interface DcfRow {
  year: number;
  revenue: number;
  fcff: number;
  discount_factor: number;
  pv: number;
}

export interface DcfValuation {
  wacc: number;
  rows: DcfRow[];
  enterprise_value: N;
  equity_value: N;
  value_per_share: N;
  terminal_share: N;
  valid: boolean;
  steps: Step[];
}

export interface Dcf {
  assumptions: DcfAssumptions;
  history: Record<string, { revenue: number; fcff: number; margin: number }>;
  steps: Step[];
  valuation: DcfValuation;
}

const RF = 0.0425, ERP = 0.05, BETA = 1.0, G_TERM = 0.025, YEARS_OUT = 5;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const or = (v: N, d: number) => (v === null || v === 0 ? d : v);
const avg = (xs: N[]): N => {
  const v = xs.filter((x): x is number => x !== null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};
const step = (id: string, label: string, formula: string, inputs: Record<string, N>, value: N, unit: Step["unit"]): Step => ({
  id, label, formula, inputs, value, unit,
});

/** Starting assumptions read from the statements. `years` is every year present, oldest first. */
export function dcfDefaults(st: Statements, years: number[], analysisYears: number[]) {
  const g = (k: string, y: number | null) => getItem(st, k, y);
  const tax = (y: number) => {
    const t = div(g("income_tax", y), g("pretax_income", y));
    return t === null ? 0.21 : clamp(t, 0, 0.35);
  };
  const fcff = (y: number): N => {
    const cfo = g("cfo", y), capex = g("capex", y);
    return cfo === null || capex === null ? null : cfo + or(g("interest_expense", y), 0) * (1 - tax(y)) - capex;
  };
  const ys = analysisYears.filter((y) => or(g("revenue", y), 0) !== 0);
  if (ys.length < 2) return null;
  const y0 = ys[0], y1 = ys[ys.length - 1];
  const idx = years.indexOf(y1);
  const prev = idx > 0 ? years[idx - 1] : null;
  const history: Dcf["history"] = {};
  for (const y of ys) {
    const f = fcff(y);
    if (f !== null) history[String(y)] = { revenue: g("revenue", y)!, fcff: f, margin: f / g("revenue", y)! };
  }
  const last3 = ys.slice(-3).filter((y) => String(y) in history);
  const margin = avg(last3.map((y) => history[String(y)].margin));
  if (margin === null) return null;
  const rev0 = g("revenue", y0)!, revf = g("revenue", y1)!;
  const growth = rev0 > 0 && revf > 0 ? (revf / rev0) ** (1 / (y1 - y0)) - 1 : 0;
  const debt = or(g("total_debt", y1), 0);
  const avgDebt = avg([debt, prev === null ? null : g("total_debt", prev)]);
  const kd = div(g("interest_expense", y1), avgDebt);
  const eq = Math.max(or(g("equity", y1), 0), 0);
  const wd = div(debt, debt + eq);
  let shares: N = g("shares_diluted", y1) || g("shares_outstanding", y1);
  const implied = div(g("net_income", y1), g("eps_diluted", y1)); // some filers tag shares in millions
  if (implied && implied > 0 && (!shares || !(shares / implied > 0.5 && shares / implied < 2))) shares = implied;
  const a: DcfAssumptions = {
    base_year: y1, revenue: revf, fcff_margin: margin, revenue_growth: clamp(growth, -0.05, 0.15),
    rf: RF, erp: ERP, beta: BETA, kd: kd === null ? 0.05 : clamp(kd, 0.02, 0.12), tax: tax(y1),
    wd: wd === null ? 0 : clamp(wd, 0, 0.6), terminal_growth: G_TERM, net_debt: g("net_debt", y1) ?? 0, shares,
  };
  const steps = [
    step("fcff", `Free cash flow to the firm, FY${y1}`, "FCFF = CFO + interest × (1 − t) − capex",
      { CFO: g("cfo", y1), interest: or(g("interest_expense", y1), 0), t: a.tax, capex: g("capex", y1) }, fcff(y1), "usd"),
    step("fcff_margin", "FCFF margin (average of the last 3 years)", "m = avg(FCFF ÷ revenue)",
      Object.fromEntries(last3.map((y) => [`FY${y}`, history[String(y)].margin])), margin, "pct"),
    step("revenue_growth", `Revenue growth (CAGR FY${y0} to FY${y1}, capped at −5% to 15%)`,
      "g = (Rev_end ÷ Rev_start)^(1/n) − 1", { Rev_start: rev0, Rev_end: revf, n: y1 - y0 }, a.revenue_growth, "pct"),
    step("kd", "Pre-tax cost of debt (capped at 2% to 12%, 5% if unknown)", "k_d = interest ÷ average debt",
      { interest: g("interest_expense", y1), "average debt": avgDebt }, a.kd, "pct"),
    step("wd", "Debt weight (book values, capped at 60%)", "w_d = D ÷ (D + E)", { D: debt, E: eq }, a.wd, "pct"),
  ];
  return { assumptions: a, history, steps };
}

/** Value the firm from a set of assumptions. */
export function dcfValue(a: DcfAssumptions, yearsOut = YEARS_OUT): DcfValuation {
  const ke = a.rf + a.beta * a.erp;
  const kdAt = a.kd * (1 - a.tax);
  const wacc = a.wd * kdAt + (1 - a.wd) * ke;
  const rows: DcfRow[] = [];
  let pvSum = 0;
  for (let i = 1; i <= yearsOut; i++) {
    const revenue = a.revenue * (1 + a.revenue_growth) ** i;
    const fcff = revenue * a.fcff_margin;
    const df = (1 + wacc) ** -i;
    pvSum += fcff * df;
    rows.push({ year: a.base_year + i, revenue, fcff, discount_factor: df, pv: fcff * df });
  }
  const last = rows[rows.length - 1];
  const ok = wacc > a.terminal_growth;
  const tv = ok ? (last.fcff * (1 + a.terminal_growth)) / (wacc - a.terminal_growth) : null;
  const pvTv = tv === null ? null : tv * last.discount_factor;
  const ev = pvTv === null ? null : pvSum + pvTv;
  const eq = ev === null ? null : ev - a.net_debt;
  const ps = div(eq, a.shares);
  const steps = [
    step("ke", "Cost of equity (CAPM)", "k_e = r_f + β × ERP", { r_f: a.rf, "β": a.beta, ERP: a.erp }, ke, "pct"),
    step("kd_at", "After-tax cost of debt", "k_d × (1 − t)", { k_d: a.kd, t: a.tax }, kdAt, "pct"),
    step("wacc", "Weighted average cost of capital", "WACC = w_d × k_d(1 − t) + (1 − w_d) × k_e",
      { w_d: a.wd, "k_d(1 − t)": kdAt, k_e: ke }, wacc, "pct"),
    step("pv_fcff", `Present value of FCFF, FY${rows[0].year} to FY${last.year}`, "Σ FCFF_t ÷ (1 + WACC)^t",
      Object.fromEntries(rows.map((r) => [`FY${r.year}`, r.pv])), pvSum, "usd"),
    step("tv", `Terminal value at FY${last.year} (Gordon growth)`, "TV = FCFF_n × (1 + g) ÷ (WACC − g)",
      { FCFF_n: last.fcff, g: a.terminal_growth, WACC: wacc }, tv, "usd"),
    step("pv_tv", "Present value of the terminal value", "TV ÷ (1 + WACC)^n", { TV: tv, "discount factor": last.discount_factor }, pvTv, "usd"),
    step("ev", "Enterprise value", "EV = PV(FCFF) + PV(TV)", { "PV(FCFF)": pvSum, "PV(TV)": pvTv }, ev, "usd"),
    step("equity", "Equity value", "Equity = EV − net debt", { EV: ev, "net debt": a.net_debt }, eq, "usd"),
    step("per_share", "Intrinsic value per share", "Equity ÷ diluted shares", { Equity: eq, shares: a.shares }, ps, "usd_share"),
  ];
  return { wacc, rows, enterprise_value: ev, equity_value: eq, value_per_share: ps, terminal_share: div(pvTv, ev), valid: ok, steps };
}

export function dcf(st: Statements, years: number[], analysisYears: number[]): Dcf | null {
  const d = dcfDefaults(st, years, analysisYears);
  return d && { ...d, valuation: dcfValue(d.assumptions) };
}
