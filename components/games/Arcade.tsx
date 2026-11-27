"use client";
import Link from "next/link";
import { spot } from "../fx";
import { GAMES } from "./registry";
import { BestScore } from "./BestScore";

// Each cabinet gets its own colour plane, so the four games read as four machines.
export const GAME_TONES: Record<string, { tone: string; edge: string; ink: string }> = {
  "ratio-rush": { tone: "var(--hi-soft)", edge: "var(--hi-deep)", ink: "text-gold" },
  "mystery-ledger": { tone: "var(--blue-soft)", edge: "var(--blue)", ink: "text-blue" },
  "red-flag-hunt": { tone: "var(--bad-soft)", edge: "var(--bad)", ink: "text-bad" },
  "higher-lower": { tone: "var(--accent-soft)", edge: "var(--accent)", ink: "text-accent" },
};

export function Arcade() {
  return (
    <div className="rise mt-8 grid gap-5 md:grid-cols-2">
      {GAMES.map((g, i) => {
        const t = GAME_TONES[g.id];
        return (
          <Link
            key={g.id}
            href={`/play/${g.id}`}
            onPointerMove={spot}
            className="card card-hover spotlight group flex flex-col overflow-hidden"
            style={{ ["--i" as string]: i, ["--spot" as string]: t.tone }}
          >
            <div className="relative flex h-32 items-center justify-center border-b border-line" style={{ background: t.tone }}>
              <span aria-hidden className="bob-on-hover text-6xl drop-shadow-[0_6px_0_rgba(0,0,0,0.12)]">
                {g.icon}
              </span>
              <span className="absolute top-3 right-3">
                <BestScore id={g.id} />
              </span>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <div className="font-display text-2xl font-extrabold">{g.name}</div>
              <p className="mt-1 text-sm text-muted">{g.pitch}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-xs text-muted">
                  <span className="font-bold text-ink">Skill:</span> {g.skill}
                </span>
                <span className="btn btn-sm btn-primary flex-none">Play</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
