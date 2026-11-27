"use client";
import { useProgress } from "@/lib/game/progress";
import { PASS } from "./PaperQuiz";

export function PaperStatus({ id }: { id: string }) {
  const { p, ready } = useProgress();
  const best = p.games[`paper-${id}`];
  if (!ready || best === undefined) return <span className="chip">Not started</span>;
  return best >= PASS ? <span className="chip bg-accent-soft text-accent">Mastered ✓</span> : <span className="chip bg-hi-soft text-gold">Best {best}/5</span>;
}
