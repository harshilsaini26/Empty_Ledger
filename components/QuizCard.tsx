"use client";
import { useState } from "react";
import { FloatXp, Stamp, useChoiceKeys } from "./fx";

export interface QuizItem {
  prompt: string;
  givens?: { label: string; value: string }[];
  choices: string[];
  answer: number;
  explain: string;
}

const RIGHT_STAMPS = ["Tied out", "Audited", "Balanced", "Booked"];

/** Givens shown like lines torn from a statement. */
export function Givens({ givens }: { givens: { label: string; value: string }[] }) {
  return (
    <dl className="ledger-paper mt-4 grid gap-x-6 overflow-hidden rounded-2xl border border-line py-1 pr-4 pl-12 sm:grid-cols-2">
      {givens.map((g) => (
        <div key={g.label} className="flex min-h-8 items-baseline justify-between gap-3 leading-8">
          <dt className="truncate text-sm text-muted">{g.label}</dt>
          <dd className="num font-mono text-sm font-bold">{g.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** One multiple-choice question. Calls onDone(correct) after the player answers. Keys 1-4 or A-D answer. */
export function QuizCard({
  item,
  onDone,
  footer,
  nextLabel = "Next",
  onNext,
  xp,
}: {
  item: QuizItem;
  onDone?: (correct: boolean) => void;
  footer?: React.ReactNode;
  nextLabel?: string;
  onNext?: () => void;
  /** XP shown floating off the right answer. */
  xp?: number;
}) {
  const [chosen, setChosen] = useState<number | null>(null);
  const done = chosen !== null;
  const ok = chosen === item.answer;
  const pickAnswer = (i: number) => {
    if (done) return;
    setChosen(i);
    onDone?.(i === item.answer);
  };
  useChoiceKeys(item.choices.length, !done, pickAnswer);
  const stampWord = RIGHT_STAMPS[(item.prompt.length + item.answer) % RIGHT_STAMPS.length];

  return (
    <div className={`card p-5 sm:p-6 ${done && !ok ? "shake" : ""}`}>
      {done && (ok ? <Stamp className="-top-5 right-5" sub="correct">{stampWord}</Stamp> : <Stamp bad className="-top-5 right-5" tilt={7} sub="check again">Needs review</Stamp>)}
      <p className="pr-6 font-display text-lg leading-snug font-bold sm:text-xl">{item.prompt}</p>
      {item.givens && <Givens givens={item.givens} />}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {item.choices.map((c, i) => (
          <button
            key={c + i}
            disabled={done}
            aria-keyshortcuts={String(i + 1)}
            onClick={() => pickAnswer(i)}
            className={`choice num ${done && i === item.answer ? "is-right" : done && i === chosen ? "is-wrong" : done ? "is-dim" : ""}`}
          >
            <span className="key-cap">{String.fromCharCode(65 + i)}</span>
            <span>{c}</span>
            {done && ok && i === item.answer && xp ? <FloatXp amount={xp} id={i} /> : null}
          </button>
        ))}
      </div>
      {done && (
        <div className={`pop mt-5 rounded-2xl border-l-4 p-4 text-sm leading-relaxed ${ok ? "border-good bg-accent-soft/60" : "border-bad bg-bad-soft/70"}`} role="status">
          <b className={ok ? "text-good" : "text-bad"}>{ok ? "Correct." : "Not quite."}</b> {item.explain}
        </div>
      )}
      {(footer || (done && onNext)) && (
        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="text-sm text-muted">{footer}</div>
          {done && onNext && (
            <button className="btn btn-primary pop" onClick={onNext} autoFocus>
              {nextLabel} <span aria-hidden>→</span>
            </button>
          )}
        </div>
      )}
      {!done && <p className="mt-4 hidden text-xs text-muted sm:block">Tip: press 1–{item.choices.length} or A–{String.fromCharCode(64 + item.choices.length)} to answer.</p>}
    </div>
  );
}
