"use client";
import Link from "next/link";
import { LESSONS, PASS_MARK } from "@/lib/learn/lessons";
import { useProgress } from "@/lib/game/progress";
import { IconCheck, IconLock } from "./icons";

// The path winds like a board game: each stop is offset along a gentle wave.
const WAVE = [0, 1, 2, 1, 0, -1, -2, -1];

export function LearnPath() {
  const { p } = useProgress();
  const current = LESSONS.findIndex((l, i) => (p.lessons[l.id] ?? 0) < PASS_MARK && (i === 0 || (p.lessons[LESSONS[i - 1].id] ?? 0) >= PASS_MARK));
  return (
    <ol className="rise relative mt-10 grid gap-5">
      {LESSONS.map((l, i) => {
        const score = p.lessons[l.id];
        const passed = (score ?? 0) >= PASS_MARK;
        const unlocked = i === 0 || (p.lessons[LESSONS[i - 1].id] ?? 0) >= PASS_MARK;
        const isCurrent = i === current;
        const coin = passed
          ? "bg-accent text-on-accent border-accent-deep shadow-[0_5px_0_var(--accent-deep)]"
          : unlocked
            ? "bg-hi text-[#12201a] border-[var(--hi-deep)] shadow-[0_5px_0_var(--hi-deep)]"
            : "bg-panel-2 text-muted border-dashed border-line";
        const body = (
          <>
            <span
              className={`relative grid h-12 w-12 flex-none place-items-center rounded-full border-2 font-display text-lg sm:h-16 sm:w-16 sm:text-xl font-extrabold transition-transform duration-200 ${coin} ${
                unlocked ? "group-hover:-translate-y-1 group-active:translate-y-1 group-active:shadow-none" : ""
              } ${isCurrent ? "breathe" : ""}`}
            >
              {passed ? <IconCheck className="h-7 w-7" /> : unlocked ? <span aria-hidden>{l.icon}</span> : <IconLock className="h-6 w-6" />}
              <span className="absolute -right-1 -bottom-1 grid h-6 w-6 place-items-center rounded-full border-2 border-panel bg-ink font-mono text-[10px] text-bg">{i + 1}</span>
            </span>
            <span className={`card flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3 p-4 ${unlocked ? "card-hover" : "opacity-70"}`}>
              <span className="min-w-0">
                <span className="block font-display text-lg leading-tight font-extrabold">{l.title}</span>
                <span className="mt-0.5 block text-sm text-muted">{l.summary}</span>
                <span className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
                  <span className="chip">{l.reading}</span>
                  <span className="chip">{l.minutes} min</span>
                  {score !== undefined && <span className={`chip ${passed ? "bg-accent-soft text-accent" : "bg-bad-soft text-bad"}`}>Best {Math.round(score * 100)}%</span>}
                </span>
              </span>
              {unlocked ? (
                <span className={`btn btn-sm ${passed ? "btn-ghost" : "btn-primary"}`}>{passed ? "Review" : score !== undefined ? "Retry" : "Start"}</span>
              ) : (
                <span className="chip">Pass lesson {i} first</span>
              )}
            </span>
          </>
        );
        return (
          <li key={l.id} className="relative" style={{ ["--i" as string]: i, ["--w" as string]: WAVE[i % WAVE.length] }}>
            {isCurrent && (
              <span className="pop absolute -top-3 left-1 z-[2] rounded-full bg-ink px-2.5 py-0.5 font-mono text-[11px] font-extrabold text-bg uppercase md:left-[calc((var(--w)_+_2)*2.5rem_+_0.25rem)]">
                You are here
              </span>
            )}
            <div className="md:pr-[calc((2_-_var(--w))*2.5rem)] md:pl-[calc((var(--w)_+_2)*2.5rem)]">
              {unlocked ? (
                <Link href={`/learn/${l.id}`} className="group flex items-center gap-3 sm:gap-4" aria-label={`Lesson ${i + 1}: ${l.title}${passed ? " (passed)" : ""}`}>
                  {body}
                </Link>
              ) : (
                <div className="flex items-center gap-3 sm:gap-4" aria-disabled>
                  {body}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
