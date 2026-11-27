"use client";
import { useMemo, useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { goalUtility, simulateRetirement } from "@/lib/research/models";
import { Readout, Slider } from "./Slider";

const k = (v: number) => `$${Math.round(v / 1000)}k`;

export function RetirementLab() {
  const [savings, setSavings] = useState(1_000_000);
  const [goal, setGoal] = useState(80_000);
  const [need, setNeed] = useState(0.7);
  const [pension, setPension] = useState(40_000);
  const [equity, setEquity] = useState(0.4);

  const res = useMemo(() => simulateRetirement({ savings, goal, needShare: need, pension, equity, runs: 800 }), [savings, goal, need, pension, equity]);
  const data = useMemo(
    () =>
      res.percentiles[0].path.map((_, t) => ({
        year: t + 1,
        p5: res.percentiles[0].path[t],
        band: [res.percentiles[1].path[t], res.percentiles[3].path[t]] as [number, number],
        p50: res.percentiles[2].path[t],
        p95: res.percentiles[4].path[t],
      })),
    [res],
  );
  const curve = useMemo(() => Array.from({ length: 31 }, (_, i) => ({ x: i * 4, u: goalUtility((i * 4) / 100, need) })), [need]);
  const wr = Math.max(0, goal - pension) / savings;
  const gcs = Math.round(res.goalCompletion * 1000) / 10;
  const pos = Math.round(res.probSuccess * 1000) / 10;

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Slider label="Savings at retirement" value={savings} min={250_000} max={3_000_000} step={50_000} onChange={setSavings} fmt={(v) => `$${(v / 1e6).toFixed(2)}M`} />
        <Slider label="Total income goal (real, per year)" value={goal} min={40_000} max={200_000} step={5_000} onChange={setGoal} fmt={k} />
        <Slider label="Needs share of the goal" value={need} min={0.3} max={0.9} step={0.05} onChange={setNeed} fmt={(v) => `${Math.round(v * 100)}%`} hint="The rest is wants, which can flex." />
        <Slider label="Guaranteed income (Social Security, pension)" value={pension} min={0} max={100_000} step={5_000} onChange={setPension} fmt={k} />
        <Slider label="Equity allocation" value={equity} min={0} max={1} step={0.05} onChange={setEquity} fmt={(v) => `${Math.round(v * 100)}%`} />
        <div className="self-end rounded-2xl bg-panel-2/60 px-4 py-3 text-sm">
          Initial withdrawal rate: <b className="num font-mono">{(wr * 100).toFixed(1)}%</b>
          <span className="block text-xs text-muted">The base case in the paper: $1M, $80k goal, 70% needs, $40k Social Security.</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Readout label="Probability of success" value={`${pos}%`} sub="static spending, never cut" tone={pos < 80 ? "text-bad" : ""} />
        <Readout label="Goal completion score" value={`${gcs}`} sub="dynamic spending, utility-adjusted" tone={gcs >= 95 ? "text-good" : gcs >= 85 ? "text-gold" : "text-bad"} />
        <Readout label="Runs that hit $0" value={`${Math.round(res.depletedShare * 100)}%`} sub="dynamic strategy" />
      </div>

      <div className="rounded-2xl border border-line p-4">
        <h4 className="font-display font-extrabold">Real income each year, dynamic spending</h4>
        <p className="text-xs text-muted">Shaded: 25th to 75th percentile. Lines: 5th, median and 95th. Dashed: the needs line.</p>
        <div className="mt-2 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis dataKey="year" tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={k} tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} width={52} />
              <Tooltip
                formatter={(v) => (Array.isArray(v) ? `${k(Number(v[0]))} – ${k(Number(v[1]))}` : k(Number(v)))}
                labelFormatter={(y) => `Year ${y}`}
                contentStyle={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12, color: "var(--ink)" }}
              />
              <Area dataKey="band" name="25th–75th" stroke="none" fill="var(--accent)" fillOpacity={0.18} isAnimationActive={false} />
              <Line dataKey="p95" name="95th" stroke="var(--blue)" strokeWidth={1.6} dot={false} isAnimationActive={false} />
              <Line dataKey="p50" name="Median" stroke="var(--accent)" strokeWidth={2.4} dot={false} isAnimationActive={false} />
              <Line dataKey="p5" name="5th" stroke="var(--bad)" strokeWidth={1.6} dot={false} isAnimationActive={false} />
              <ReferenceLine y={goal * need} stroke="var(--ink)" strokeDasharray="5 4" label={{ value: "needs", fill: "var(--muted)", fontSize: 11, position: "insideBottomRight" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-line p-4">
        <h4 className="font-display font-extrabold">How much a dollar of income is worth</h4>
        <p className="text-xs text-muted">Utility by share of the goal funded, for a {Math.round(need * 100)}% needs share (γn = 4, γw = 1, γe = 0.25).</p>
        <div className="mt-2 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={curve} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis dataKey="x" tickFormatter={(v) => `${v}%`} tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 1.2]} tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
              <ReferenceLine x={Math.round(need * 25) * 4} stroke="var(--bad)" strokeDasharray="4 4" />
              <Line dataKey="u" name="Utility" stroke="var(--accent)" strokeWidth={2.4} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="text-xs text-muted">
        A simplified re-implementation for learning: 800 simulated 30-year retirements with the paper&apos;s Appendix A return assumptions and a static
        equity share (the paper uses a glide path), so results land near, not exactly on, the paper&apos;s numbers. Not financial advice.
      </p>
    </div>
  );
}
