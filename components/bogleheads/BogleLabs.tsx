"use client";
import { useMemo, useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  BOGLE_LADDER,
  aprToApy,
  balancePath,
  bondShare,
  breakEvenRate,
  costDrag,
  fvAnnuity,
  matchingReturn,
  pmtForTarget,
  profitPerDollar,
  pv,
  rebalance,
  savedBalance,
  threeFund,
  yearsToIndependence,
  yieldFor,
  npv,
  type BondRule,
} from "@/lib/bogleheads/models";
import { Segmented, Stamp } from "../fx";
import { Readout, Slider } from "../research/Slider";

const usd = (v: number) => (Math.abs(v) >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : `$${Math.round(v).toLocaleString("en-US")}`);
const k = (v: number) => (Math.abs(v) >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : `$${Math.round(v / 1000)}k`);
const pc = (v: number, d = 0) => `${(v * 100).toFixed(d)}%`;
const tip = { background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12, color: "var(--ink)" };
const axis = { fill: "var(--muted)", fontSize: 12 };

function Box({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line p-4">
      <h4 className="font-display font-extrabold">{title}</h4>
      {note && <p className="text-xs text-muted">{note}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

/** A horizontal stacked bar of portfolio slices. */
function MixBar({ parts }: { parts: { label: string; v: number; color: string }[] }) {
  return (
    <div>
      <div className="flex h-9 overflow-hidden rounded-full border border-line">
        {parts.map((p) => (
          <div
            key={p.label}
            className="grid place-items-center font-mono text-[11px] font-extrabold text-[#12201a]"
            style={{ width: `${p.v * 100}%`, background: p.color, transition: "width 420ms var(--ease-pop)" }}
          >
            {p.v >= 0.09 ? pc(p.v) : ""}
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {parts.map((p) => (
          <span key={p.label} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
            {p.label} <b className="num font-mono text-ink">{pc(p.v)}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

const RULES = [
  { id: "age", label: "Age in bonds" },
  { id: "age-10", label: "Age − 10" },
  { id: "age-20", label: "Age − 20" },
] as const satisfies readonly { id: BondRule; label: string }[];
const MODES = [
  { id: "now", label: "Now or later" },
  { id: "stream", label: "Price vs value" },
  { id: "rates", label: "APR and APY" },
] as const;

// ---------- 1 · Philosophy: build a three-fund portfolio you can hold ----------

export function PhilosophyLab() {
  const [age, setAge] = useState(35);
  const [rule, setRule] = useState<BondRule>("age-10");
  const [intl, setIntl] = useState(0.3);
  const b = bondShare(age, rule);
  const f = threeFund(b, intl);
  const [hold, setHold] = useState<"" | "hold" | "sell">("");
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Slider label="Your age" value={age} min={20} max={80} step={1} onChange={setAge} fmt={(v) => `${v}`} />
        <Slider label="International share of stocks" value={intl} min={0} max={0.5} step={0.05} onChange={setIntl} fmt={pc} hint="The wiki's normal range is 20% to 40%." />
        <div className="md:col-span-2">
          <div className="mb-1.5 text-sm font-bold">Bond rule of thumb</div>
          <Segmented items={RULES} value={rule} onChange={setRule} label="Bond rule of thumb" />
          <p className="mt-1 text-xs text-muted">Kept inside Graham&apos;s 25% to 75% band.</p>
        </div>
      </div>
      <Box title="Your three-fund portfolio">
        <MixBar
          parts={[
            { label: "US total stock", v: f.us, color: "var(--accent)" },
            { label: "International total stock", v: f.intl, color: "var(--blue)" },
            { label: "US total bond", v: f.bonds, color: "var(--hi)" },
          ]}
        />
      </Box>
      <div className="grid gap-3 sm:grid-cols-3">
        <Readout label="Blended expense ratio" value={pc(f.er, 3)} sub={`$${Math.round(f.er * 100_000)} a year per $100k`} tone="text-good" />
        <Readout label="If stocks halve, like 2008" value={`−${pc(f.crashDrop)}`} sub={`$100k becomes about ${usd(100_000 * (1 - f.crashDrop))}`} tone={f.crashDrop > 0.3 ? "text-bad" : ""} />
        <Readout label="Funds to own" value="3" sub="rebalance about once a year" />
      </div>
      <div className="relative rounded-2xl border border-dashed border-line p-4 text-sm">
        <p className="font-bold">The honest question: would you hold, or sell, if your portfolio fell {pc(f.crashDrop)}?</p>
        <div className="mt-3 flex gap-2">
          <button className={`btn btn-sm ${hold === "hold" ? "btn-primary" : "btn-ghost"}`} onClick={() => setHold("hold")}>
            I would hold
          </button>
          <button className={`btn btn-sm ${hold === "sell" ? "btn-primary" : "btn-ghost"}`} onClick={() => setHold("sell")}>
            I might sell
          </button>
        </div>
        {hold && (
          <div className="mt-3 flex items-center gap-4">
            <Stamp key={hold + b} bad={hold === "sell"} tilt={hold === "sell" ? 6 : -6} className="relative">
              {hold === "hold" ? "Stay the course" : "Too much risk"}
            </Stamp>
            <p className="text-muted">
              {hold === "hold"
                ? "Then this mix fits your willingness to take risk. Write it down and stick to it."
                : "Then hold more bonds. Try the age-in-bonds rule, and see how the crash number shrinks."}
            </p>
          </div>
        )}
      </div>
      <p className="text-xs text-muted">Expense ratios are typical of total-market index funds (0.03% to 0.06%). The crash assumes bonds are flat, a simplification. Not investment advice.</p>
    </div>
  );
}

// ---------- 2 · Start-up kit: readiness and rebalancing ----------

export function StartupLab() {
  const [cash, setCash] = useState(15_000);
  const [spend, setSpend] = useState(3_000);
  const [target, setTarget] = useState(0.6);
  const [move, setMove] = useState(0.25);
  const [band, setBand] = useState(0.05);
  const months = cash / spend;
  const ready = months >= 6;
  const r = rebalance(target, move, 0.02, band);
  return (
    <div className="grid gap-5">
      <Box title="Step 1 · Are you ready to invest?" note="The kit asks for at least six months of living expenses in cash first.">
        <div className="grid gap-4 md:grid-cols-2">
          <Slider label="Cash reserve" value={cash} min={0} max={60_000} step={1_000} onChange={setCash} fmt={usd} />
          <Slider label="Monthly living expenses" value={spend} min={1_000} max={10_000} step={250} onChange={setSpend} fmt={usd} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="h-3 overflow-hidden rounded-full bg-panel-2">
              <div className={`h-full rounded-full ${ready ? "bg-accent" : "bg-gold"}`} style={{ width: `${Math.min(1, months / 6) * 100}%`, transition: "width 420ms var(--ease-pop)" }} />
            </div>
            <p className="mt-1.5 text-sm">
              <b className="num font-mono">{months.toFixed(1)}</b> months covered
              {!ready && <span className="text-muted"> · {usd(6 * spend - cash)} to go</span>}
            </p>
          </div>
          <Stamp key={String(ready)} bad={!ready} className="relative">
            {ready ? "Ready" : "Not yet"}
          </Stamp>
          <span className="sr-only" aria-live="polite">{ready ? "Ready to invest" : "Not ready yet"}</span>
        </div>
      </Box>
      <Box title="Step 6 · Rebalance when the mix drifts" note="Move stocks, and see whether your band says it is time to trade. Bonds are assumed to return 2%.">
        <div className="grid gap-4 md:grid-cols-3">
          <Slider label="Target in stocks" value={target} min={0.25} max={0.75} step={0.05} onChange={setTarget} fmt={pc} />
          <Slider label="Stock market move" value={move} min={-0.5} max={0.6} step={0.05} onChange={setMove} fmt={(v) => `${v > 0 ? "+" : ""}${pc(v)}`} />
          <Slider label="Rebalancing band" value={band} min={0.05} max={0.1} step={0.05} onChange={setBand} fmt={(v) => `±${Math.round(v * 100)} pts`} />
        </div>
        <div className="mt-4 grid gap-3">
          <div className="text-xs font-bold text-muted">Target</div>
          <MixBar parts={[{ label: "Stocks", v: target, color: "var(--accent)" }, { label: "Bonds", v: 1 - target, color: "var(--hi)" }]} />
          <div className="text-xs font-bold text-muted">After the move</div>
          <MixBar parts={[{ label: "Stocks", v: r.stocksNow, color: "var(--accent)" }, { label: "Bonds", v: 1 - r.stocksNow, color: "var(--hi)" }]} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Readout label="Drift" value={`${r.drift >= 0 ? "+" : ""}${(r.drift * 100).toFixed(1)} pts`} tone={r.act ? "text-bad" : "text-good"} sub={r.act ? "outside your band" : "inside your band, do nothing"} />
          <Readout
            label="Trade on $100k"
            value={r.act ? `${r.trade > 0 ? "Sell" : "Buy"} ${usd(Math.abs(r.trade) * 100_000)}` : "None"}
            sub={r.act ? `of stocks, ${r.trade > 0 ? "buy" : "sell"} the same in bonds` : "check again next year"}
          />
        </div>
      </Box>
    </div>
  );
}

// ---------- 3 · Humble arithmetic: the cost ladder and lifetime cost drag ----------

export function CostLab() {
  const [gross, setGross] = useState(0.08);
  const [cost, setCost] = useState(0.025);
  const [years, setYears] = useState(65);
  const d = costDrag(gross, cost, years);
  const data = useMemo(
    () =>
      Array.from({ length: years + 1 }, (_, t) => ({
        t,
        free: 1000 * (1 + gross) ** t,
        net: 1000 * (1 + gross - cost) ** t,
      })),
    [gross, cost, years],
  );
  const maxRet = BOGLE_LADDER[0].ret;
  return (
    <div className="grid gap-5">
      <Box title="Bogle's ladder, 1983 to 2003" note="Annual returns, and what $1 earned over the 20 years at each rung.">
        <ul className="grid gap-2.5">
          {BOGLE_LADDER.map((s, i) => (
            <li key={s.label} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[12rem_1fr_auto]">
              <span className="font-semibold">
                {s.label}
                <span className="block text-[11px] font-normal text-muted">{s.note}</span>
              </span>
              <span className="h-5 overflow-hidden rounded-full bg-panel-2">
                <span
                  className={`rise block h-full rounded-full ${i === 3 ? "bg-bad" : i === 0 ? "bg-blue" : "bg-accent"}`}
                  style={{ width: `${(s.ret / maxRet) * 100}%`, ["--i" as string]: i }}
                />
              </span>
              <span className="num text-right font-mono font-bold">
                {s.ret.toFixed(1)}%<span className="block text-[11px] font-normal text-muted">${profitPerDollar(s.ret / 100, 20).toFixed(2)} per $1</span>
              </span>
            </li>
          ))}
        </ul>
      </Box>
      <div className="grid gap-4 md:grid-cols-3">
        <Slider label="Gross market return" value={gross} min={0.03} max={0.12} step={0.005} onChange={setGross} fmt={(v) => pc(v, 1)} />
        <Slider label="Annual costs" value={cost} min={0} max={0.03} step={0.0005} onChange={setCost} fmt={(v) => pc(v, 2)} hint="Index funds: about 0.05%. Bogle's all-in active estimate: 2.5%." />
        <Slider label="Years invested" value={years} min={5} max={65} step={1} onChange={setYears} fmt={(v) => `${v} yrs`} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Readout label="$1,000 with no costs" value={usd(d.free)} />
        <Readout label="After costs" value={usd(d.net)} sub={`${usd(d.paid)} kept by the system`} tone="text-bad" />
        <Readout label="Profit you keep" value={pc(d.investorShare)} sub={d.crossover ? `the system's take passes yours in year ${d.crossover}` : "costs never overtake your gains here"} tone={d.investorShare < 0.5 ? "text-bad" : "text-good"} />
      </div>
      <Box title="Growth of $1,000" note="The gap between the lines is what costs took, compounded.">
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis dataKey="t" minTickGap={24} tick={axis} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={k} tick={axis} axisLine={false} tickLine={false} width={56} />
              <Tooltip formatter={(v) => usd(Number(v))} labelFormatter={(t) => `Year ${t}`} contentStyle={tip} />
              <Area dataKey="free" name="No costs" stroke="var(--blue)" strokeWidth={2} fill="var(--bad)" fillOpacity={0.12} isAnimationActive={false} />
              <Area dataKey="net" name="After costs" stroke="var(--accent)" strokeWidth={2.4} fill="var(--bg)" fillOpacity={1} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Box>
    </div>
  );
}

// ---------- 4 · Saving rate ----------

export function SavingRateLab() {
  const [income, setIncome] = useState(100_000);
  const [sA, setSA] = useState(0.04);
  const [rA, setRA] = useState(0.06);
  const [sB, setSB] = useState(0.06);
  const [rB, setRB] = useState(0.04);
  const [s, setS] = useState(0.2);
  const a = savedBalance(sA, rA, income);
  const b = savedBalance(sB, rB, income);
  const need = matchingReturn(sB, rB, sA);
  const fi = useMemo(() => Array.from({ length: 19 }, (_, i) => ({ s: (i + 1) * 5, n: Math.min(70, yearsToIndependence((i + 1) * 0.05, 0.05, 0.04)) })), []);
  const nYou = yearsToIndependence(s, 0.05, 0.04);
  return (
    <div className="grid gap-5">
      <Box title="Saver A vs saver B, 30 years" note="Savings go in at each year end, on a flat income. Defaults are the wiki's Alice and Bob.">
        <Slider label="Income" value={income} min={30_000} max={250_000} step={5_000} onChange={setIncome} fmt={usd} />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className={`rounded-2xl border p-3 ${a >= b ? "border-ink bg-hi-soft" : "border-line"}`}>
            <div className="font-display font-extrabold">Saver A</div>
            <div className="mt-2 grid gap-3">
              <Slider label="Saving rate" value={sA} min={0.01} max={0.3} step={0.01} onChange={setSA} fmt={pc} />
              <Slider label="Return" value={rA} min={0.01} max={0.12} step={0.005} onChange={setRA} fmt={(v) => pc(v, 1)} />
            </div>
            <div className="num mt-3 font-display text-2xl font-extrabold">{usd(a)}</div>
          </div>
          <div className={`rounded-2xl border p-3 ${b > a ? "border-ink bg-hi-soft" : "border-line"}`}>
            <div className="font-display font-extrabold">Saver B</div>
            <div className="mt-2 grid gap-3">
              <Slider label="Saving rate" value={sB} min={0.01} max={0.3} step={0.01} onChange={setSB} fmt={pc} />
              <Slider label="Return" value={rB} min={0.01} max={0.12} step={0.005} onChange={setRB} fmt={(v) => pc(v, 1)} />
            </div>
            <div className="num mt-3 font-display text-2xl font-extrabold">{usd(b)}</div>
          </div>
        </div>
        <p className="mt-3 text-sm">
          To match B, saver A would need a return of <b className="num font-mono">{pc(need, 1)}</b> a year, or simply to save{" "}
          <b className="num font-mono">{pc((sA * b) / a, 1)}</b> of income at their current return.
        </p>
      </Box>
      <Box title="Years to financial independence" note="Our extension: 5% real return, 4% withdrawal rate, living on what you do not save, starting from zero.">
        <Slider label="Your saving rate" value={s} min={0.05} max={0.8} step={0.05} onChange={setS} fmt={pc} />
        <div className="mt-3 flex h-36 items-end gap-1">
          {fi.map((x) => (
            <div key={x.s} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`w-full rounded-t-md ${Math.round(s * 100) === x.s ? "bg-accent" : "bg-blue/40"}`}
                style={{ height: `${(x.n / 70) * 120}px`, transition: "background-color 200ms" }}
                title={`${x.s}%: ${x.n.toFixed(1)} years`}
              />
              <span className="hidden font-mono text-[9px] text-muted sm:block">{x.s}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-sm">
          Saving <b>{pc(s)}</b> gets you there in about <b className="num font-mono">{nYou.toFixed(1)} years</b>.
        </p>
      </Box>
    </div>
  );
}

// ---------- 5 · Saving early ----------

export function SavingEarlyLab() {
  const [pmt, setPmt] = useState(6_000);
  const [r, setR] = useState(0.04);
  const [start, setStart] = useState(30);
  const [goal, setGoal] = useState(100_000);
  const ret = 65;
  const data = useMemo(() => {
    const paths = [25, 40, 55, start].map((a) => balancePath(a, ret, pmt, r, 20));
    return paths[0].map((p, i) => ({ age: p.age, s25: p.bal, s40: paths[1][i].bal, s55: paths[2][i].bal, you: paths[3][i].bal }));
  }, [pmt, r, start]);
  const yours = fvAnnuity(pmt, r, ret - start, true);
  const need = (a: number) => pmtForTarget(goal, r, ret - a, true);
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Slider label="Saved at the start of each year" value={pmt} min={1_000} max={20_000} step={500} onChange={setPmt} fmt={usd} />
        <Slider label="Annual return" value={r} min={0.01} max={0.1} step={0.005} onChange={setR} fmt={(v) => pc(v, 1)} hint="The wiki uses a conservative 4%." />
        <Slider label="You start at age" value={start} min={20} max={60} step={1} onChange={setStart} fmt={(v) => `${v}`} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Readout label="Your balance at 65" value={usd(yours)} sub={`from ${usd(pmt * (ret - start))} of deposits`} tone="text-accent" />
        <Readout label="Share that is growth" value={pc(1 - (pmt * (ret - start)) / yours)} sub="compounding, not deposits" />
        <Readout label="Starting at 25 instead" value={usd(fvAnnuity(pmt, r, 40, true))} sub={`${(fvAnnuity(pmt, r, 40, true) / yours).toFixed(1)}× your balance`} />
      </div>
      <Box title="Balance by age" note="Same yearly saving, different start ages.">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis dataKey="age" minTickGap={24} tick={axis} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={k} tick={axis} axisLine={false} tickLine={false} width={56} />
              <Tooltip formatter={(v) => usd(Number(v))} labelFormatter={(a) => `Age ${a}`} contentStyle={tip} />
              <Line dataKey="s25" name="Start at 25" stroke="var(--accent)" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line dataKey="s40" name="Start at 40" stroke="var(--blue)" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line dataKey="s55" name="Start at 55" stroke="var(--bad)" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line dataKey="you" name="You" stroke="var(--ink)" strokeWidth={2.6} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 text-xs text-muted">
          <span><b className="text-accent">—</b> from 25</span>
          <span><b className="text-blue">—</b> from 40</span>
          <span><b className="text-bad">—</b> from 55</span>
          <span><b>- -</b> you, from {start}</span>
        </div>
      </Box>
      <Box title="What it takes to reach a goal by 65">
        <Slider label="Goal" value={goal} min={50_000} max={2_000_000} step={50_000} onChange={setGoal} fmt={usd} />
        <ul className="mt-3 grid gap-2 sm:grid-cols-4">
          {[25, 40, 55, start].map((a, i) => (
            <li key={i} className={`rounded-2xl border p-3 ${i === 3 ? "border-ink bg-hi-soft" : "border-line"}`}>
              <div className="font-mono text-[10px] font-bold tracking-widest text-muted uppercase">{i === 3 ? `You, from ${a}` : `From ${a}`}</div>
              <div className="num font-display text-xl font-extrabold">{usd(need(a))}</div>
              <div className="text-xs text-muted">a year</div>
            </li>
          ))}
        </ul>
      </Box>
    </div>
  );
}

// ---------- 6 · Comparing investments ----------

export function CompareLab() {
  const [mode, setMode] = useState<(typeof MODES)[number]["id"]>("now");
  return (
    <div className="grid gap-5">
      <Segmented items={MODES} value={mode} onChange={setMode} label="Calculator" />
      {mode === "now" && <NowOrLater />}
      {mode === "stream" && <PriceVsValue />}
      {mode === "rates" && <Rates />}
    </div>
  );
}

function NowOrLater() {
  const [now, setNow] = useState(15_000);
  const [later, setLater] = useState(18_000);
  const [n, setN] = useState(4);
  const [i, setI] = useState(0.04);
  const value = pv(later, i, n);
  const be = breakEvenRate(now, later, n);
  const takeNow = now >= value;
  return (
    <Box title="Take the money now, or wait?" note="Defaults are the wiki's example. The rate is what you could earn on the money in the meantime.">
      <div className="grid gap-4 md:grid-cols-2">
        <Slider label="Offer now" value={now} min={5_000} max={30_000} step={500} onChange={setNow} fmt={usd} />
        <Slider label="Offer later" value={later} min={5_000} max={40_000} step={500} onChange={setLater} fmt={usd} />
        <Slider label="Years to wait" value={n} min={1} max={15} step={1} onChange={setN} fmt={(v) => `${v} yrs`} />
        <Slider label="Rate you can earn" value={i} min={0} max={0.12} step={0.0025} onChange={setI} fmt={(v) => pc(v, 2)} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Readout label="Later offer, in today's dollars" value={usd(value)} />
        <Readout label="Break-even rate" value={pc(be, 2)} sub="earn more than this: take it now" />
        <div className="grid place-items-center rounded-2xl border border-dashed border-line p-2">
          <Stamp key={String(takeNow)} tilt={takeNow ? -6 : 6} className="relative">
            {takeNow ? "Take it now" : "Wait"}
          </Stamp>
          <span className="sr-only" aria-live="polite">{takeNow ? "Verdict: take it now" : "Verdict: wait"}</span>
        </div>
      </div>
    </Box>
  );
}

function PriceVsValue() {
  const [pay, setPay] = useState(500);
  const [n, setN] = useState(20);
  const [lump, setLump] = useState(0);
  const [price, setPrice] = useState(5_300);
  const [req, setReq] = useState(0.055);
  const flows = useMemo(() => Array.from({ length: n }, (_, t) => pay + (t === n - 1 ? lump : 0)), [pay, n, lump]);
  const value = npv(req, flows);
  const y = yieldFor(price, flows);
  const good = value >= price;
  return (
    <Box title="Is it worth the price?" note="Yearly payments at each year end, plus an optional final lump sum. Defaults are the wiki's first example.">
      <div className="grid gap-4 md:grid-cols-2">
        <Slider label="Yearly payment" value={pay} min={0} max={2_000} step={25} onChange={setPay} fmt={usd} />
        <Slider label="Years" value={n} min={1} max={40} step={1} onChange={setN} fmt={(v) => `${v}`} />
        <Slider label="Final lump sum" value={lump} min={0} max={10_000} step={100} onChange={setLump} fmt={usd} />
        <Slider label="Price asked" value={price} min={500} max={20_000} step={50} onChange={setPrice} fmt={usd} />
        <Slider label="Your required return" value={req} min={0.01} max={0.12} step={0.0025} onChange={setReq} fmt={(v) => pc(v, 2)} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Readout label="Present value" value={usd(value)} sub={`at ${pc(req, 2)}`} tone={good ? "text-good" : "text-bad"} />
        <Readout label="Yield at this price" value={pc(y, 2)} sub="the IRR you would earn" />
        <div className="grid place-items-center rounded-2xl border border-dashed border-line p-2">
          <Stamp key={String(good)} bad={!good} tilt={good ? -6 : 6} className="relative" sub={good ? `${usd(value - price)} to spare` : `${usd(price - value)} too dear`}>
            {good ? "Good deal" : "Pass"}
          </Stamp>
          <span className="sr-only" aria-live="polite">{good ? "Verdict: good deal" : "Verdict: pass"}</span>
        </div>
      </div>
    </Box>
  );
}

function Rates() {
  const [apr, setApr] = useState(0.12);
  const [infl, setInfl] = useState(0.03);
  const rows = [
    { m: 1, label: "Yearly" },
    { m: 4, label: "Quarterly" },
    { m: 12, label: "Monthly" },
    { m: 365, label: "Daily" },
  ];
  return (
    <Box title="Same quoted rate, different yields" note="APY is what you actually earn in a year once compounding is counted.">
      <div className="grid gap-4 md:grid-cols-2">
        <Slider label="Quoted rate (APR)" value={apr} min={0.01} max={0.24} step={0.0025} onChange={setApr} fmt={(v) => pc(v, 2)} />
        <Slider label="Inflation" value={infl} min={0} max={0.1} step={0.0025} onChange={setInfl} fmt={(v) => pc(v, 2)} />
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-4">
        {rows.map((x) => {
          const apy = aprToApy(apr, x.m);
          return (
            <li key={x.m} className="rounded-2xl border border-line p-3">
              <div className="font-mono text-[10px] font-bold tracking-widest text-muted uppercase">{x.label}</div>
              <div className="num font-display text-xl font-extrabold">{pc(apy, 2)}</div>
              <div className="text-xs text-muted">APY · real {pc((1 + apy) / (1 + infl) - 1, 2)}</div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted">
        A monthly rate of {pc(apr / 12, 3)} (APR ÷ 12) is not the same as {pc((1 + apr) ** (1 / 12) - 1, 3)}, the monthly rate that compounds to {pc(apr, 2)} a year.
      </p>
    </Box>
  );
}
