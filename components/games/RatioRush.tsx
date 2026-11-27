"use client";
import { useEffect, useRef, useState } from "react";
import type { BankCompany } from "@/lib/game/bank";
import { randomDrill, rng, type Question } from "@/lib/game/questions";
import { useProgress } from "@/lib/game/progress";
import { Confetti, CountUp, FloatXp, Stamp, useChoiceKeys } from "../fx";
import { Givens } from "../QuizCard";
import { IconFlame } from "../icons";

const SECONDS = 90;

export function RatioRush({ bank }: { bank: BankCompany[] }) {
  const { p, answer, setGame, badge } = useProgress();
  const [state, setState] = useState<"idle" | "play" | "over">("idle");
  const [left, setLeft] = useState(SECONDS);
  const [q, setQ] = useState<Question | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [flash, setFlash] = useState<null | { ok: boolean; i: number }>(null);
  const [misses, setMisses] = useState<Question[]>([]);
  const [lastGain, setLastGain] = useState({ amount: 0, id: 0 });
  const r = useRef(rng());

  useEffect(() => {
    if (state !== "play") return;
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [state]);

  useEffect(() => {
    if (state === "play" && left <= 0) {
      setState("over");
      setGame("ratio-rush", score);
      if (score >= 10) badge("speed");
    }
  }, [left, state, score, setGame, badge]);

  const start = () => {
    r.current = rng();
    setScore(0);
    setStreak(0);
    setXp(0);
    setMisses([]);
    setLeft(SECONDS);
    setQ(randomDrill(r.current, bank));
    setState("play");
  };

  const choose = (i: number) => {
    if (!q || flash) return;
    const ok = i === q.answer;
    const mult = streak >= 5 ? 3 : streak >= 2 ? 2 : 1;
    const gained = ok ? 5 * mult : 0;
    answer(ok, gained);
    if (ok) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
      setXp((x) => x + gained);
      setLastGain((g) => ({ amount: gained, id: g.id + 1 }));
    } else {
      setStreak(0);
      setMisses((m) => [...m, q]);
    }
    setFlash({ ok, i });
    setTimeout(() => {
      setFlash(null);
      setQ(randomDrill(r.current, bank));
    }, ok ? 450 : 1100);
  };

  useChoiceKeys(q?.choices.length ?? 0, state === "play" && !flash, choose);

  if (state === "idle")
    return (
      <div className="card ledger-paper overflow-hidden p-8 pl-14 text-center">
        <div aria-hidden className="text-6xl">⚡</div>
        <p className="mx-auto mt-3 max-w-md text-muted">
          You get the statement lines; pick the right ratio. Answers in a row multiply XP: <b className="text-ink">2x</b> after 2, <b className="text-ink">3x</b> after 5.
        </p>
        <p className="mt-3 text-sm">
          Personal best: <span className="rounded-full bg-hi px-2 py-0.5 font-mono font-extrabold text-[#12201a]">{p.games["ratio-rush"] ?? 0}</span>
        </p>
        <button className="btn btn-primary mt-6 text-base" onClick={start} autoFocus>
          Start the clock · {SECONDS}s
        </button>
        <p className="mt-3 hidden text-xs text-muted sm:block">Keys 1–4 answer, so you never have to leave the keyboard.</p>
      </div>
    );

  if (state === "over") {
    const best = Math.max(score, p.games["ratio-rush"] ?? 0);
    const record = score > 0 && score >= (p.games["ratio-rush"] ?? 0);
    return (
      <div className="card pop relative p-6">
        <Confetti fire={record ? 1 : 0} />
        <div className="relative text-center">
          {record && <Stamp large className="top-0 right-0" tilt={8} sub="personal best">Record</Stamp>}
          <div className="font-mono text-xs font-extrabold tracking-widest text-muted uppercase">Time&apos;s up</div>
          <h2 className="mt-2 font-display text-6xl font-extrabold">
            <CountUp value={score} duration={900} />
          </h2>
          <p className="text-muted">
            correct · <b className="text-ink">+{xp} XP</b> · best {best}
          </p>
          <button className="btn btn-primary mt-5" onClick={start} autoFocus>
            Play again
          </button>
        </div>
        {misses.length > 0 && (
          <div className="mt-8">
            <h3 className="font-display text-lg font-extrabold">Review your misses</h3>
            <ul className="rise mt-3 grid gap-2 text-sm">
              {misses.map((m, i) => (
                <li key={i} className="rounded-2xl bg-panel-2 p-3" style={{ ["--i" as string]: i }}>
                  <div className="font-semibold">{m.prompt}</div>
                  <div className="mt-1 text-muted">
                    Answer: <b className="text-ink">{m.choices[m.answer]}</b>. {m.explain}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  const mult = streak >= 5 ? 3 : streak >= 2 ? 2 : 1;
  const low = left <= 10;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className={`num font-display text-4xl font-extrabold ${low ? "timer-low text-bad" : ""}`} aria-live="off">
          {left}
          <span className="text-lg text-muted">s</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="relative rounded-full border border-line bg-panel px-3 py-1">
            Score <b className="num"><CountUp value={score} duration={250} /></b>
            <FloatXp amount={lastGain.amount} id={lastGain.id} />
          </span>
          <span key={mult} className={`flex items-center gap-1 rounded-full px-3 py-1 font-extrabold ${mult > 1 ? "bump bg-hi text-[#12201a]" : "bg-panel-2 text-muted"}`}>
            <IconFlame className="h-4 w-4" /> {streak}
            {mult > 1 && <span className="font-mono">· {mult}x</span>}
          </span>
        </div>
      </div>
      <div className="hatch mb-4 h-3 overflow-hidden rounded-full" aria-hidden>
        <div
          className={`h-full rounded-full ${low ? "bg-bad" : left <= 30 ? "bg-hi" : "bg-accent"}`}
          style={{ width: `${(left / SECONDS) * 100}%`, transition: "width 1s linear, background 300ms" }}
        />
      </div>
      {q && (
        <div key={q.prompt + score + misses.length} className={`card p-5 sm:p-6 ${flash && !flash.ok ? "shake" : "pop"}`}>
          {flash && (flash.ok ? <Stamp className="-top-5 right-5" tilt={-8}>Tied out</Stamp> : <Stamp bad className="-top-5 right-5" tilt={6}>Miss</Stamp>)}
          <p className="pr-6 font-display text-lg font-bold sm:text-xl">{q.prompt}</p>
          {q.givens && <Givens givens={q.givens} />}
          <div className="mt-5 grid grid-cols-2 gap-3">
            {q.choices.map((c, i) => (
              <button
                key={c + i}
                onClick={() => choose(i)}
                disabled={!!flash}
                className={`choice num ${flash && i === q.answer ? "is-right" : flash && flash.i === i ? "is-wrong" : flash ? "is-dim" : ""}`}
              >
                <span className="key-cap">{i + 1}</span>
                <span>{c}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
