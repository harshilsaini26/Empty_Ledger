import Link from "next/link";
import { getAllCompanies, hasSecData } from "@/lib/data";
import { toBank } from "@/lib/game/bank";
import { TAGLINE } from "@/lib/brand";
import { HomeDashboard } from "@/components/HomeDashboard";
import { FeatureCards } from "@/components/FeatureCards";
import { Ticker } from "@/components/fx";

const TAPE = [
  "ROE = Net margin × Asset turnover × Equity multiplier",
  "Current ratio = Current assets ÷ Current liabilities",
  "FCF = CFO − Capex",
  "DSO = Receivables ÷ Revenue × 365",
  "Gross margin = Gross profit ÷ Revenue",
  "Debt / EBITDA",
  "Accruals = (Net income − CFO) ÷ Avg. total assets",
  "Interest coverage = EBIT ÷ Interest expense",
  "Altman Z · Beneish M · Piotroski F",
];

export default function Home() {
  const bank = getAllCompanies().map(toBank);
  const sec = hasSecData();
  return (
    <div className="grid gap-12">
      <section className="grid items-start gap-8 md:grid-cols-[1.15fr_1fr] md:gap-10">
        <div className="pop md:pt-6">
          <span className="chip border border-line bg-panel font-mono tracking-wide text-muted uppercase">CFA Level I · Financial Statement Analysis</span>
          <h1 className="mt-4 text-5xl leading-[0.98] font-extrabold tracking-tight sm:text-6xl md:text-7xl">
            Read the books.
            <br />
            Become a <span className="highlight">Legend</span>.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">{TAGLINE}</p>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Five years of 10-K numbers for the 50 largest S&amp;P 500 companies, 70+ ratios, DuPont, Altman, Beneish and Piotroski, plus an upload tool for any
            statement you have.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/learn" className="btn btn-primary">
              Start the learning path <span aria-hidden>→</span>
            </Link>
            <Link href="/play" className="btn btn-hi">
              Play a game
            </Link>
            <Link href="/upload" className="btn btn-ghost">
              Analyze my file
            </Link>
          </div>
          {!sec && (
            <p className="mt-5 max-w-xl rounded-2xl border border-dashed border-gold/40 bg-gold-soft px-4 py-2.5 text-xs text-gold">
              The S&amp;P 500 dataset has not been built on this deployment yet, so the app is using the five fictional training companies. See the README to run the SEC
              refresh.
            </p>
          )}
        </div>
        <HomeDashboard bank={bank} />
      </section>

      <Ticker items={TAPE} />

      <FeatureCards />
    </div>
  );
}
