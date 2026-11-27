import type { Metadata } from "next";
import Link from "next/link";
import { LearnPath } from "@/components/LearnPath";
import { PageHead } from "@/components/PageHead";

export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  return (
    <div>
      <PageHead eyebrow="11 lessons · CFA Level I FSA" title={<>The <span className="highlight">learning path</span></>}>
        Each stop has a short read, a concept quiz and drills that use real company numbers. Score 60% to unlock the next stop.
      </PageHead>
      <LearnPath />
      <Link
        href="/research"
        className="card card-hover ledger-paper mt-10 flex flex-wrap items-center justify-between gap-4 p-5 pl-14"
      >
        <div>
          <div className="font-mono text-[11px] font-bold tracking-widest text-muted uppercase">Beyond the path · Research desk</div>
          <div className="mt-1 font-display text-xl font-extrabold">Three Financial Analysts Journal papers, with the math and a model to play with</div>
          <p className="mt-1 text-sm text-muted">Enhanced Portfolio Optimization · Buffett&apos;s Alpha · Redefining the Optimal Retirement Income Strategy</p>
        </div>
        <span className="btn btn-primary">Open the desk →</span>
      </Link>
      <Link
        href="/bogleheads"
        className="card card-hover ledger-paper mt-4 flex flex-wrap items-center justify-between gap-4 p-5 pl-14"
      >
        <div>
          <div className="font-mono text-[11px] font-bold tracking-widest text-muted uppercase">Beyond the path · Bogleheads</div>
          <div className="mt-1 font-display text-xl font-extrabold">The Bogleheads philosophy: save a lot, buy the market cheaply, stay the course</div>
          <p className="mt-1 text-sm text-muted">Ten principles · start-up kit · Bogle&apos;s humble arithmetic · saving rate · saving early · comparing investments</p>
        </div>
        <span className="btn btn-primary">Start reading →</span>
      </Link>
    </div>
  );
}
