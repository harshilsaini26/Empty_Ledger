"""Tiny SEC EDGAR client (standard library only).

SEC fair-access rules: identify yourself with a User-Agent that contains a
name and contact email, and stay under 10 requests/second.
https://www.sec.gov/os/accessing-edgar-data
"""
import gzip
import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path

TICKERS_URL = "https://www.sec.gov/files/company_tickers.json"
FACTS_URL = "https://data.sec.gov/api/xbrl/companyfacts/CIK{cik:010d}.json"
SUBMISSIONS_URL = "https://data.sec.gov/submissions/CIK{cik:010d}.json"
ANNUAL_FORMS = ("10-K", "10-K/A", "10-KT")
MIN_INTERVAL = 0.15  # seconds between requests (~6.6 req/s)


class SecClient:
    def __init__(self, user_agent, cache_dir, refresh=False, offline=False):
        # Secrets pasted into a settings page often carry a trailing newline or quotes, which
        # http.client rejects as an invalid header. Clean them up rather than fail.
        user_agent = " ".join((user_agent or "").replace('"', " ").replace("'", " ").split())
        if not offline and (not user_agent or "@" not in user_agent):
            raise SystemExit(
                "SEC requires a User-Agent with a name and email, e.g.\n"
                '  export SEC_USER_AGENT="Jane Doe jane@example.com"\n'
                "or pass --user-agent.")
        self.user_agent = user_agent
        self.cache = Path(cache_dir)
        self.cache.mkdir(parents=True, exist_ok=True)
        self.refresh = refresh
        self.offline = offline
        self._last = 0.0

    # ----------------------------------------------------------------- internals
    def _get(self, url, retries=4):
        for attempt in range(retries):
            wait = MIN_INTERVAL - (time.time() - self._last)
            if wait > 0:
                time.sleep(wait)
            req = urllib.request.Request(url, headers={
                "User-Agent": self.user_agent, "Accept-Encoding": "gzip"})
            try:
                with urllib.request.urlopen(req, timeout=60) as r:
                    self._last = time.time()
                    body = r.read()
                    if r.headers.get("Content-Encoding") == "gzip":
                        body = gzip.decompress(body)
                    return json.loads(body)
            except urllib.error.HTTPError as e:
                self._last = time.time()
                if e.code == 404:
                    return None
                if e.code in (429, 500, 502, 503) and attempt < retries - 1:
                    time.sleep(2 ** attempt * 2)
                    continue
                raise
            except urllib.error.URLError:
                if attempt < retries - 1:
                    time.sleep(2 ** attempt * 2)
                    continue
                raise

    def _cached(self, name, url, stale=False):
        path = self.cache / name
        if path.exists() and (not (self.refresh or stale) or self.offline):
            return json.loads(path.read_text())
        if self.offline:
            raise FileNotFoundError(f"{path} not cached and --offline is set")
        data = self._get(url)
        if data is not None:
            path.write_text(json.dumps(data))
        return data

    # -------------------------------------------------------------------- public
    def ticker_map(self):
        """{'AAPL': 320193, 'BRK-B': 1067983, ...}"""
        raw = self._cached("company_tickers.json", TICKERS_URL)
        return {v["ticker"].upper(): int(v["cik_str"]) for v in raw.values()}

    def submissions(self, cik):
        """Filing index for a company. Always fetched fresh unless offline: it is small and it is
        how we learn that a new 10-K exists."""
        return self._cached(f"sub-CIK{cik:010d}.json", SUBMISSIONS_URL.format(cik=cik), stale=True)

    def company_facts(self, cik, latest_accn=None):
        """XBRL facts. With latest_accn, the cached copy is reused only if it already
        contains that filing, so a weekly run downloads just the companies with a new 10-K."""
        name = f"CIK{cik:010d}.json"
        path = self.cache / name
        stale = bool(latest_accn) and path.exists() and latest_accn not in filed_accessions(json.loads(path.read_text()))
        return self._cached(name, FACTS_URL.format(cik=cik), stale=stale)


def latest_annual_accession(submissions):
    """Accession number of the most recent 10-K (or amendment) in a submissions file, or None."""
    recent = (submissions or {}).get("filings", {}).get("recent", {})
    best = None
    for form, accn, date in zip(recent.get("form", []), recent.get("accessionNumber", []), recent.get("filingDate", [])):
        if form in ANNUAL_FORMS and (best is None or date > best[1]):
            best = (accn, date)
    return best[0] if best else None


def filed_accessions(facts):
    """Every accession number that contributed a fact to a companyfacts file."""
    out = set()
    for taxonomy in (facts or {}).get("facts", {}).values():
        for concept in taxonomy.values():
            for rows in concept.get("units", {}).values():
                out.update(r.get("accn") for r in rows)
    return out


def public_float(facts):
    """Latest dei:EntityPublicFloat reported on a 10-K cover page: (USD value, as-of date) or (None, None).
    It is the market value of shares held by non-affiliates on the last day of the second fiscal quarter."""
    rows = (facts or {}).get("facts", {}).get("dei", {}).get("EntityPublicFloat", {}).get("units", {}).get("USD", [])
    rows = [r for r in rows if r.get("form") in ANNUAL_FORMS and r.get("val")]
    if not rows:
        return None, None
    r = max(rows, key=lambda r: (r["end"], r.get("filed", "")))
    return float(r["val"]), r["end"]


def default_user_agent():
    return os.environ.get("SEC_USER_AGENT", "")
