"use client";
// Step-by-step analyses adapted from Anthropic's finance skills (dcf-model,
// 3-statement-model, variance-analysis). The numbers come from
// pipeline/finlab/valuation.py; the DCF recalculates here via lib/engine/dcf.ts.
import { useMemo, useState } from "react";
import { dcf, dcfValue, type DcfAssumptions, type Step } from "@/lib/engine/dcf";
import { money, pct } from "@/lib/format";
import { Readout, Slider } from "../research/Slider";
import type { ReportProps } from "./CompanyReport";

const PCT_INPUTS = new Set(["t", "r_f", "ERP", "k_d", "w_d", "k_d(1 − t)", "k_e", "WACC", "g", "margin_prior", "Δmargin"]);
const PLAIN_INPUTS = new Set(["β", "n", "discount factor"]);

function fmt(v: number | null, unit: string) {
  if (v === null) return "–";
  if (unit === "pct") return pct(v, 2);
  if (unit === "plain") return v.toFixed(v % 1 ? 3 : 0);
  if (unit === "shares") return `${(v / 1e6).toLocaleString("en-US", { maximumFractionDigits: 1 })}M`;
  if (unit === "usd_share") return `$${v.toFixed(2)}`;
  return money(v);
}

function inputUnit(name: string, step: Step) {
  if (/^FY\d{4}$/.test(name)) return step.unit;
  if (PCT_INPUTS.has(name)) return "pct";
  if (PLAIN_INPUTS.has(name)) return "plain";
  return name === "shares" ? "shares" : "usd";
}

function StepCard({ step, n }: { step: Step; n: number }) {
  return (
    <li className="rounded-2xl border border-line bg-panel-2/60 p-3">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-sm font-bold">
          <span className="mr-2 font-mono text-xs text-muted">{n}.</span>
          {step.label}
        </div>
        <div className="num shrink-0 font-mono text-sm font-extrabold text-gold">{fmt(step.value, step.unit)}</div>
      </div>
      <div className="mt-1 font-mono text-xs">{step.formula}</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {Object.entries(step.inputs).map(([k, v]) => (
          <span key={k} className="chip font-mono text-[11px]">
            {k} = {fmt(v, inputUnit(k, step))}
          </span>
        ))}
      </div>
    </li>
  );
}

function Steps({ steps, start = 1 }: { steps: Step[]; start?: number }) {
  return (
    <ol className="grid gap-2">
      {steps.map((s, i) => (
        <StepCard key={s.id} step={s} n={start + i} />
      ))}
    </ol>
  );
}

const notFor = (what: string) => <div className="card p-4 text-sm">{what}</div>;

// --------------------------------------------------------------------- DCF
export function DcfTab({ rec }: ReportProps) {
  const years = useMemo(() => [...(rec.prior_year ? [rec.prior_year] : []), ...rec.fiscal_years], [rec]);
  const base = useMemo(() => (rec.template === "standard" ? dcf(rec.statements, years, rec.fiscal_years) : null), [rec, years]);
  const [a, setA] = useState<DcfAssumptions | null>(base?.assumptions ?? null);
  if (!base || !a) return notFor(rec.template === "standard" ? "A DCF needs revenue, cash from operations and capex for at least two years." : "A free-cash-flow DCF does not fit banks and insurers, whose debt is part of operations.");
  const v = dcfValue(a);
  const set = (k: keyof DcfAssumptions) => (x: number) => setA({ ...a, [k]: x });

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="grid content-start gap-4 lg:col-span-2">
        <div className="card grid gap-4 p-4">
          <div className="flex items-baseline justify-between">
            <h3 className="font-bold">Your assumptions</h3>
            <button className="text-xs font-bold text-accent" onClick={() => setA(base.assumptions)}>Reset</button>
          </div>
          <Slider label="Revenue growth (5 yrs)" value={a.revenue_growth} min={-0.05} max={0.25} step={0.005} onChange={set("revenue_growth")} fmt={(x) => pct(x)} />
          <Slider label="FCFF margin" value={a.fcff_margin} min={-0.1} max={0.6} step={0.005} onChange={set("fcff_margin")} fmt={(x) => pct(x)} />
          <Slider label="Beta (β)" value={a.beta} min={0.4} max={2.0} step={0.05} onChange={set("beta")} fmt={(x) => x.toFixed(2)} hint="No market data here, so β starts at 1.0 (the market)." />
          <Slider label="Equity risk premium" value={a.erp} min={0.03} max={0.08} step={0.0025} onChange={set("erp")} fmt={(x) => pct(x, 2)} />
          <Slider label="Debt weight (w_d)" value={a.wd} min={0} max={0.8} step={0.01} onChange={set("wd")} fmt={(x) => pct(x, 0)} />
          <Slider label="Terminal growth" value={a.terminal_growth} min={0} max={0.05} step={0.0025} onChange={set("terminal_growth")} fmt={(x) => pct(x, 2)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Readout label="Value per share" value={fmt(v.value_per_share, "usd_share")} tone="text-gold" />
          <Readout label="WACC" value={pct(v.wacc, 2)} />
          <Readout label="Enterprise value" value={money(v.enterprise_value)} />
          <Readout label="From terminal value" value={pct(v.terminal_share, 0)} sub="Share of EV after year 5" />
        </div>
        {!v.valid && <div className="card border-bad p-3 text-sm text-bad">WACC must be above terminal growth, or the terminal value is infinite.</div>}
      </div>

      <div className="grid content-start gap-6 lg:col-span-3">
        <div className="card overflow-x-auto p-4">
          <h3 className="mb-2 font-bold">Five-year forecast</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="py-1">Year</th><th className="text-right">Revenue</th><th className="text-right">FCFF</th>
                <th className="text-right">Discount factor</th><th className="text-right">Present value</th>
              </tr>
            </thead>
            <tbody>
              {v.rows.map((r) => (
                <tr key={r.year} className="num border-t border-line/60">
                  <td className="py-1.5">FY{r.year}</td><td className="text-right">{money(r.revenue)}</td><td className="text-right">{money(r.fcff)}</td>
                  <td className="text-right">{r.discount_factor.toFixed(3)}</td><td className="text-right font-semibold">{money(r.pv)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card p-4">
          <h3 className="mb-1 font-bold">Where the starting assumptions come from</h3>
          <p className="mb-3 text-xs text-muted">Read from the FY{a.base_year} statements. The sliders replace these values.</p>
          <Steps steps={base.steps} />
        </div>
        <div className="card p-4">
          <h3 className="mb-3 font-bold">The valuation, step by step</h3>
          <Steps steps={v.steps} start={base.steps.length + 1} />
          <p className="mt-3 text-xs text-muted">Risk-free rate {pct(a.rf, 2)} and pre-tax cost of debt {pct(a.kd, 2)} are held fixed. A teaching model, not investment advice.</p>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------- 3-statement model
export function ModelTab({ rec }: ReportProps) {
  const p = rec.walkthroughs?.projection;
  if (!p) return notFor(rec.uploaded ? "The 3-statement model is built for the preloaded companies; uploads get the DCF." : "A 3-statement projection needs the standard layout with revenue, EBIT, assets and liabilities.");
  const hist = rec.fiscal_years.slice(-3);
  const sections = [["income", "Income statement"], ["balance", "Balance sheet"], ["cashflow", "Cash flow"]] as const;
  return (
    <div className="grid gap-6">
      <div className="card overflow-x-auto p-4">
        <h3 className="mb-1 font-bold">Step 1: drivers from the last three years</h3>
        <p className="mb-3 text-xs text-muted">Each driver is the average of its history, then applied to every forecast year.</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="py-1">Driver</th>{hist.map((y) => <th key={y} className="text-right">FY{y}</th>)}<th className="text-right">Used</th>
            </tr>
          </thead>
          <tbody>
            {p.drivers.map((d) => (
              <tr key={d.id} className="border-t border-line/60">
                <td className="py-1.5"><div className="font-medium">{d.label}</div><div className="font-mono text-xs text-muted">{d.formula}</div></td>
                {hist.map((y) => <td key={y} className="num text-right">{pct(d.history[String(y)] ?? null)}</td>)}
                <td className="num text-right font-bold text-gold">{pct(d.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card overflow-x-auto p-4">
        <h3 className="mb-1 font-bold">Step 2: the projected statements</h3>
        <p className="mb-3 text-xs text-muted">{p.notes} Revenue × driver gives each line; cash flow sets the cash balance; the check row proves the balance sheet balances.</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted"><th className="py-1">Line</th>{p.years.map((y) => <th key={y} className="text-right">FY{y}E</th>)}</tr>
          </thead>
          {sections.map(([s, title]) => (
            <tbody key={s}>
              <tr><td colSpan={p.years.length + 1} className="pt-3 pb-1 font-mono text-[10px] font-bold tracking-widest text-muted uppercase">{title}</td></tr>
              {p.lines.filter((l) => l[2] === s).map(([k, label]) => (
                <tr key={k} className={`border-t border-line/60 ${k === "check" ? "text-good" : ""} ${["net_income", "total_assets", "cfo"].includes(k) ? "font-bold" : ""}`}>
                  <td className="py-1.5">{label}</td>
                  {p.years.map((y) => <td key={y} className="num text-right">{k === "check" ? Math.round(p.rows[k][String(y)]).toString() : money(p.rows[k][String(y)])}</td>)}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- variance
export function VarianceTab({ rec }: ReportProps) {
  const v = rec.walkthroughs?.variance;
  if (!v) return notFor(rec.uploaded ? "Variance analysis is built for the preloaded companies; uploads get the DCF." : "Variance analysis needs two years of data.");
  const flagged = v.flux.filter((r) => r.flag);
  const rest = v.flux.filter((r) => !r.flag);
  const b = v.bridge;
  const biggest = b ? Math.max(Math.abs(b.start), Math.abs(b.end), ...b.steps.map((s) => Math.abs(s.value))) : 1;
  const Bar = ({ value }: { value: number }) => (
    <div className="h-2.5 rounded-full" style={{ width: `${Math.max(2, (Math.abs(value) / biggest) * 100)}%`, background: value < 0 ? "var(--bad)" : "var(--good)" }} />
  );
  const fluxTable = (rows: typeof v.flux) => (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-muted">
          <th className="py-1">Line</th><th className="text-right">FY{v.prior_year}</th><th className="text-right">FY{v.year}</th><th className="text-right">Change</th><th className="text-right">%</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.statement + r.item} className="num border-t border-line/60">
            <td className="py-1.5">{r.label}</td><td className="text-right">{money(r.prior)}</td><td className="text-right">{money(r.current)}</td>
            <td className="text-right font-semibold">{money(r.delta)}</td><td className="text-right">{pct(r.pct)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {b && (
        <div className="card p-4">
          <h3 className="mb-1 font-bold">Net income bridge, FY{v.prior_year} to FY{v.year}</h3>
          <p className="mb-3 text-xs text-muted">Start from last year&apos;s net income and add each line&apos;s change. Costs going up count against profit.</p>
          <ul className="grid gap-2 text-sm">
            {[{ id: "start", label: `Net income FY${v.prior_year}`, value: b.start }, ...b.steps, { id: "end", label: `Net income FY${v.year}`, value: b.end }].map((s) => (
              <li key={s.id} className="grid grid-cols-[1fr_auto] items-center gap-x-3">
                <span className={s.id === "start" || s.id === "end" ? "font-bold" : ""}>{s.label}</span>
                <span className="num font-semibold">{s.id === "start" || s.id === "end" ? money(s.value) : `${s.value >= 0 ? "+" : ""}${money(s.value)}`}</span>
                <div className="col-span-2"><Bar value={s.value} /></div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid content-start gap-4">
        {v.splits.map((s) => (
          <div key={s.item} className="card p-4">
            <h3 className="mb-1 font-bold">{s.label}: volume vs rate</h3>
            <p className="mb-3 text-xs text-muted">The {money(s.delta)} change splits into selling more (volume) and earning a different margin (rate).</p>
            <Steps steps={s.steps} />
          </div>
        ))}
      </div>
      <div className="card overflow-x-auto p-4 lg:col-span-2">
        <h3 className="mb-1 font-bold">Lines over the threshold ({flagged.length})</h3>
        <p className="mb-3 text-xs text-muted">Flagged when the change is {v.threshold}. These are the lines an analyst would explain first.</p>
        {fluxTable(flagged)}
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-bold text-accent">All other lines ({rest.length})</summary>
          {fluxTable(rest)}
        </details>
      </div>
    </div>
  );
}
