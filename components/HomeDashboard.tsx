"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { BankCompany } from "@/lib/game/bank";
import { randomDrill, rng, type Question } from "@/lib/game/questions";
import { levelFor, streakOf, useProgress } from "@/lib/game/progress";
import { LESSONS, PASS_MARK } from "@/lib/learn/lessons";
import { QuizCard } from "./QuizCard";
import { CountUp, Ring } from "./fx";
import { IconFlame } from "./icons";

function todaySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

export function HomeDashboard({ bank }: { bank: BankCompany[] }) {
  const { p, ready, answer, setGame } = useProgress();
  // Picked after mount: the page is pre-rendered at build time, so "today" must come from the browser.
  const [seed, setSeed] = useState(0);
  const [q, setQ] = useState<Question | null>(null);
  useEffect(() => {
    const s = todaySeed();
    setSeed(s);
    setQ(randomDrill(rng(s), bank));
  }, [bank]);
  const key = `daily-${seed}`;
  const [answered, setAnswered] = useState(false);
  const lv = levelFor(p.xp);
  const passed = LESSONS.filter((l) => (p.lessons[l.id] ?? 0) >= PASS_MARK).length;
  const next = LESSONS.find((l) => (p.lessons[l.id] ?? 0) < PASS_MARK);
  const doneToday = ready && key in p.games;
  const streak = ready ? streakOf(p.days) : 0;

  return (
    <div className="rise grid gap-4">
      {/* Player card */}
      <div className="card overflow-hidden" style={{ ["--i" as string]: 1 }}>
        <div className="flex items-center gap-4 p-5">
          <Ring value={lv.progress} size={78} stroke={9}>
            <div className="text-center leading-none">
              <div className="font-mono text-[10px] font-bold text-muted uppercase">Lv</div>
              <div className="font-display text-2xl font-extrabold">{lv.index}</div>
            </div>
          </Ring>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[11px] font-bold tracking-widest text-muted uppercase">Your title</div>
            <div className="truncate font-display text-xl font-extrabold">{lv.title}</div>
            <div className="mt-1 text-xs text-muted">
              {lv.next ? (
                <>
                  <span className="num font-bold text-ink">{Math.max(0, lv.next.xp - p.xp)}</span> XP to {lv.next.title}
                </>
              ) : (
                "Top of the ladder"
              )}
            </div>
          </div>
          <div className="grid gap-1.5 text-right">
            <span className="rounded-full bg-hi px-2.5 py-1 font-mono text-sm font-extrabold text-[#12201a]">
              <CountUp value={ready ? p.xp : 0} /> XP
            </span>
            <span className={`flex items-center justify-end gap-1 text-sm font-extrabold ${streak ? "text-bad" : "text-muted"}`} title={`${streak}-day streak`}>
              <IconFlame className={`h-4 w-4 ${streak ? "bob-on-hover" : ""}`} />
              <span className="num">{streak}</span>
              <span className="font-semibold">day{streak === 1 ? "" : "s"}</span>
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line bg-panel-2/60 px-5 py-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="hatch flex h-2.5 w-28 overflow-hidden rounded-full" aria-hidden>
              <div className="h-full rounded-full bg-accent" style={{ width: `${(passed / LESSONS.length) * 100}%`, transition: "width 600ms var(--ease-pop)" }} />
            </div>
            <span className="text-muted">
              <span className="num font-bold text-ink">{passed}</span>/{LESSONS.length} lessons
            </span>
          </div>
          {next && (
            <Link href={`/learn/${next.id}`} className="group truncate font-extrabold text-accent">
              Next: {next.title} <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </Link>
          )}
        </div>
      </div>

      {q && (
        <div style={{ ["--i" as string]: 3 }}>
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="font-mono text-xs font-extrabold tracking-widest text-muted uppercase">Daily ledger question</span>
            <span className={`chip ${doneToday && !answered ? "bg-accent-soft text-accent" : "bg-hi text-[#12201a]"}`}>{doneToday && !answered ? "Done today ✓" : "+25 XP"}</span>
          </div>
          {doneToday && !answered ? (
            <div className="card ledger-paper p-5 pl-14 text-sm text-muted">
              You have answered today&apos;s question. Come back tomorrow to keep your streak alive.
            </div>
          ) : (
            <QuizCard
              item={q}
              xp={25}
              onDone={(ok) => {
                setAnswered(true);
                answer(ok, 25);
                setGame(key, ok ? 1 : 0);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
