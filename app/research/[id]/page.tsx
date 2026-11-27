import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Tex } from "@/components/research/Formula";
import { Lab } from "@/components/research/Lab";
import { PaperQuiz } from "@/components/research/PaperQuiz";
import { PaperStatus } from "@/components/research/PaperStatus";
import { PAPERS, paperById } from "@/lib/research/papers";

export const dynamicParams = false;
export function generateStaticParams() {
  return PAPERS.map((p) => ({ id: p.id }));
}
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const p = paperById((await params).id);
  return { title: p ? p.short : "Research" };
}

const SECTIONS = [
  ["summary", "Summary"],
  ["learnings", "Key learnings"],
  ["math", "The math"],
  ["lab", "Try the model"],
  ["quiz", "Quiz"],
] as const;

function H2({ id, n, children }: { id: string; n: number; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-24 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
      <span className="mr-2 font-mono text-sm text-muted">§{n}</span>
      {children}
    </h2>
  );
}

export default async function PaperPage({ params }: { params: Promise<{ id: string }> }) {
  const p = paperById((await params).id);
  if (!p) notFound();
  const idx = PAPERS.findIndex((x) => x.id === p.id);
  const next = PAPERS[(idx + 1) % PAPERS.length];

  return (
    <article className="mx-auto max-w-4xl">
      <Link href="/research" className="text-sm text-muted hover:text-ink">
        ← Research desk
      </Link>

      <header className="card ledger-paper pop relative mt-4 overflow-hidden p-6 pl-14 sm:p-8 sm:pl-16" style={{ backgroundColor: p.tone.bg }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={`font-mono text-xs font-bold tracking-widest uppercase ${p.tone.ink}`}>{p.topic}</span>
          <PaperStatus id={p.id} />
        </div>
        <h1 className="mt-3 text-4xl leading-[1.02] font-extrabold tracking-tight sm:text-5xl">{p.title}</h1>
        <p className="mt-2 text-sm text-muted">
          {p.authors} · {p.cite}
          {p.doi && (
            <>
              {" · "}
              <a className="underline" href={`https://doi.org/${p.doi}`} target="_blank" rel="noreferrer">
                doi:{p.doi}
              </a>
            </>
          )}
        </p>
        <p className="mt-4 max-w-2xl text-lg">{p.oneLiner}</p>
      </header>

      <nav aria-label="On this page" className="sticky top-16 z-20 -mx-1 mt-4 flex gap-1 overflow-x-auto rounded-full border border-line bg-bg/85 p-1 backdrop-blur md:top-20">
        {SECTIONS.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="rounded-full px-3 py-1.5 text-sm font-bold whitespace-nowrap text-muted hover:bg-panel hover:text-ink">
            {label}
          </a>
        ))}
      </nav>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {p.numbers.map((n) => (
          <div key={n.label} className="card p-4">
            <div className="num font-display text-2xl font-extrabold">{n.value}</div>
            <div className="mt-1 text-xs text-muted">{n.label}</div>
          </div>
        ))}
      </section>

      <section className="mt-12">
        <H2 id="summary" n={1}>Summary</H2>
        <div className="mt-4 grid gap-4 text-[1.02rem] leading-relaxed">
          {p.summary.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <H2 id="learnings" n={2}>Key learnings</H2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2">
          {p.learnings.map((l, i) => (
            <li key={l.title} className="card flex gap-3 p-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-hi font-mono text-sm font-extrabold text-[#12201a]">{i + 1}</span>
              <div>
                <div className="font-display font-extrabold">{l.title}</div>
                <p className="mt-1 text-sm text-muted">{l.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <H2 id="math" n={3}>The math</H2>
        <p className="mt-2 text-sm text-muted">The core equations, restated in standard notation with what each one says in words.</p>
        <div className="mt-4 grid gap-4">
          {p.formulas.map((f) => (
            <div key={f.name} className="card overflow-hidden">
              <div className="border-b border-line px-5 py-3 font-display font-extrabold">{f.name}</div>
              <div className="ledger-paper px-5 py-4 pl-14 text-[1.05rem]">
                <Tex tex={f.tex} block />
              </div>
              <div className="px-5 py-3 text-sm">
                {f.says}
                {f.where && (
                  <div className="mt-2 text-xs text-muted">
                    where <Tex tex={f.where} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <H2 id="lab" n={4}>Try the model</H2>
        <div className="card mt-4 p-4 sm:p-6">
          <Lab id={p.id} />
        </div>
        <div className="mt-4 rounded-2xl border border-dashed border-line bg-panel-2/50 p-4 text-sm">
          <div className="font-mono text-[11px] font-bold tracking-widest text-muted uppercase">Link to statement analysis</div>
          <ul className="mt-2 grid gap-1.5">
            {p.forAnalysts.map((t) => (
              <li key={t}>• {t}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-12">
        <H2 id="quiz" n={5}>Quiz</H2>
        <p className="mt-2 text-sm text-muted">Five questions. Get four right to master the paper.</p>
        <div className="mt-6">
          <PaperQuiz paperId={p.id} questions={p.quiz} />
        </div>
      </section>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
        <span className="text-xs text-muted">Study notes for learning, written from the published paper. Not investment advice.</span>
        <Link href={`/research/${next.id}`} className="btn btn-ghost">
          Next paper: {next.short} →
        </Link>
      </div>
    </article>
  );
}
