import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/PageHead";
import { PaperStatus } from "@/components/research/PaperStatus";
import { CHAPTERS, PRINCIPLES } from "@/lib/bogleheads/chapters";

export const metadata: Metadata = { title: "Bogleheads" };

export default function BogleheadsPage() {
  return (
    <div>
      <PageHead eyebrow="6 chapters · Bogleheads wiki and Bogle (2005)" title={<>The <span className="highlight">Bogleheads</span> philosophy</>}>
        John Bogle&apos;s case for simple, low-cost index investing, as the Bogleheads community teaches it. Each chapter has the key ideas, the arithmetic, a
        calculator to play with and a short quiz.
      </PageHead>

      <section className="card ledger-paper rise mt-8 p-5 pl-14 sm:p-6 sm:pl-16" style={{ ["--i" as string]: 1 }}>
        <div className="font-mono text-[11px] font-bold tracking-widest text-muted uppercase">The ten principles</div>
        <ol className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {PRINCIPLES.map((p, i) => (
            <li key={p} className="flex items-baseline gap-3">
              <span className="num w-6 shrink-0 text-right font-mono text-sm font-extrabold text-accent">{i + 1}</span>
              <span className="font-display text-lg font-extrabold">{p}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {CHAPTERS.map((c, i) => (
          <Link key={c.id} href={`/bogleheads/${c.id}`} className="card card-hover rise group flex flex-col overflow-hidden" style={{ ["--i" as string]: i + 2 }}>
            <div className="ledger-paper relative px-5 py-6 pl-14" style={{ backgroundColor: c.tone.bg }}>
              <div className={`font-mono text-[11px] font-bold tracking-widest uppercase ${c.tone.ink}`}>{c.topic}</div>
              <h2 className="mt-2 font-display text-2xl leading-tight font-extrabold">{c.title}</h2>
              <p className="mt-1 text-xs text-muted">{c.authors}</p>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <p className="text-sm">{c.oneLiner}</p>
              <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                <PaperStatus id={c.id} />
                <span className="text-sm font-bold text-accent transition-transform group-hover:translate-x-1">Read and play →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <p className="mt-8 max-w-3xl text-xs text-muted">
        Study notes in our own words, written from the Bogleheads wiki and John Bogle&apos;s article in the Financial Analysts Journal. Bogleheads is a registered
        trademark of the John C. Bogle Center for Financial Literacy, which does not endorse this project. Nothing here is investment advice.
      </p>
    </div>
  );
}
