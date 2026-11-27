#!/usr/bin/env python3
"""Pick the 50 largest S&P 500 companies and write them to companies.csv.

Size comes from the SEC itself: dei:EntityPublicFloat on each company's latest 10-K cover page, the
market value of shares held by non-affiliates. It is not the same as market capitalization (it leaves
out insiders' shares and is measured at the end of the second fiscal quarter), but it is free, public
and updates with every 10-K, which is all a top-50 list for learning needs.

Candidates come from universe_candidates.csv: large S&P 500 members with their GICS sector and the
statement layout to use. Add a row there when a company grows into contention.

To stop companies near the cut-off from flipping in and out every week, a current member keeps its
place while it ranks within the top N + buffer.

Usage
    export SEC_USER_AGENT="Your Name your.email@example.com"
    python build_universe.py                  # rank, then rewrite companies.csv
    python build_universe.py --dry-run        # show the ranking only
    python build_universe.py --offline        # rank from the local cache

Output
    companies.csv          the top N, in rank order (read by build_dataset.py)
    data/universe.json     every candidate's rank, public float and as-of date, plus who joined and left
"""
import argparse
import csv
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from finlab.sec import SecClient, default_user_agent, latest_annual_accession, public_float  # noqa: E402

FIELDS = ["ticker", "name", "sector", "template"]


def read_rows(path):
    if not Path(path).exists():
        return []
    with open(path, newline="", encoding="utf-8") as f:
        return [r for r in csv.DictReader(f) if r.get("ticker", "").strip()]


def select(ranked, current, n, buffer):
    """ranked: candidate tickers, largest first. current: tickers in the list today.
    Members ranked within n + buffer stay. Free places go to the largest non-members."""
    pos = {t: i for i, t in enumerate(ranked)}
    keep = [t for t in ranked if t in current and pos[t] < n + buffer][:n]
    fill = [t for t in ranked if t not in keep][: n - len(keep)]
    return sorted(keep + fill, key=pos.get)


def rank_candidates(client, candidates, tickers):
    """Return ([(ticker, float, as_of, cik)], {ticker: reason}) for candidates, largest float first."""
    sized, skipped, seen = [], {}, set()
    for i, row in enumerate(candidates, 1):
        t = row["ticker"].upper()
        cik = tickers.get(t) or tickers.get(t.replace("-", "."))
        print(f"[{i:>3}/{len(candidates)}] {t:<6}", end=" ", flush=True)
        if not cik:
            skipped[t] = "ticker not in SEC ticker map"
            print("SKIP (not in SEC map)")
            continue
        if cik in seen:  # a second share class of a company already counted
            skipped[t] = "duplicate CIK"
            print("SKIP (duplicate CIK)")
            continue
        seen.add(cik)
        try:
            accn = None if client.offline else latest_annual_accession(client.submissions(cik))
            val, as_of = public_float(client.company_facts(cik, latest_accn=accn))
        except Exception as e:  # keep going; one bad download should not stop the ranking
            skipped[t] = f"{type(e).__name__}: {e}"
            print(f"FAIL {skipped[t]}")
            continue
        if val is None:
            skipped[t] = "no public float on a 10-K cover page"
            print("SKIP (no public float)")
            continue
        sized.append((t, val, as_of, cik))
        print(f"${val / 1e9:,.0f}B  (as of {as_of})")
    sized.sort(key=lambda x: -x[1])
    return sized, skipped


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--candidates", default=HERE / "universe_candidates.csv")
    ap.add_argument("--companies", default=HERE / "companies.csv")
    ap.add_argument("--out", default=HERE / "data")
    ap.add_argument("--cache", default=HERE / ".cache" / "sec")
    ap.add_argument("--size", type=int, default=50)
    ap.add_argument("--buffer", type=int, default=5)
    ap.add_argument("--user-agent", default=default_user_agent())
    ap.add_argument("--offline", action="store_true", help="use the cache only, no network")
    ap.add_argument("--dry-run", action="store_true", help="print the ranking, write nothing")
    a = ap.parse_args(argv)

    candidates = {r["ticker"].upper(): r for r in read_rows(a.candidates)}
    current = [r["ticker"].upper() for r in read_rows(a.companies)]
    client = SecClient(a.user_agent, a.cache, offline=a.offline)
    sized, skipped = rank_candidates(client, list(candidates.values()), client.ticker_map())
    if len(sized) < a.size:
        print(f"\nOnly {len(sized)} candidates could be sized; need {a.size}. companies.csv left unchanged.")
        return 1

    ranked = [t for t, *_ in sized]
    chosen = select(ranked, set(current), a.size, a.buffer)
    joined = sorted(set(chosen) - set(current))
    left = sorted(set(current) - set(chosen))
    print(f"\nTop {a.size}: {', '.join(chosen)}")
    print(f"Joined: {', '.join(joined) or 'none'}   Left: {', '.join(left) or 'none'}")
    if a.dry_run:
        return 0

    with open(a.companies, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS, extrasaction="ignore", lineterminator="\n")
        w.writeheader()
        w.writerows(candidates[t] for t in chosen)

    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    pos = {t: i + 1 for i, t in enumerate(ranked)}
    (out / "universe.json").write_text(json.dumps({
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "method": "Largest public float (dei:EntityPublicFloat, latest 10-K) among universe_candidates.csv",
        "size": a.size, "buffer": a.buffer, "joined": joined, "left": left,
        "ranking": [{"rank": pos[t], "ticker": t, "cik": cik, "public_float_usd": v, "as_of": d, "in_list": t in chosen}
                    for t, v, d, cik in sized],
        "skipped": skipped,
    }, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
