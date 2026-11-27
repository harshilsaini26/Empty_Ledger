"use client";
import Link from "next/link";
import type { BankCompany } from "@/lib/game/bank";
import { GAMES } from "./registry";
import { GAME_TONES } from "./Arcade";
import { RatioRush } from "./RatioRush";
import { MysteryLedger } from "./MysteryLedger";
import { RedFlagHunt } from "./RedFlagHunt";
import { HigherLower } from "./HigherLower";

export function GameHost({ id, bank }: { id: string; bank: BankCompany[] }) {
  const g = GAMES.find((x) => x.id === id)!;
  const t = GAME_TONES[id];
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/play" className="group text-sm font-bold text-muted hover:text-ink">
        <span className="inline-block transition-transform group-hover:-translate-x-1">←</span> Arcade
      </Link>
      <div className="pop mt-4 flex items-center gap-4">
        <span aria-hidden className="grid h-16 w-16 flex-none place-items-center rounded-2xl border-2 border-ink text-3xl shadow-[0_4px_0_var(--ink)]" style={{ background: t.tone }}>
          {g.icon}
        </span>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{g.name}</h1>
          <p className="text-sm text-muted">{g.pitch}</p>
        </div>
      </div>
      <div className="mt-6">
        {id === "ratio-rush" && <RatioRush bank={bank} />}
        {id === "mystery-ledger" && <MysteryLedger bank={bank} />}
        {id === "red-flag-hunt" && <RedFlagHunt bank={bank} />}
        {id === "higher-lower" && <HigherLower bank={bank} />}
      </div>
    </div>
  );
}
