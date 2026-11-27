"use client";
import { useState } from "react";
import { useProgress } from "@/lib/game/progress";
import { PAPERS, type PaperQ } from "@/lib/research/papers";
import { QuizCard } from "../QuizCard";
import { Confetti, Stamp } from "../fx";

const XP = 15;
export const PASS = 4; // out of 5

export function PaperQuiz({ paperId, questions }: { paperId: string; questions: PaperQ[] }) {
  const { p, answer, setGame, addXp, badge } = useProgress();
  const [i, setI] = useState(0);
  const [right, setRight] = useState(0);
  const [done, setDone] = useState(false);
  const [round, setRound] = useState(0);
  const key = `paper-${paperId}`;
  const best = p.games[key];

  const finish = (score: number) => {
    const firstPass = (best ?? 0) < PASS && score >= PASS;
    setGame(key, score);
    if (firstPass) {
      addXp(40, "paper mastered");
      const others = PAPERS.filter((x) => x.id !== paperId).every((x) => (p.games[`paper-${x.id}`] ?? 0) >= PASS);
      if (others) badge("scholar");
    }
    setDone(true);
  };

  if (done) {
    const pass = right >= PASS;
    return (
      <div className="card ledger-paper relative overflow-hidden p-6 pl-14 text-center">
        <Confetti fire={pass ? round + 1 : 0} />
        <Stamp key={round} bad={!pass} large className="relative" sub={`${right} of ${questions.length}`}>
          {pass ? "Mastered" : "Reread"}
        </Stamp>
        <p className="mt-4 text-muted">{pass ? "You have the key ideas. +40 XP the first time you pass." : `Get ${PASS} of ${questions.length} to master this paper.`}</p>
        <button
          className="btn btn-primary mt-5"
          onClick={() => {
            setI(0);
            setRight(0);
            setDone(false);
            setRound((r) => r + 1);
          }}
        >
          Take it again
        </button>
      </div>
    );
  }

  const q = questions[i];
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm text-muted">
        <span className="font-mono text-xs font-bold tracking-widest uppercase">Question {i + 1} of {questions.length}</span>
        <span>{best !== undefined ? `Best ${best}/${questions.length}` : `${XP} XP per right answer`}</span>
      </div>
      <QuizCard
        key={`${round}-${i}`}
        item={{ prompt: q.q, choices: q.choices, answer: q.answer, explain: q.explain }}
        xp={XP}
        onDone={(ok) => {
          answer(ok, XP);
          if (ok) setRight((r) => r + 1);
        }}
        nextLabel={i + 1 < questions.length ? "Next question" : "See result"}
        onNext={() => (i + 1 < questions.length ? setI(i + 1) : finish(right))}
      />
    </div>
  );
}
