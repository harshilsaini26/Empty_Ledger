"use client";
import { useState } from "react";
import { BUFFETT_ALPHA_STEPS, PUBLIC_ALPHA_STEPS, leveredExcess } from "@/lib/research/models";
import { Stamp } from "../fx";
import { Readout, Slider } from "./Slider";

const pct1 = (v: number) => `${v.toFixed(1)}%`;

export function BuffettLab() {
  // Defaults from Table 2 (1976 to 2017 averages): public 12.0%, private 9.3%, ~65% private, leverage 1.7.
  const [L, setL] = useState(1.7);
  const [wPriv, setWPriv] = useState(0.65);
  const [pub, setPub] = useState(12.0);
  const [priv, setPriv] = useState(9.3);
  const [step, setStep] = useState(0);
  const [who, setWho] = useState<"brk" | "pub">("brk");

  const excess = leveredExcess(wPriv, priv, pub, L);
  const unlevered = leveredExcess(wPriv, priv, pub, 1);
  const steps = who === "brk" ? BUFFETT_ALPHA_STEPS : PUBLIC_ALPHA_STEPS;
  const s = steps[step];
  const significant = Math.abs(s.t) >= 1.96;

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-line p-4">
        <h4 className="font-display text-lg font-extrabold">1 · Rebuild Berkshire&apos;s return</h4>
        <p className="mt-1 text-sm text-muted">Mix the public stock portfolio and the private businesses, then apply leverage. Defaults are the paper&apos;s long-run averages.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Slider label="Leverage, L" value={L} min={1} max={2.5} step={0.05} onChange={setL} fmt={(v) => `${v.toFixed(2)}×`} hint="Paper's estimate: about 1.7 to 1." />
          <Slider label="Weight in private companies, w" value={wPriv} min={0} max={1} step={0.05} onChange={setWPriv} fmt={(v) => `${Math.round(v * 100)}%`} hint="Averaged 65% from 1980 to 2017, rising to over 78%." />
          <Slider label="Public stocks, excess return" value={pub} min={0} max={20} step={0.1} onChange={setPub} fmt={pct1} />
          <Slider label="Private companies, excess return" value={priv} min={0} max={20} step={0.1} onChange={setPriv} fmt={pct1} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Readout label="Unlevered mix" value={pct1(unlevered)} sub="w·private + (1 − w)·public" />
          <Readout label="Levered excess return" value={pct1(excess)} tone="text-accent" sub="× L" />
          <Readout label="Berkshire's actual" value="18.6%" sub="per year over T-bills, 1976–2017" />
        </div>
      </section>

      <section className="relative rounded-2xl border border-line p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="font-display text-lg font-extrabold">2 · Explain the alpha away</h4>
          <div className="flex gap-1 rounded-full border border-line bg-panel-2 p-1 text-xs font-bold">
            {(["brk", "pub"] as const).map((k) => (
              <button key={k} onClick={() => setWho(k)} className={`rounded-full px-3 py-1.5 ${who === k ? "bg-panel shadow-sm" : "text-muted"}`} aria-pressed={who === k}>
                {k === "brk" ? "Berkshire stock" : "Public 13F portfolio"}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-1 text-sm text-muted">Add factors one at a time (Table 4). Alpha is what the factors cannot explain; |t| below about 2 means it is no longer statistically significant.</p>
        <ol className="mt-4 grid gap-2">
          {steps.map((x, i) => (
            <li key={x.model}>
              <button
                onClick={() => setStep(i)}
                aria-pressed={i === step}
                className={`grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border px-3 py-2 text-left transition-colors ${i === step ? "border-ink bg-hi-soft" : "border-line hover:bg-panel-2"}`}
              >
                <span>
                  <span className="text-sm font-bold">{x.model}</span>
                  <span className="mt-1.5 block h-3 overflow-hidden rounded-full bg-panel-2">
                    <span
                      className={`block h-full rounded-full ${Math.abs(x.t) >= 1.96 ? "bg-accent" : "bg-muted/50"}`}
                      style={{ width: `${(x.alpha / 14) * 100}%`, transition: "width 420ms var(--ease-pop)" }}
                    />
                  </span>
                </span>
                <span className="num text-right font-mono text-sm font-bold">
                  {pct1(x.alpha)}
                  <span className="block text-[11px] font-normal text-muted">t = {x.t.toFixed(2)}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
        <div className="relative mt-4 min-h-16 rounded-2xl border border-dashed border-line p-3 text-sm">
          {significant ? (
            <Stamp key={`${who}${step}`} className="relative" sub={`t = ${s.t.toFixed(2)}`}>Alpha</Stamp>
          ) : (
            <Stamp key={`${who}${step}`} bad tilt={6} className="relative" sub="not significant">Explained</Stamp>
          )}
          <p className="mt-3 text-muted">
            {significant
              ? "Still a statistically significant alpha. Keep adding factors."
              : "With low-beta (BAB) and quality (QMJ) in the model, what looked like magic is mostly a style: safe, cheap, high-quality stocks."}
          </p>
        </div>
      </section>
    </div>
  );
}
