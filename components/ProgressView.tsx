"use client";
import { BADGES, LEVELS, levelFor, streakOf, useProgress } from "@/lib/game/progress";
import { LESSONS, PASS_MARK } from "@/lib/learn/lessons";
import { GAMES } from "./games/registry";
import { CountUp, Ring } from "./fx";
import { PageHead } from "./PageHead";

export function ProgressView() {
  const { p, ready, reset } = useProgress();
  if (!ready) return null;
  const lv = levelFor(p.xp);
  const acc = p.answered ? Math.round((100 * p.correct) / p.answered) : 0;
  const passed = LESSONS.filter((l) => (p.lessons[l.id] ?? 0) >= PASS_MARK).length;
  const streak = streakOf(p.days);
  return (
    <div className="grid gap-8">
      <PageHead eyebrow="Saved in this browser only" title={<>Your <span className="highlight">career</span></>}>
        XP, badges and lesson scores live in this browser. Clearing site data resets them.
      </PageHead>

      <div className="rise grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card flex items-center gap-4 p-4" style={{ ["--i" as string]: 0 }}>
          <Ring value={lv.progress} size={60} stroke={7}>
            <span className="font-display text-lg font-extrabold">{lv.index}</span>
          </Ring>
          <div>
            <div className="font-mono text-[11px] font-bold tracking-widest text-muted uppercase">Level</div>
            <div className="font-display text-lg leading-tight font-extrabold">{lv.title}</div>
          </div>
        </div>
        {[
          { k: "XP", v: p.xp, suffix: "", tone: "bg-hi-soft" },
          { k: "Accuracy", v: acc, suffix: `% of ${p.answered}`, tone: "bg-accent-soft" },
          { k: "Streak", v: streak, suffix: streak === 1 ? " day" : " days", tone: "bg-bad-soft" },
        ].map((s, i) => (
          <div key={s.k} className={`card p-4 ${s.tone}`} style={{ ["--i" as string]: i + 1 }}>
            <div className="font-mono text-[11px] font-bold tracking-widest text-muted uppercase">{s.k}</div>
            <div className="mt-1 font-display text-3xl font-extrabold">
              <CountUp value={s.v} duration={800} />
              <span className="text-base font-bold text-muted">{s.suffix}</span>
            </div>
          </div>
        ))}
      </div>

      <section className="card p-5">
        <h2 className="text-xl font-extrabold">Career ladder</h2>
        {/* A literal staircase: each rung sits a step higher than the last. */}
        <ol className="mt-5 flex items-end gap-1.5 overflow-x-auto pb-1">
          {LEVELS.map((l, i) => {
            const reached = p.xp >= l.xp;
            const here = i + 1 === lv.index;
            return (
              <li key={l.title} className="flex min-w-[5.5rem] flex-1 flex-col items-center gap-1.5">
                {here && <span className="pop rounded-full bg-ink px-2 py-0.5 font-mono text-[10px] font-extrabold text-bg uppercase">You</span>}
                <div
                  className={`flex w-full flex-col justify-end rounded-t-xl border-2 px-2 py-2 text-center ${
                    here ? "border-ink bg-hi text-[#12201a] shadow-[0_4px_0_var(--ink)]" : reached ? "border-accent-deep bg-accent text-on-accent" : "hatch border-dashed border-line text-muted"
                  }`}
                  style={{ height: `${3.5 + i * 0.9}rem` }}
                >
                  <div className="text-xs leading-tight font-extrabold">{l.title}</div>
                  <div className="font-mono text-[10px] opacity-80">{l.xp} XP</div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="card p-5">
        <h2 className="text-xl font-extrabold">
          Sticker book <span className="font-mono text-sm text-muted">{p.badges.length}/{Object.keys(BADGES).length}</span>
        </h2>
        <div className="rise mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Object.entries(BADGES).map(([id, b], i) => {
            const has = p.badges.includes(id);
            return (
              <div
                key={id}
                className={`flex flex-col items-center rounded-3xl p-4 text-center ${has ? "sticker bg-hi-soft" : "border-2 border-dashed border-line"}`}
                style={{ ["--i" as string]: i, ["--tilt" as string]: `${((i * 37) % 7) - 3}deg` }}
              >
                <span aria-hidden className={`text-4xl ${has ? "" : "opacity-40 grayscale"}`}>
                  {b.icon}
                </span>
                <div className={`mt-2 text-sm font-extrabold ${has ? "" : "text-muted"}`}>{b.name}</div>
                <div className="mt-0.5 text-xs text-muted">{b.desc}</div>
                {!has && <span className="sr-only">Not earned yet</span>}
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-xl font-extrabold">
            Lessons <span className="font-mono text-sm text-muted">{passed}/{LESSONS.length} passed</span>
          </h2>
          <ul className="mt-3 grid gap-2 text-sm">
            {LESSONS.map((l) => {
              const sc = p.lessons[l.id];
              return (
                <li key={l.id} className="grid grid-cols-[1fr_6rem_2.5rem] items-center gap-3">
                  <span className="truncate">
                    <span aria-hidden>{l.icon}</span> {l.title}
                  </span>
                  <span className="hatch h-2 overflow-hidden rounded-full" aria-hidden>
                    <span className={`block h-full rounded-full ${(sc ?? 0) >= PASS_MARK ? "bg-accent" : "bg-bad"}`} style={{ width: `${Math.round((sc ?? 0) * 100)}%` }} />
                  </span>
                  <span className="num text-right font-mono text-muted">{sc !== undefined ? `${Math.round(sc * 100)}%` : "–"}</span>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="card p-5">
          <h2 className="text-xl font-extrabold">Personal bests</h2>
          <ul className="mt-3 grid gap-2 text-sm">
            {GAMES.map((g) => (
              <li key={g.id} className="flex justify-between">
                <span>
                  <span aria-hidden>{g.icon}</span> {g.name}
                </span>
                <span className="num font-mono font-bold">{p.games[g.id] ?? "–"}</span>
              </li>
            ))}
            <li className="flex justify-between">
              <span>
                <span aria-hidden>🧭</span> Reports opened
              </span>
              <span className="num font-mono font-bold">{p.viewed.length}</span>
            </li>
            <li className="flex justify-between">
              <span>
                <span aria-hidden>🔮</span> Right calls
              </span>
              <span className="num font-mono font-bold">{Object.values(p.calls).filter(Boolean).length}</span>
            </li>
          </ul>
        </section>
      </div>
      <div>
        <button
          className="btn btn-sm btn-ghost text-bad"
          onClick={() => {
            if (confirm("Reset all XP, badges and lesson scores in this browser? This cannot be undone.")) reset();
          }}
        >
          Reset my progress
        </button>
      </div>
    </div>
  );
}
