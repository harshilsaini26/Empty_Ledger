"use client";
import { useEffect, useState } from "react";
import { FloatXp, Stamp } from "../fx";
import type { BankCompany } from "@/lib/game/bank";
import { pick, rng } from "@/lib/game/questions";
import { fmtUnit } from "@/lib/format";
import { useProgress } from "@/lib/game/progress";

const METRICS: { id: string; name: string; unit: "pct" | "x" | "days"; nonBank?: boolean }[] = [
  { id: "gross_margin", name: "gross margin", unit: "pct", nonBank: true },
  { id: "operating_margin", name: "operating margin", unit: "pct", nonBank: true },
  { id: "net_margin", name: "net margin", unit: "pct" },
  { id: "roa", name: "return on assets", unit: "pct" },
  { id: "asset_turnover", name: "asset turnover", unit: "x" },
  { id: "current_ratio", name: "current ratio", unit: "x", nonBank: true },
  { id: "dso", name: "days sales outstanding", unit: "days", nonBank: true },
  { id: "rnd_intensity", name: "R&D as % of revenue", unit: "pct", nonBank: true },
  { id: "capex_to_revenue", name: "capex as % of revenue", unit: "pct", nonBank: true },
  { id: "revenue_growth", name: "revenue growth", unit: "pct" },
];

const latest = (c: BankCompany, id: string) => c.r[id]?.[String(c.years[c.years.length - 1])];

function nextPair(r: () => number, bank: BankCompany[], keep?: BankCompany) {
  for (let i = 0; i < 60; i++) {
    const m = pick(r, METRICS);
    const pool = bank.filter((c) => latest(c, m.id) !== undefined && (!m.nonBank || c.template !== "bank"));
    if (pool.length < 2) continue;
    const a = keep && latest(keep, m.id) !== undefined ? keep : pick(r, pool);
    const b = pick(r, pool.filter((c) => c.t !== a.t));
    if (b && latest(a, m.id) !== latest(b, m.id)) return { m, a, b };
  }
  return null;
}

export function HigherLower({ bank }: { bank: BankCompany[] }) {
  const { p, answer, setGame, badge } = useProgress();
  const [pair, setPair] = useState<ReturnType<typeof nextPair>>(null);
  const [guess, setGuess] = useState<"higher" | "lower" | null>(null);
  const [streak, setStreak] = useState(0);
  const [gain, setGain] = useState({ amount: 0, id: 0 });
  const [round, setRound] = useState(0);
  const [r] = useState(() => rng());
  useEffect(() => setPair(nextPair(r, bank)), [bank, r]);

  const truth = pair ? ((latest(pair.b, pair.m.id) ?? 0) > (latest(pair.a, pair.m.id) ?? 0) ? "higher" : "lower") : null;
  const done = guess !== null;

  const play = (g: "higher" | "lower") => {
    if (!pair || done) return;
    setGuess(g);
    const ok = g === truth;
    const s = ok ? streak + 1 : 0;
    const xp = ok ? 5 + Math.min(streak, 10) : 0;
    answer(ok, xp);
    setGain((x) => ({ amount: xp, id: x.id + 1 }));
    setStreak(s);
    setGame("higher-lower", s);
    if (s >= 8) badge("higher_lower");
  };
  const next = () => {
    if (!pair) return;
    setGuess(null);
    setRound((n) => n + 1);
    setPair(nextPair(r, bank, guess === truth ? pair.b : undefined));
  };

  // Arrow keys: up = higher, down = lower, Enter or right arrow = next.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA")) return;
      if (!done && e.key === "ArrowUp") (e.preventDefault(), play("higher"));
      else if (!done && e.key === "ArrowDown") (e.preventDefault(), play("lower"));
      else if (done && e.key === "ArrowRight") (e.preventDefault(), next());
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  if (!pair) return <div className="card p-6 text-sm text-muted">Loading…</div>;
  const { m, a, b } = pair;
  const va = latest(a, m.id)!;
  const vb = latest(b, m.id)!;
  const ok = guess === truth;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-semibold">
          Metric: <span className="rounded-md bg-accent-soft px-1.5 py-0.5 font-extrabold text-accent">{m.name}</span> <span className="text-muted">(latest fiscal year)</span>
        </span>
        <span key={streak} className={`chip font-mono ${streak ? "bump bg-hi text-[#12201a]" : ""}`}>
          Streak {streak} · best {p.games["higher-lower"] ?? 0}
        </span>
      </div>
      <div className="relative grid gap-4 sm:grid-cols-2">
        <span aria-hidden className="absolute top-1/2 left-1/2 z-[3] hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-ink bg-hi font-display text-sm font-extrabold text-[#12201a] shadow-[0_3px_0_var(--ink)] sm:grid">
          vs
        </span>
        <div key={`a${round}`} className="card pop flex min-h-48 flex-col p-5">
          <div className="font-mono text-[11px] font-bold tracking-widest text-muted uppercase">{a.sector}</div>
          <div className="font-display text-xl font-extrabold">{a.name}</div>
          <div className="num mt-auto pt-4 font-display text-4xl font-extrabold">{fmtUnit(va, m.unit)}</div>
        </div>
        {/* The second card flips over to reveal its number. */}
        <div key={`b${round}`} className="pop [perspective:1100px]">
          <div
            className="relative grid min-h-48 [transform-style:preserve-3d]"
            style={{ transform: done ? "rotateY(180deg)" : "none", transition: "transform 560ms var(--ease-pop)" }}
          >
            <div className="card col-start-1 row-start-1 flex flex-col p-5 [backface-visibility:hidden]">
              <div className="font-mono text-[11px] font-bold tracking-widest text-muted uppercase">{b.sector}</div>
              <div className="font-display text-xl font-extrabold">{b.name}</div>
              <div className="mt-auto flex gap-2 pt-4">
                <button className="btn btn-primary flex-1" onClick={() => play("higher")} disabled={done} aria-keyshortcuts="ArrowUp">
                  ▲ Higher
                </button>
                <button className="btn btn-ghost flex-1" onClick={() => play("lower")} disabled={done} aria-keyshortcuts="ArrowDown">
                  ▼ Lower
                </button>
              </div>
            </div>
            <div
              className={`card col-start-1 row-start-1 flex flex-col p-5 [backface-visibility:hidden] [transform:rotateY(180deg)] ${done ? (ok ? "!border-good" : "!border-bad") : ""}`}
              aria-hidden={!done}
            >
              {done && (ok ? <Stamp className="top-4 right-4" sub="good call">Right</Stamp> : <Stamp bad className="top-4 right-4" tilt={7} sub="streak reset">Wrong</Stamp>)}
              <div className="font-mono text-[11px] font-bold tracking-widest text-muted uppercase">{b.sector}</div>
              <div className="font-display text-xl font-extrabold">{b.name}</div>
              <div className={`num relative mt-auto pt-4 font-display text-4xl font-extrabold ${ok ? "text-good" : "text-bad"}`}>
                {fmtUnit(vb, m.unit)}
                <span className="ml-2 align-middle text-2xl">{truth === "higher" ? "▲" : "▼"}</span>
                {ok && <FloatXp amount={gain.amount} id={gain.id} />}
              </div>
            </div>
          </div>
        </div>
      </div>
      {done ? (
        <div className="card pop flex items-center justify-between gap-3 p-4 text-sm" role="status">
          <span>
            {ok ? <b className="text-good">Right!</b> : <b className="text-bad">{b.name} is {truth}.</b>} {ok ? `Streak ${streak}.` : "Streak reset."}
          </span>
          <button className="btn btn-primary" onClick={next} autoFocus>
            Next →
          </button>
        </div>
      ) : (
        <p className="hidden text-center text-xs text-muted sm:block">Keys: ↑ higher · ↓ lower · → next</p>
      )}
    </div>
  );
}
