"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { BankCompany } from "@/lib/game/bank";
import { DRILLS, drillQuestion, pick, rng, shuffle, type Question } from "@/lib/game/questions";
import { useProgress } from "@/lib/game/progress";
import { LESSONS, PASS_MARK, lessonById } from "@/lib/learn/lessons";
import { QuizCard, type QuizItem } from "./QuizCard";
import { Confetti, CountUp, Stamp } from "./fx";

function buildQuiz(lessonId: string, bank: BankCompany[]): QuizItem[] {
  const lesson = lessonById(lessonId)!;
  const r = rng();
  const items: QuizItem[] = lesson.questions.map((q) => ({ prompt: q.q, choices: q.choices, answer: q.answer, explain: q.explain }));
  // Drills: real companies first when the SEC data exists, training companies otherwise.
  const real = bank.filter((c) => !c.practice);
  const pool = real.length ? real : bank;
  const drills: Question[] = [];
  for (const id of lesson.drills) {
    const d = DRILLS.find((x) => x.id === id);
    if (!d) continue;
    for (let i = 0; i < 30; i++) {
      const q = drillQuestion(r, pick(r, pool), d) ?? drillQuestion(r, pick(r, bank), d);
      if (q) {
        drills.push(q);
        break;
      }
    }
  }
  return [...items, ...shuffle(r, drills)];
}

export function LessonRunner({ lessonId, bank }: { lessonId: string; bank: BankCompany[] }) {
  const lesson = lessonById(lessonId)!;
  const idx = LESSONS.findIndex((l) => l.id === lessonId);
  const nextLesson = LESSONS[idx + 1];
  const { p, answer, setLesson, addXp, badge } = useProgress();
  const [stage, setStage] = useState<"read" | "quiz" | "done">("read");
  const [card, setCard] = useState(0);
  const [dir, setDir] = useState<"next" | "prev">("next");
  const go = (d: 1 | -1) => {
    setDir(d > 0 ? "next" : "prev");
    setCard((c) => c + d);
  };
  const [quiz, setQuiz] = useState<QuizItem[]>([]);
  const [qi, setQi] = useState(0);
  const [right, setRight] = useState(0);

  useEffect(() => setQuiz(buildQuiz(lessonId, bank)), [lessonId, bank]);

  const finish = (finalRight: number) => {
    const score = quiz.length ? finalRight / quiz.length : 0;
    const firstPass = (p.lessons[lesson.id] ?? 0) < PASS_MARK && score >= PASS_MARK;
    setLesson(lesson.id, score);
    if (firstPass) {
      addXp(50, "lesson passed");
      if (lesson.badge && lesson.badge !== "graduate") badge(lesson.badge);
      const allPassed = LESSONS.every((l) => l.id === lesson.id || (p.lessons[l.id] ?? 0) >= PASS_MARK);
      if (allPassed) badge("graduate");
    }
    setStage("done");
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/learn" className="group text-sm font-bold text-muted hover:text-ink">
        <span className="inline-block transition-transform group-hover:-translate-x-1">←</span> Learning path
      </Link>
      <div className="pop mt-4 flex items-center gap-4">
        <span aria-hidden className="grid h-16 w-16 flex-none place-items-center rounded-full border-2 border-[var(--hi-deep)] bg-hi text-3xl shadow-[0_4px_0_var(--hi-deep)]">
          {lesson.icon}
        </span>
        <div>
          <div className="font-mono text-xs font-extrabold tracking-[0.18em] text-muted uppercase">
            Stop {idx + 1} of {LESSONS.length} · {lesson.reading}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">{lesson.title}</h1>
        </div>
      </div>

      {stage === "read" && (
        <div className="mt-7">
          <div className="mb-4 flex gap-1.5" aria-label={`Card ${card + 1} of ${lesson.cards.length}`} role="img">
            {lesson.cards.map((_, i) => (
              <div key={i} className="hatch h-2 flex-1 overflow-hidden rounded-full">
                <div className="h-full rounded-full bg-accent" style={{ width: i <= card ? "100%" : "0%", transition: "width 360ms var(--ease-pop)" }} />
              </div>
            ))}
          </div>
          {/* A small deck: two paper edges peek out behind the current card. */}
          <div className="relative">
            {card < lesson.cards.length - 1 && <div aria-hidden className="absolute inset-x-4 -bottom-2 h-full rotate-[0.6deg] rounded-[22px] border border-line bg-panel" />}
            {card < lesson.cards.length - 2 && <div aria-hidden className="absolute inset-x-8 -bottom-4 h-full -rotate-[0.8deg] rounded-[22px] border border-line bg-panel-2" />}
            <div key={card} className={`card relative p-6 sm:p-8 ${dir === "next" ? "deal-next" : "deal-prev"}`}>
              <div className="font-mono text-xs font-bold text-muted">
                {String(card + 1).padStart(2, "0")} / {String(lesson.cards.length).padStart(2, "0")}
              </div>
              <h2 className="mt-1 text-2xl font-extrabold">{lesson.cards[card].title}</h2>
              <p className="mt-3 text-[1.05rem] leading-relaxed">{lesson.cards[card].body}</p>
              {lesson.cards[card].formula && (
                <div className="mt-5 rounded-2xl border-2 border-ink bg-ink p-1 shadow-[0_4px_0_var(--line)]">
                  <div className="rounded-xl bg-[#1d2b24] px-4 py-3 font-mono text-sm text-[#b9f5d8] dark:bg-[#0b1511]">
                    <span aria-hidden className="mr-2 text-hi">ƒ</span>
                    {lesson.cards[card].formula}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="mt-7 flex justify-between">
            <button className="btn btn-ghost" disabled={card === 0} onClick={() => go(-1)}>
              ← Back
            </button>
            {card < lesson.cards.length - 1 ? (
              <button className="btn btn-primary" onClick={() => go(1)}>
                Next card →
              </button>
            ) : (
              <button className="btn btn-hi" onClick={() => setStage("quiz")} disabled={!quiz.length}>
                Take the quiz · {quiz.length} questions →
              </button>
            )}
          </div>
        </div>
      )}

      {stage === "quiz" && quiz[qi] && (
        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-mono font-bold text-muted">
              Q{qi + 1}/{quiz.length}
            </span>
            <div className="flex gap-1" aria-hidden>
              {quiz.map((_, i) => (
                <span key={i} className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${i < qi ? "bg-accent" : i === qi ? "scale-125 bg-hi" : "bg-line"}`} />
              ))}
            </div>
            <span className="chip bg-accent-soft text-accent">
              <span className="num">{right}</span> correct
            </span>
          </div>
          <QuizCard
            key={qi}
            item={quiz[qi]}
            xp={10}
            onDone={(ok) => {
              answer(ok, 10);
              if (ok) setRight((r) => r + 1);
            }}
            nextLabel={qi + 1 < quiz.length ? "Next question" : "See results"}
            onNext={() => (qi + 1 < quiz.length ? setQi(qi + 1) : finish(right))}
          />
        </div>
      )}

      {stage === "done" && (
        <div className="card pop relative mt-7 overflow-visible p-8 text-center">
          {(() => {
            const score = right / quiz.length;
            const pass = score >= PASS_MARK;
            return (
              <>
                <Confetti fire={pass ? 1 : 0} count={36} />
                <div className="relative mx-auto h-24 w-64">
                  {pass ? (
                    <Stamp large className="top-2 left-1/2 -translate-x-1/2" sub="lesson passed">
                      Audited
                    </Stamp>
                  ) : (
                    <Stamp large bad tilt={6} className="top-2 left-1/2 -translate-x-1/2" sub={`${Math.round(PASS_MARK * 100)}% to pass`}>
                      Revise
                    </Stamp>
                  )}
                </div>
                <h2 className="mt-4 font-display text-6xl font-extrabold">
                  <CountUp value={Math.round(score * 100)} duration={900} />%
                </h2>
                <p className="mt-1 text-muted">
                  {right} of {quiz.length} correct. {pass ? "The books tie out." : `You need ${Math.round(PASS_MARK * 100)}% to unlock the next stop.`}
                </p>
                {lesson.explore && (
                  <p className="mx-auto mt-5 max-w-md rounded-2xl bg-blue-soft px-4 py-3 text-sm">
                    <b>Explore:</b> {lesson.explore.prompt}{" "}
                    <Link className="font-extrabold text-blue" href={`/company/${lesson.explore.ticker}?tab=${lesson.explore.tab}`}>
                      Open →
                    </Link>
                  </p>
                )}
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setQuiz(buildQuiz(lessonId, bank));
                      setQi(0);
                      setRight(0);
                      setStage("quiz");
                    }}
                  >
                    Retry with new numbers
                  </button>
                  {pass && nextLesson && (
                    <Link className="btn btn-primary" href={`/learn/${nextLesson.id}`} autoFocus>
                      Next stop: {nextLesson.title} →
                    </Link>
                  )}
                  {pass && !nextLesson && (
                    <Link className="btn btn-hi" href="/play">
                      Path complete. Go play →
                    </Link>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
