"use client";
import { useMemo, useState } from "react";
import { eigenvalues, simpleEpo } from "@/lib/research/models";
import { Readout, Slider } from "./Slider";

// A toy universe with one near-duplicate pair (US and Europe equities), the classic MVO trap.
const ASSETS = ["US equities", "Europe equities", "Treasuries", "Commodities", "Credit"];
const VOL = [0.16, 0.17, 0.06, 0.2, 0.1];
const CORR = [
  [1, 0.95, -0.2, 0.3, 0.5],
  [0.95, 1, -0.2, 0.3, 0.5],
  [-0.2, -0.2, 1, 0, -0.1],
  [0.3, 0.3, 0, 1, 0.2],
  [0.5, 0.5, -0.1, 0.2, 1],
];
const BASE_SIGNAL = [0.04, 0.03, 0.01, 0.02, 0.02];

function noisy(seed: number) {
  let s = seed * 9301 + 49297;
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  return BASE_SIGNAL.map((x) => x + (r() - 0.5) * 0.02);
}

const pct = (v: number) => `${(v * 100).toFixed(0)}%`;

export function EpoLab() {
  const [w, setW] = useState(0.75);
  const [draw, setDraw] = useState(0);
  const signal = useMemo(() => (draw ? noisy(draw) : BASE_SIGNAL), [draw]);
  const mvo = useMemo(() => simpleEpo(VOL, CORR, signal, 0), [signal]);
  const epo = useMemo(() => simpleEpo(VOL, CORR, signal, w), [signal, w]);
  const eig = useMemo(() => eigenvalues(CORR.map((r, i) => r.map((c, j) => (i === j ? 1 : (1 - w) * c)))), [w]);
  const maxAbs = Math.max(1, ...mvo.weights.map(Math.abs), ...epo.weights.map(Math.abs));

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <Slider
          label="EPO shrinkage, w"
          value={w}
          min={0}
          max={1}
          step={0.05}
          onChange={setW}
          fmt={(v) => (v === 0 ? "0 · plain MVO" : v === 1 ? "1 · no correlations" : v.toFixed(2))}
          hint="Every correlation is multiplied by (1 − w) before optimizing."
        />
        <button className="btn btn-ghost btn-sm" onClick={() => setDraw((d) => d + 1)}>
          🎲 Re-estimate signals
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Readout label="Gross leverage" value={`${(epo.grossLeverage * 100).toFixed(0)}%`} sub={`plain MVO: ${(mvo.grossLeverage * 100).toFixed(0)}%`} tone={epo.grossLeverage > 2.5 ? "text-bad" : ""} />
        <Readout label="Ex-ante Sharpe" value={epo.exAnteSharpe.toFixed(2)} sub={`plain MVO: ${mvo.exAnteSharpe.toFixed(2)} (looks best, on paper)`} />
        <Readout label="Smallest PC variance" value={eig[eig.length - 1].toFixed(2)} sub="the 'problem portfolio' gets safer-looking at w = 0" tone={eig[eig.length - 1] < 0.1 ? "text-bad" : "text-good"} />
      </div>

      <div className="rounded-2xl border border-line p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-display font-extrabold">Weights, scaled to 10% volatility</h4>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-4 rounded-sm border-2 border-dashed border-bad" /> plain MVO</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-4 rounded-sm bg-accent" /> EPO(w)</span>
          </div>
        </div>
        <ul className="mt-3 grid gap-2.5">
          {ASSETS.map((a, i) => {
            const m = mvo.weights[i];
            const e = epo.weights[i];
            const bar = (v: number) => ({ left: v < 0 ? `${50 + (v / maxAbs) * 50}%` : "50%", width: `${(Math.abs(v) / maxAbs) * 50}%` });
            return (
              <li key={a} className="grid grid-cols-[7.5rem_1fr_3.5rem] items-center gap-3 text-sm sm:grid-cols-[9rem_1fr_4rem]">
                <span className="truncate font-semibold">{a}</span>
                <div className="relative h-6 rounded-full bg-panel-2">
                  <span aria-hidden className="absolute inset-y-0 left-1/2 w-px bg-line" />
                  <span aria-hidden className="absolute inset-y-0.5 rounded-full border-2 border-dashed border-bad/70" style={bar(m)} />
                  <span
                    aria-hidden
                    className={`absolute inset-y-1.5 rounded-full ${e < 0 ? "bg-bad" : "bg-accent"}`}
                    style={{ ...bar(e), transition: "left 420ms var(--ease-pop), width 420ms var(--ease-pop)" }}
                  />
                </div>
                <span className={`num text-right font-mono text-xs font-bold ${e < 0 ? "text-bad" : ""}`}>{pct(e)}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-muted">
          US and Europe equities are 95% correlated, so plain MVO goes very long one and short the other to harvest a small difference in signals. That
          long-short is the low-variance &quot;problem portfolio&quot;. Press <b>Re-estimate signals</b> to add a little noise: watch the dashed MVO bars swing
          while EPO barely moves.
        </p>
      </div>

      <div className="rounded-2xl border border-line p-4">
        <h4 className="font-display font-extrabold">Principal-component variances of the shrunk correlation matrix</h4>
        <div className="mt-3 flex h-28 items-end gap-2">
          {eig.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span className="num font-mono text-[11px] text-muted">{v.toFixed(2)}</span>
              <div
                className={`w-full rounded-t-lg ${i === eig.length - 1 ? "bg-bad" : "bg-blue"}`}
                style={{ height: `${Math.max(3, (v / 2.6) * 80)}px`, transition: "height 420ms var(--ease-pop)" }}
              />
              <span className="font-mono text-[10px] text-muted">PC{i + 1}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">Shrinking correlations pulls every variance toward 1: the red problem portfolio is no longer treated as nearly riskless.</p>
      </div>
    </div>
  );
}
