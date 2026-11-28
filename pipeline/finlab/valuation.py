"""Step-by-step walkthroughs adapted from Anthropic's finance skills
(dcf-model, 3-statement-model, variance-analysis), using 10-K data only.

Every function returns its result together with `steps`: the formula, the
inputs that went into it and the value, so the web app can show the working.
The DCF is mirrored in lib/engine/dcf.ts (the page recalculates it live when
the learner moves a slider); tests/parity.test.ts keeps the two identical.

Teaching tools, not investment advice. There is no market data here: beta,
the risk-free rate and the equity risk premium are textbook defaults.
"""
from .ratios import Ctx, div

RF, ERP, BETA, G_TERM, YEARS_OUT = 0.0425, 0.05, 1.0, 0.025, 5


def _clamp(v, lo, hi):
    return max(lo, min(hi, v))


def _avg(vals):
    vals = [v for v in vals if v is not None]
    return sum(vals) / len(vals) if vals else None


def _step(sid, label, formula, inputs, value, unit):
    return {"id": sid, "label": label, "formula": formula, "inputs": inputs, "value": value, "unit": unit}


# ------------------------------------------------------------------------ DCF
def _tax(c):
    t = div(c.get("income_tax"), c.get("pretax_income"))
    return 0.21 if t is None else _clamp(t, 0.0, 0.35)


def _fcff(c):
    """CFA: FCFF = CFO + interest x (1 - t) - capex."""
    if c.get("cfo") is None or c.get("capex") is None:
        return None
    return c.get("cfo") + (c.get("interest_expense") or 0) * (1 - _tax(c)) - c.get("capex")


def dcf_defaults(data, analysis_years):
    """Starting assumptions read from the statements, with the steps that produced them."""
    years = [y for y in analysis_years if Ctx(data, y).get("revenue")]
    if len(years) < 2:
        return None
    y0, y1 = years[0], years[-1]
    c = Ctx(data, y1)
    history = {}
    for y in years:
        f = _fcff(Ctx(data, y))
        if f is not None:
            history[str(y)] = {"revenue": Ctx(data, y).get("revenue"), "fcff": f,
                               "margin": f / Ctx(data, y).get("revenue")}
    margin = _avg([history[str(y)]["margin"] for y in years[-3:] if str(y) in history])
    if margin is None:
        return None
    rev0, revf = Ctx(data, y0).get("revenue"), c.get("revenue")
    g = (revf / rev0) ** (1 / (y1 - y0)) - 1 if rev0 > 0 and revf > 0 else 0.0
    debt = c.get("total_debt") or 0
    avg_debt = _avg([debt, Ctx(data, c.prev).get("total_debt") if c.prev is not None else None])
    kd = div(c.get("interest_expense"), avg_debt)
    eq = max(c.get("equity") or 0, 0)
    wd = div(debt, debt + eq)
    net_debt = c.get("net_debt")
    shares = c.get("shares_diluted") or c.get("shares_outstanding")
    implied = div(c.get("net_income"), c.get("eps_diluted"))  # some filers tag shares in millions
    if implied and implied > 0 and (not shares or not 0.5 < shares / implied < 2):
        shares = implied
    a = {
        "base_year": y1, "revenue": revf, "fcff_margin": margin,
        "revenue_growth": _clamp(g, -0.05, 0.15), "rf": RF, "erp": ERP, "beta": BETA,
        "kd": 0.05 if kd is None else _clamp(kd, 0.02, 0.12), "tax": _tax(c),
        "wd": 0.0 if wd is None else _clamp(wd, 0.0, 0.6), "terminal_growth": G_TERM,
        "net_debt": 0 if net_debt is None else net_debt,
        "shares": shares,
    }
    steps = [
        _step("fcff", f"Free cash flow to the firm, FY{y1}", "FCFF = CFO + interest × (1 − t) − capex",
              {"CFO": c.get("cfo"), "interest": c.get("interest_expense") or 0, "t": a["tax"],
               "capex": c.get("capex")}, _fcff(c), "usd"),
        _step("fcff_margin", "FCFF margin (average of the last 3 years)", "m = avg(FCFF ÷ revenue)",
              {f"FY{y}": history[str(y)]["margin"] for y in years[-3:] if str(y) in history}, margin, "pct"),
        _step("revenue_growth", f"Revenue growth (CAGR FY{y0} to FY{y1}, capped at −5% to 15%)",
              "g = (Rev_end ÷ Rev_start)^(1/n) − 1", {"Rev_start": rev0, "Rev_end": revf, "n": y1 - y0},
              a["revenue_growth"], "pct"),
        _step("kd", "Pre-tax cost of debt (capped at 2% to 12%, 5% if unknown)",
              "k_d = interest ÷ average debt", {"interest": c.get("interest_expense"), "average debt": avg_debt},
              a["kd"], "pct"),
        _step("wd", "Debt weight (book values, capped at 60%)", "w_d = D ÷ (D + E)",
              {"D": debt, "E": eq}, a["wd"], "pct"),
    ]
    return a, history, steps


def dcf_value(a, years_out=YEARS_OUT):
    """Value the firm from a set of assumptions. Pure: the TypeScript port must match it."""
    ke = a["rf"] + a["beta"] * a["erp"]
    kd_at = a["kd"] * (1 - a["tax"])
    wacc = a["wd"] * kd_at + (1 - a["wd"]) * ke
    rows, pv_sum = [], 0.0
    for i in range(1, years_out + 1):
        rev = a["revenue"] * (1 + a["revenue_growth"]) ** i
        fcff = rev * a["fcff_margin"]
        df = (1 + wacc) ** -i
        pv_sum += fcff * df
        rows.append({"year": a["base_year"] + i, "revenue": rev, "fcff": fcff, "discount_factor": df, "pv": fcff * df})
    last = rows[-1]
    ok = wacc > a["terminal_growth"]
    tv = last["fcff"] * (1 + a["terminal_growth"]) / (wacc - a["terminal_growth"]) if ok else None
    pv_tv = tv * last["discount_factor"] if ok else None
    ev = pv_sum + pv_tv if ok else None
    eq = ev - a["net_debt"] if ok else None
    ps = div(eq, a["shares"])
    steps = [
        _step("ke", "Cost of equity (CAPM)", "k_e = r_f + β × ERP", {"r_f": a["rf"], "β": a["beta"], "ERP": a["erp"]},
              ke, "pct"),
        _step("kd_at", "After-tax cost of debt", "k_d × (1 − t)", {"k_d": a["kd"], "t": a["tax"]}, kd_at, "pct"),
        _step("wacc", "Weighted average cost of capital", "WACC = w_d × k_d(1 − t) + (1 − w_d) × k_e",
              {"w_d": a["wd"], "k_d(1 − t)": kd_at, "k_e": ke}, wacc, "pct"),
        _step("pv_fcff", f"Present value of FCFF, FY{rows[0]['year']} to FY{last['year']}",
              "Σ FCFF_t ÷ (1 + WACC)^t", {f"FY{r['year']}": r["pv"] for r in rows}, pv_sum, "usd"),
        _step("tv", f"Terminal value at FY{last['year']} (Gordon growth)", "TV = FCFF_n × (1 + g) ÷ (WACC − g)",
              {"FCFF_n": last["fcff"], "g": a["terminal_growth"], "WACC": wacc}, tv, "usd"),
        _step("pv_tv", "Present value of the terminal value", "TV ÷ (1 + WACC)^n",
              {"TV": tv, "discount factor": last["discount_factor"]}, pv_tv, "usd"),
        _step("ev", "Enterprise value", "EV = PV(FCFF) + PV(TV)", {"PV(FCFF)": pv_sum, "PV(TV)": pv_tv}, ev, "usd"),
        _step("equity", "Equity value", "Equity = EV − net debt", {"EV": ev, "net debt": a["net_debt"]}, eq, "usd"),
        _step("per_share", "Intrinsic value per share", "Equity ÷ diluted shares",
              {"Equity": eq, "shares": a["shares"]}, ps, "usd_share"),
    ]
    return {"wacc": wacc, "rows": rows, "enterprise_value": ev, "equity_value": eq, "value_per_share": ps,
            "terminal_share": div(pv_tv, ev), "valid": ok, "steps": steps}


def dcf(data, analysis_years):
    d = dcf_defaults(data, analysis_years)
    if d is None:
        return None
    a, history, steps = d
    return {"assumptions": a, "history": history, "steps": steps, "valuation": dcf_value(a)}


# --------------------------------------------------------- 3-statement model
LINES = [  # key, label, statement
    ("revenue", "Revenue", "income"), ("ebit", "EBIT", "income"), ("interest", "Interest expense", "income"),
    ("pretax", "Pre-tax income", "income"), ("tax", "Income tax", "income"), ("net_income", "Net income", "income"),
    ("cash", "Cash & short-term investments", "balance"), ("receivables", "Receivables", "balance"),
    ("inventory", "Inventory", "balance"), ("ppe", "PP&E (net)", "balance"),
    ("other_assets", "Other assets (held flat)", "balance"), ("total_assets", "Total assets", "balance"),
    ("accounts_payable", "Accounts payable", "balance"), ("debt", "Debt (held flat)", "balance"),
    ("other_liabilities", "Other liabilities (held flat)", "balance"),
    ("total_liabilities", "Total liabilities", "balance"), ("equity", "Equity", "balance"),
    ("check", "Check: assets − liabilities − equity", "balance"),
    ("da", "D&A", "cashflow"), ("change_nwc", "Increase in working capital", "cashflow"),
    ("cfo", "Cash from operations", "cashflow"), ("capex", "Capex", "cashflow"),
    ("dividends", "Dividends", "cashflow"), ("change_cash", "Change in cash", "cashflow"),
]


def projection(data, analysis_years, years_out=3):
    """Driver-based 3-statement projection. Cash is the plug, so the balance sheet balances by construction."""
    hist = analysis_years[-3:]
    base = analysis_years[-1]
    c = Ctx(data, base)
    if None in (c.get("revenue"), c.get("ebit"), c.get("total_assets"), c.get("total_liabilities")):
        return None

    def ratio(num, den="revenue"):
        return {str(y): div(Ctx(data, y).get(num), Ctx(data, y).get(den)) for y in hist}

    def zero(k):
        return c.get(k) or 0

    growth = {str(y): div(Ctx(data, y).get("revenue"), Ctx(data, y).p("revenue")) for y in hist}
    growth = {y: v - 1 for y, v in growth.items() if v is not None}
    tax_hist = {y: v for y, v in ratio("income_tax", "pretax_income").items() if v is not None}
    payout_hist = ratio("dividends_paid", "net_income")
    spec = [  # id, label, formula, history, value
        ("growth", "Revenue growth", "avg(Rev_t ÷ Rev_t−1 − 1), capped −10% to 20%", growth,
         _clamp(_avg(growth.values()) or 0, -0.10, 0.20)),
        ("ebit_margin", "EBIT margin", "avg(EBIT ÷ revenue)", ratio("ebit"), _avg(ratio("ebit").values())),
        ("tax_rate", "Tax rate", "avg(tax ÷ pre-tax income), capped 0% to 40%", tax_hist,
         0.21 if not tax_hist else _clamp(_avg(tax_hist.values()), 0, 0.40)),
        ("da_pct", "D&A % of revenue", "avg(D&A ÷ revenue)", ratio("d_and_a"), _avg(ratio("d_and_a").values()) or 0),
        ("capex_pct", "Capex % of revenue", "avg(capex ÷ revenue)", ratio("capex"), _avg(ratio("capex").values()) or 0),
        ("rec_pct", "Receivables % of revenue", "avg(receivables ÷ revenue)", ratio("receivables"),
         _avg(ratio("receivables").values()) or 0),
        ("inv_pct", "Inventory % of revenue", "avg(inventory ÷ revenue)", ratio("inventory"),
         _avg(ratio("inventory").values()) or 0),
        ("ap_pct", "Payables % of revenue", "avg(payables ÷ revenue)", ratio("accounts_payable"),
         _avg(ratio("accounts_payable").values()) or 0),
        ("payout", "Dividend payout", "avg(dividends ÷ net income), capped 0% to 100%", payout_hist,
         _clamp(_avg(payout_hist.values()) or 0, 0, 1)),
    ]
    d = {s[0]: s[4] for s in spec}
    drivers = [{"id": i, "label": lab, "formula": f, "history": h, "value": v} for i, lab, f, h, v in spec]

    cash = zero("cash") + zero("short_term_investments")
    prev = {"revenue": c.get("revenue"), "receivables": zero("receivables"), "inventory": zero("inventory"),
            "accounts_payable": zero("accounts_payable"), "ppe": zero("ppe"), "cash": cash,
            "equity": c.get("total_assets") - c.get("total_liabilities"), "debt": zero("total_debt")}
    other_a = c.get("total_assets") - cash - prev["receivables"] - prev["inventory"] - prev["ppe"]
    other_l = c.get("total_liabilities") - prev["debt"] - prev["accounts_payable"]
    interest = zero("interest_expense")
    rows = {k: {} for k, _, _ in LINES}
    years = list(range(base + 1, base + years_out + 1))
    for y in years:
        r = {"revenue": prev["revenue"] * (1 + d["growth"])}
        r["ebit"] = r["revenue"] * d["ebit_margin"]
        r["interest"] = interest
        r["pretax"] = r["ebit"] - interest
        r["tax"] = max(r["pretax"], 0) * d["tax_rate"]
        r["net_income"] = r["pretax"] - r["tax"]
        r["dividends"] = max(r["net_income"], 0) * d["payout"]
        r["da"] = r["revenue"] * d["da_pct"]
        r["capex"] = r["revenue"] * d["capex_pct"]
        for k, p in (("receivables", "rec_pct"), ("inventory", "inv_pct"), ("accounts_payable", "ap_pct")):
            r[k] = r["revenue"] * d[p]
        r["change_nwc"] = (r["receivables"] + r["inventory"] - r["accounts_payable"]) - (
            prev["receivables"] + prev["inventory"] - prev["accounts_payable"])
        r["cfo"] = r["net_income"] + r["da"] - r["change_nwc"]
        r["change_cash"] = r["cfo"] - r["capex"] - r["dividends"]
        r["cash"] = prev["cash"] + r["change_cash"]
        r["ppe"] = prev["ppe"] + r["capex"] - r["da"]
        r["other_assets"], r["other_liabilities"], r["debt"] = other_a, other_l, prev["debt"]
        r["total_assets"] = r["cash"] + r["receivables"] + r["inventory"] + r["ppe"] + other_a
        r["total_liabilities"] = r["debt"] + r["accounts_payable"] + other_l
        r["equity"] = prev["equity"] + r["net_income"] - r["dividends"]
        r["check"] = r["total_assets"] - r["total_liabilities"] - r["equity"]
        for k in rows:
            rows[k][str(y)] = r[k]
        prev = r
    return {"base_year": base, "years": years, "drivers": drivers, "lines": LINES, "rows": rows,
            "notes": "Debt, interest and other balances are held flat; cash is the plug; no buybacks or new equity."}


# ------------------------------------------------------- variance / flux
SKIP = {"effective_tax_rate", "eps_diluted", "shares_diluted", "shares_outstanding"}


def variance(data, analysis_years, labels=None):
    """Year-over-year flux table, a net-income bridge and volume/rate splits of the margin lines."""
    if len(analysis_years) < 2:
        return None
    y0, y1 = analysis_years[-2], analysis_years[-1]
    c1, c0 = Ctx(data, y1), Ctx(data, y0)
    labels = labels or {}
    flux = []
    for sect, series in data["statements"].items():
        base = c0.get("total_assets" if sect == "balance" else "revenue")
        for k in series:
            a, b = c0.get(k), c1.get(k)
            if k in SKIP or a is None or b is None or (k == "ebit" and "operating_income" in series):
                continue
            delta = b - a
            pct = div(delta, abs(a))
            flag = pct is not None and abs(pct) >= 0.10 and base is not None and abs(delta) >= 0.02 * abs(base)
            flux.append({"item": k, "label": labels.get(k, k), "statement": sect, "prior": a, "current": b,
                         "delta": delta, "pct": pct, "flag": flag})
    flux.sort(key=lambda r: (not r["flag"], -abs(r["delta"])))

    def d(k):
        a, b = c0.get(k), c1.get(k)
        return None if a is None or b is None else b - a

    bridge = None
    if d("net_income") is not None and d("revenue") is not None and d("ebit") is not None:
        parts = [("revenue", "Revenue", d("revenue"))]
        for k, lab in (("cost_of_revenue", "Cost of revenue"), ("sga", "SG&A"), ("rnd", "R&D")):
            if d(k) is not None:
                parts.append((k, lab, -d(k)))
        parts.append(("other_opex", "Other operating items", d("ebit") - sum(p[2] for p in parts)))
        nonop = d("pretax_income") - d("ebit") if d("pretax_income") is not None else None
        if nonop is not None and d("income_tax") is not None:
            parts += [("non_operating", "Interest & other non-operating", nonop),
                      ("tax", "Income tax", -d("income_tax")),
                      ("other", "Other (minority interest, discontinued ops)",
                       d("net_income") - d("pretax_income") + d("income_tax"))]
        else:
            parts.append(("below_ebit", "Everything below EBIT", d("net_income") - d("ebit")))
        bridge = {"start": c0.get("net_income"), "end": c1.get("net_income"),
                  "steps": [{"id": i, "label": lab, "value": v} for i, lab, v in parts]}

    splits = []
    for k, lab in (("gross_profit", "Gross profit"), ("ebit", "EBIT")):
        r0, r1, p0, p1 = c0.get("revenue"), c1.get("revenue"), c0.get(k), c1.get(k)
        if None in (r0, r1, p0, p1) or not r0 or not r1:
            continue
        m0, m1 = p0 / r0, p1 / r1
        splits.append({"item": k, "label": lab, "delta": p1 - p0, "steps": [
            _step("volume", "Volume effect (more or less revenue at last year's margin)", "ΔRevenue × margin_prior",
                  {"ΔRevenue": r1 - r0, "margin_prior": m0}, (r1 - r0) * m0, "usd"),
            _step("rate", "Rate effect (margin change on this year's revenue)", "Revenue_current × Δmargin",
                  {"Revenue_current": r1, "Δmargin": m1 - m0}, r1 * (m1 - m0), "usd"),
        ]})
    return {"prior_year": y0, "year": y1, "threshold": "±10% and at least 2% of revenue (flows) or assets (balances)",
            "flux": flux, "bridge": bridge, "splits": splits}


def run_walkthroughs(data, template, analysis_years, labels=None):
    if template != "standard":  # FCFF valuation and this layout do not fit banks and insurers
        return {"variance": variance(data, analysis_years, labels)}
    return {"dcf": dcf(data, analysis_years), "projection": projection(data, analysis_years),
            "variance": variance(data, analysis_years, labels)}
