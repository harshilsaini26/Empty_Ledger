# Ledger Legends

*(working name, set in `lib/brand.ts`)*

A gamified web app for learning financial statement analysis, built around the CFA Level I
Financial Statement Analysis topics. It covers the last five fiscal years of income statements,
balance sheets and cash flows for the 50 largest S&P 500 companies, and it analyzes any statement
you upload.

## What's inside

| Area | What it does |
|---|---|
| **Learn** (`/learn`) | 11 lessons, from the income statement to forecasting. Each has a short read, a concept quiz and drills that use real company numbers. Score 60% to unlock the next one. |
| **Play** (`/play`) | Ratio Rush (90-second ratio sprint), Mystery Ledger (name the company from its common-size statements), Red Flag Hunt (forensic accounting) and Higher or Lower (ratio intuition). |
| **Companies** (`/companies`) | Full reports: statements (as reported, common-size, trend), 70+ ratios with peer percentiles, DuPont, Altman Z'', Beneish M, Piotroski F, red flags, a durable-business checklist and simple projections. |
| **Analyze a file** (`/upload`) | Upload CSV or Excel. Rows are matched to line items by label ("Net sales", "Total current assets"...), you can fix the mapping, and the full report runs in the browser. Nothing is uploaded to a server. |
| **Research** (`/research`) | Three seminal Financial Analysts Journal papers (Enhanced Portfolio Optimization, Buffett's Alpha, the goal completion score for retirement income) with plain-English summaries, key learnings, the math rendered with KaTeX, an interactive lab for each model and a short quiz. |
| **Progress** | XP, a nine-step career ladder, daily question, streaks and 14 badges. Stored in the browser's localStorage, so no accounts or database are needed. |

## How it fits together

```
pipeline/            Python (standard library only)
  build_dataset.py   SEC EDGAR -> pipeline/data/companies/*.json, peers.json, index.json
  build_practice.py  fictional training companies -> pipeline/data/practice/, public/samples/
  finlab/            extraction, ratios, models, peers (the source of truth for formulas)
app/, components/    Next.js (App Router), every page pre-rendered at build time
lib/engine/          TypeScript port of finlab for uploads; tests/parity.test.ts keeps it identical
lib/game/            XP, badges, question generators
lib/learn/           lesson content
lib/research/        paper content and the models behind the research labs
```

The site is fully static: pages are generated from `pipeline/data` at build time, which keeps it
inside Vercel's Hobby plan (no database, no server compute).

## Getting the S&P 500 data

The SEC data is fetched by GitHub Actions, not at deploy time:

1. In the repo, go to **Settings → Secrets and variables → Actions** and add a secret named
   `SEC_USER_AGENT` with a name and contact email, for example `Jane Doe jane@example.com`.
   The SEC asks every automated client to identify itself this way.
2. Run the **Refresh SEC data** workflow (Actions tab → Refresh SEC data → Run workflow). It downloads
   the last five 10-Ks for the companies in `pipeline/companies.csv`, runs the tests, and commits
   `pipeline/data/`. It also runs every Monday, so new 10-Ks appear automatically.
3. Vercel redeploys on the commit.

Until the data exists, the app runs on the five training companies, and every lesson and game works.

To build locally instead: `cd pipeline && SEC_USER_AGENT="Name email" python build_dataset.py`.

## Develop

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # TypeScript engine parity + parser tests
npm run build
cd pipeline && python -m unittest discover -s tests
```

## Deploy on Vercel

1. Go to vercel.com/new and choose **Import Git Repository**, then pick `harshilsaini26/Empty_Ledger` (connect your GitHub account to Vercel if asked, and allow access to this repo).
2. Keep the defaults: `vercel.json` already sets the framework (Next.js), install and build commands. No environment variables are needed.
3. Click **Deploy**. Every push to `main` becomes a production deploy, and every other branch or PR gets a preview URL.
4. When the "Refresh SEC data" workflow commits new data, Vercel redeploys automatically.

## Data and disclaimers

SEC EDGAR XBRL company facts are public-domain US government data. Training companies are fictional.
Scores and projections are teaching tools, not investment advice. CFA® and Chartered Financial
Analyst® are trademarks of CFA Institute, which does not endorse this project.
