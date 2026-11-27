import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/PageHead";
import { PaperStatus } from "@/components/research/PaperStatus";
import { PAPERS } from "@/lib/research/papers";

export const metadata: Metadata = { title: "Research" };

export default function ResearchPage() {
  return (
    <div>
      <PageHead eyebrow="3 papers · Financial Analysts Journal" title={<>The <span className="highlight">research desk</span></>}>
        Three influential papers, each with a plain-English summary, the key learnings, the math behind it and a model you can play with. Pass a paper&apos;s
        quiz to master it.
      </PageHead>
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {PAPERS.map((p, i) => (
          <Link
            key={p.id}
            href={`/research/${p.id}`}
            className="card card-hover rise group flex flex-col overflow-hidden"
            style={{ ["--i" as string]: i + 1 }}
          >
            <div className="ledger-paper relative px-5 py-6 pl-14" style={{ backgroundColor: p.tone.bg }}>
              <div className={`font-mono text-[11px] font-bold tracking-widest uppercase ${p.tone.ink}`}>{p.topic}</div>
              <h2 className="mt-2 font-display text-2xl leading-tight font-extrabold">{p.title}</h2>
              <p className="mt-1 text-xs text-muted">{p.authors}</p>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <p className="text-sm">{p.oneLiner}</p>
              <div className="mt-4 flex items-center justify-between gap-2 pt-1">
                <PaperStatus id={p.id} />
                <span className="text-sm font-bold text-accent transition-transform group-hover:translate-x-1">Read and play →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <p className="mt-8 max-w-3xl text-xs text-muted">
        Summaries, formulas and interactive models are our own study notes for learning, written from the published papers. They are not a substitute for the
        papers themselves, and nothing here is investment advice. CFA Institute and the authors do not endorse this project.
      </p>
    </div>
  );
}
