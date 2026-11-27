"use client";
import Link from "next/link";
import { spot } from "./fx";
import { IconCompanies, IconLearn, IconPlay, IconUpload } from "./icons";

const CARDS = [
  { href: "/learn", Icon: IconLearn, title: "Learn", body: "11 short lessons from the income statement to forecasting, each with a quiz and real-number drills.", tone: "var(--accent-soft)", ink: "text-accent" },
  { href: "/play", Icon: IconPlay, title: "Play", body: "Ratio Rush, Mystery Ledger, Red Flag Hunt and Higher or Lower. Earn XP, streaks and badges.", tone: "var(--hi-soft)", ink: "text-gold" },
  { href: "/companies", Icon: IconCompanies, title: "Explore", body: "Full five-year reports with common-size statements, peer percentiles and quality scores.", tone: "var(--blue-soft)", ink: "text-blue" },
  { href: "/upload", Icon: IconUpload, title: "Analyze a file", body: "Drop in a CSV or Excel statement. It is analyzed in your browser and never uploaded.", tone: "var(--bad-soft)", ink: "text-bad" },
];

export function FeatureCards() {
  return (
    <section className="rise grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="What you can do">
      {CARDS.map((c, i) => (
        <Link
          key={c.href}
          href={c.href}
          onPointerMove={spot}
          className="card card-hover spotlight group flex flex-col p-5"
          style={{ ["--i" as string]: i, ["--spot" as string]: c.tone }}
        >
          <span className={`grid h-12 w-12 place-items-center rounded-2xl ${c.ink}`} style={{ background: c.tone }}>
            <c.Icon className="bob-on-hover h-6 w-6" />
          </span>
          <span className="mt-4 font-display text-xl font-extrabold">{c.title}</span>
          <span className="mt-1 text-sm text-muted">{c.body}</span>
          <span className={`mt-4 text-sm font-extrabold ${c.ink}`}>
            Go <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
          </span>
        </Link>
      ))}
    </section>
  );
}
