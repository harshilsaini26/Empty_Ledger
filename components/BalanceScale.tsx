"use client";
// Warm-up: put each line item on the side of the balance sheet it belongs to.
// The beam tilts (CSS transition on the pop curve) until Assets = Liabilities + Equity,
// then the stamp lands. No animation library; reduced motion is handled in globals.css.
import { useState } from "react";
import { useProgress } from "@/lib/game/progress";
import { Confetti, Stamp } from "./fx";

type Side = "tray" | "assets" | "claims";
const ITEMS = [
  { id: "cash", label: "Cash", v: 40, side: "assets" },
  { id: "debt", label: "Long-term debt", v: 65, side: "claims" },
  { id: "inv", label: "Inventory", v: 45, side: "assets" },
  { id: "eq", label: "Equity", v: 100, side: "claims" },
  { id: "ar", label: "Receivables", v: 25, side: "assets" },
  { id: "ap", label: "Payables", v: 35, side: "claims" },
  { id: "ppe", label: "PP&E", v: 90, side: "assets" },
] as const;
const NEXT: Record<Side, Side> = { tray: "assets", assets: "claims", claims: "tray" };
const ARM = 95; // px from the pivot to each pan string
const SWING = "transform 520ms var(--ease-pop)";
const empty = () => Object.fromEntries(ITEMS.map((i) => [i.id, "tray" as Side])) as Record<string, Side>;

function Chip({ label, v, where, onTap }: { label: string; v: number; where: Side; onTap: () => void }) {
  return (
    <button
      onClick={onTap}
      aria-label={`${label}, ${v}. ${where === "tray" ? "Not placed" : where === "assets" ? "On the Assets side" : "On the Liabilities and Equity side"}. Tap to move.`}
      className={`pop flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap shadow-sm transition-transform duration-150 hover:-translate-y-0.5 active:scale-95 ${
        where === "tray" ? "border-line bg-panel" : where === "assets" ? "border-accent/40 bg-accent-soft" : "border-blue/40 bg-blue-soft"
      }`}
    >
      {label}
      <span className="num font-mono text-muted">{v}</span>
    </button>
  );
}

export function BalanceScale() {
  const { p, ready, addXp, setGame } = useProgress();
  const [place, setPlace] = useState<Record<string, Side>>(empty);
  const [wins, setWins] = useState(0);

  const sum = (s: Side) => ITEMS.filter((i) => place[i.id] === s).reduce((a, i) => a + i.v, 0);
  const A = sum("assets");
  const C = sum("claims");
  const placed = ITEMS.every((i) => place[i.id] !== "tray");
  const wrong = ITEMS.filter((i) => place[i.id] !== "tray" && place[i.id] !== i.side);
  const solved = placed && wrong.length === 0;
  const diff = A - C;
  const angle = Math.max(-13, Math.min(13, -diff * 0.09));
  const lift = Math.sin((angle * Math.PI) / 180) * ARM;

  const move = (id: string) => {
    const next = { ...place, [id]: NEXT[place[id]] };
    setPlace(next);
    if (ITEMS.every((i) => next[i.id] === i.side)) {
      setWins((w) => w + 1);
      if (ready && !p.games["balance-scale"]) {
        addXp(15, "books balanced");
        setGame("balance-scale", 1);
      }
    }
  };

  const hint = solved
    ? "Assets = Liabilities + Equity. Every balance sheet obeys it."
    : placed && diff === 0
      ? `It balances, but ${wrong[0]?.label} is on the wrong side. Look again.`
      : placed
        ? `Off by ${Math.abs(diff)}. Something is on the wrong side.`
        : A + C === 0
          ? "Tap a line item to put it on the Assets side. Tap again to move it across."
          : diff > 0
            ? "Assets are heavier. What funds them?"
            : diff < 0
              ? "Claims are heavier. What do they pay for?"
              : "Level for now. Keep going.";

  const pan = (side: "assets" | "claims") => (
    <div
      className="absolute top-0 flex w-[44%] flex-col items-center"
      style={{ [side === "assets" ? "left" : "right"]: 0, transform: `translateY(${side === "assets" ? -lift : lift}px)`, transition: SWING }}
    >
      <div className="h-6 w-px bg-muted/60" />
      <div
        className={`flex h-[124px] w-full flex-wrap content-end justify-center gap-1 rounded-b-[28px] border-2 border-t-0 px-1.5 pt-1 pb-2 ${
          side === "assets" ? "border-accent/50 bg-accent-soft/40" : "border-blue/50 bg-blue-soft/40"
        }`}
      >
        {ITEMS.filter((i) => place[i.id] === side).map((i) => (
          <Chip key={i.id} {...i} where={side} onTap={() => move(i.id)} />
        ))}
      </div>
      <div className="mt-1.5 text-center">
        <div className="font-mono text-[10px] font-bold tracking-widest text-muted uppercase">{side === "assets" ? "Assets" : "Liabilities + Equity"}</div>
        <div className={`num font-mono text-lg font-bold ${side === "assets" ? "text-accent" : "text-blue"}`}>{side === "assets" ? A : C}</div>
      </div>
    </div>
  );

  return (
    <div className="card ledger-paper relative overflow-hidden p-5 pl-14">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] font-bold tracking-widest text-muted uppercase">Warm-up · 30 seconds</div>
          <h2 className="mt-1 font-display text-xl font-extrabold">Make the books balance</h2>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setPlace(empty())}>
          Reset
        </button>
      </div>

      <div className="relative mx-auto mt-4 h-[262px] w-full max-w-[340px]">
        <div aria-hidden className="absolute inset-x-0 top-[22px]" style={{ transform: `rotate(${angle}deg)`, transition: SWING }}>
          <div className="h-2 w-full rounded-full bg-ink" />
        </div>
        <div aria-hidden className="absolute top-[14px] left-1/2 h-4 w-4 -translate-x-1/2 rounded-full border-[3px] border-ink bg-hi" />
        <div aria-hidden className="absolute bottom-0 left-1/2 w-1.5 -translate-x-1/2 rounded-full bg-ink/80" style={{ top: 26 }} />
        <div aria-hidden className="absolute bottom-0 left-1/2 h-2 w-24 -translate-x-1/2 rounded-full bg-ink/80" />
        <div className="absolute inset-x-0 top-[26px]">
          {pan("assets")}
          {pan("claims")}
        </div>
        <Confetti fire={solved ? wins : 0} count={22} />
      </div>

      <div className="relative mt-3 min-h-[64px] rounded-2xl border border-dashed border-line bg-panel/70 p-2">
        {solved && (
          <div className="absolute inset-0 grid place-items-center">
            <Stamp key={wins} className="relative" sub="Tied out">Balanced</Stamp>
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          {ITEMS.filter((i) => place[i.id] === "tray").map((i) => (
            <Chip key={i.id} {...i} where="tray" onTap={() => move(i.id)} />
          ))}
          {placed && !solved && <span className="px-1 py-1 text-xs text-muted">Tray empty. Tap any item on the scale to move it.</span>}
        </div>
      </div>
      <p className={`mt-3 text-sm ${solved ? "font-semibold text-good" : "text-muted"}`} aria-live="polite">
        {hint}
      </p>
    </div>
  );
}
