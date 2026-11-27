// Three research papers from the Financial Analysts Journal, summarized in our own words.
// Formulas are restated in standard notation; see each paper (DOI below) for the full derivations.

export interface Formula {
  name: string;
  tex: string;
  says: string; // plain-English reading
  where?: string; // symbol legend
}
export interface PaperQ {
  q: string;
  choices: string[];
  answer: number;
  explain: string;
}
export interface Paper {
  id: string;
  short: string;
  title: string;
  authors: string;
  journal: string;
  doi?: string;
  cite: string;
  topic: string;
  tone: { bg: string; ink: string };
  oneLiner: string;
  summary: string[];
  numbers: { value: string; label: string }[];
  learnings: { title: string; body: string }[];
  formulas: Formula[];
  forAnalysts: string[]; // how it links to the financial statement analysis in the rest of the app
  sources?: { label: string; href: string }[]; // links to the original material
  quiz: PaperQ[];
}

export const PAPERS: Paper[] = [
  {
    id: "enhanced-portfolio-optimization",
    short: "Enhanced Portfolio Optimization",
    title: "Enhanced Portfolio Optimization",
    authors: "Lasse Heje Pedersen, Abhilash Babu and Ari Levine",
    journal: "Financial Analysts Journal 77(2), 2021",
    doi: "10.1080/0015198X.2020.1854543",
    cite: "Financial Analysts Journal, vol. 77, no. 2 (2021), pp. 124–151",
    topic: "Portfolio construction",
    tone: { bg: "var(--blue-soft)", ink: "text-blue" },
    oneLiner: "Textbook mean-variance optimization breaks because of a few noisy \"problem portfolios\". Shrinking correlations fixes them, and one dial gets you most of the way.",
    summary: [
      "Mean-variance optimization (MVO) should be the best way to combine risk and return, yet in practice it often loses to simply splitting money equally (1/N). The authors find out why. They rotate the problem into principal components: uncorrelated long-short portfolios ranked by how much they vary.",
      "The least important components are the trouble. Their risk is underestimated and their expected returns are overestimated, so their estimated Sharpe ratios look great. MVO then piles leverage into what is mostly noise.",
      "The fix, enhanced portfolio optimization (EPO), shrinks every correlation toward zero by a single parameter w before optimizing. Raising the estimated risk of the problem portfolios is mathematically the same as shrinking correlations. The same solution also falls out of a Bayesian (Black–Litterman style) model, robust optimization, and ridge regression, which ties several branches of the literature together.",
      "Applied to time-series momentum across global futures and to industry momentum in US equities, EPO beat 1/N, standard MVO and the standard momentum factors out of sample, with realistic leverage and turnover.",
    ],
    numbers: [
      { value: "≈75%", label: "correlation shrinkage that worked best, far more than the 5–10% needed to fix the risk model alone" },
      { value: "1.24", label: "out-of-sample Sharpe ratio of EPO time-series momentum, 1985–2018 (vs 1.09 for the standard factor)" },
      { value: "0.87", label: "Sharpe ratio of naive MVO (w = 0) on the same assets" },
      { value: "991% → 457%", label: "gross leverage of naive MVO vs out-of-sample EPO, both scaled to 10% volatility" },
    ],
    learnings: [
      { title: "Noise hides in the smallest components", body: "Low-variance principal components look like free lunches because both their risk and their return are mis-estimated. MVO bets on them with heavy leverage." },
      { title: "Shrink correlations, not just volatilities", body: "Moving the correlation matrix toward the identity raises the estimated risk of the problem portfolios and lowers their Sharpe ratios, which fixes errors in both risk and expected return." },
      { title: "One dial, chosen out of sample", body: "w = 0 is standard MVO and w = 1 ignores correlations. Pick w by what would have given the best Sharpe ratio in past data, then use it for the next period." },
      { title: "Many methods, one idea", body: "Black–Litterman, robust optimization with an ellipsoid uncertainty set, and ridge regression all reduce to the same EPO formula." },
      { title: "Anchor it if you are benchmarked", body: "The anchored version blends the optimized portfolio with a benchmark or 1/N portfolio, so you control how far you drift." },
    ],
    formulas: [
      { name: "Mean-variance optimal portfolio", tex: String.raw`x^{MVO} = \frac{1}{\gamma}\,\Sigma^{-1} s`, says: "Hold each asset in proportion to its expected excess return, adjusted for how it co-moves with everything else.", where: String.raw`s = \text{signal (expected excess returns)},\ \Sigma = \text{covariance matrix},\ \gamma = \text{risk aversion}` },
      { name: "Covariance split into volatility and correlation", tex: String.raw`\Sigma = \sigma\,\Omega\,\sigma, \qquad \sigma = \operatorname{diag}\!\left(\sqrt{\Sigma_{11}}, \dots, \sqrt{\Sigma_{nn}}\right)`, says: "Separate how volatile each asset is from how assets move together." },
      { name: "Principal components of the correlation matrix", tex: String.raw`\Omega = P D P^{-1}, \qquad z_i^{MVO} = \frac{1}{\gamma}\,\frac{s_i^P}{\sqrt{D_i}}\cdot\frac{1}{\sqrt{D_i}}`, says: "In component space, the bet on component i is its Sharpe ratio times the leverage needed to reach unit risk. Tiny D_i means a big estimated Sharpe and huge leverage: the problem portfolios." },
      { name: "Shrinking the components' risk = shrinking correlations", tex: String.raw`\tilde D = (1-\theta)D + \theta I \;\Longleftrightarrow\; \tilde\Omega = (1-\theta)\,\Omega + \theta I`, says: "Pull every component variance toward the average of 1. That is exactly the same as multiplying every correlation by (1 − θ)." },
      { name: "Simple EPO", tex: String.raw`\text{EPO}^{s}(w) = \frac{1}{\gamma}\,\Sigma_w^{-1}\, s, \qquad \Sigma_w = \sigma\big[(1-w)\,\Omega + w\, I\big]\sigma`, says: "Standard MVO run on a covariance matrix whose correlations have been shrunk by w. That is the whole method." },
      { name: "General EPO (Bayesian and robust form)", tex: String.raw`\text{EPO} = \frac{1}{\gamma}\big(\tau\tilde\Sigma + \Lambda\big)^{-1}\big(\tau s + \gamma\Lambda a\big)`, says: "Blend your signal s with an anchor portfolio a, weighting each by how noisy the signal is (Λ) versus how much true returns vary (τ).", where: String.raw`a = \text{anchor portfolio},\ \Lambda = \text{signal noise},\ \tau = \text{variation in true returns}` },
      { name: "Anchored EPO", tex: String.raw`\text{EPO}^{a}(w) = \Sigma_w^{-1}\left[(1-w)\,\frac{\sqrt{a'\tilde\Sigma a}}{\sqrt{s'\Sigma_w^{-1}\tilde\Sigma\Sigma_w^{-1}s}}\, s + w\,V a\right]`, says: "Risk aversion is set so the optimized part and the anchor have the same risk, then w slides between them.", where: String.raw`V = \sigma^2 \text{ (diagonal matrix of variances)}` },
    ],
    forAnalysts: [
      "The same caution applies to every ratio screen in this app: a model fitted to noisy estimates will happily overweight the noise.",
      "Shrinkage is the portfolio version of a habit you already use in statement analysis: blend a company's own number with its peer median when the history is short or volatile.",
    ],
    quiz: [
      { q: "In the paper, which portfolios cause standard mean-variance optimization to fail?", choices: ["The most volatile principal components", "The least important (lowest-variance) principal components", "The equal-weighted 1/N portfolio", "Portfolios with negative expected returns"], answer: 1, explain: "Low-variance components have underestimated risk and overestimated returns, so their estimated Sharpe ratios are too high and MVO levers into them." },
      { q: "What does the simple EPO do before running MVO?", choices: ["Drops the riskiest assets", "Shrinks all correlations toward zero by a factor w", "Sets all expected returns equal", "Caps each weight at 10%"], answer: 1, explain: "Simple EPO replaces each off-diagonal correlation ρ with (1 − w)ρ and then runs standard MVO." },
      { q: "With the EPO shrinkage parameter w = 0, the solution equals…", choices: ["The anchor portfolio", "1/N", "Standard MVO", "The minimum-variance portfolio"], answer: 2, explain: "No shrinkage means the original covariance matrix, so you get textbook mean-variance optimization." },
      { q: "Why did the best shrinkage (around 75%) far exceed the 5–10% needed to clean the risk model?", choices: ["Transaction costs", "Errors in expected returns also make correlation shrinkage useful", "Correlations are always zero in the long run", "Regulators require it"], answer: 1, explain: "The authors show that noise in the return signal, not just in risk, is fixed by shrinking correlations, so much more shrinkage pays off." },
      { q: "Which of these is NOT shown to be equivalent to EPO in the paper?", choices: ["Black–Litterman Bayesian updating", "Robust optimization with an ellipsoid uncertainty set", "Ridge regression", "The Gordon growth model"], answer: 3, explain: "Proposition 3 links EPO to MVO, reverse MVO, the Bayesian / Black–Litterman estimator, robust optimization and ridge regression. The Gordon growth model is a valuation formula." },
    ],
  },
  {
    id: "buffetts-alpha",
    short: "Buffett's Alpha",
    title: "Buffett's Alpha",
    authors: "Andrea Frazzini, David Kabiller and Lasse Heje Pedersen",
    journal: "Financial Analysts Journal 74(4), 2018",
    cite: "Financial Analysts Journal, vol. 74, no. 4 (2018), from p. 35",
    topic: "Performance attribution",
    tone: { bg: "var(--hi-soft)", ink: "text-gold" },
    oneLiner: "Berkshire Hathaway's record is not luck or magic. It is cheap, safe, high-quality stocks, held with about 1.7-to-1 leverage that was unusually cheap to borrow.",
    summary: [
      "From 1976 to 2017, Berkshire Hathaway's stock earned 18.6% a year above T-bills at 23.5% volatility, a Sharpe ratio of 0.79 against 0.49 for the market. Among US stocks and mutual funds with 40-year histories, nothing beat it.",
      "Size, value and momentum factors could not explain that alpha. The authors added two newer factors: betting against beta (BAB, owning low-beta stocks) and quality minus junk (QMJ, owning profitable, growing, safe, high-payout firms). Buffett loads heavily on both, and once they are included his alpha is no longer statistically significant.",
      "The other half of the story is leverage. Measured from Berkshire's balance sheet, it averaged about 1.7 to 1, and much of it came from insurance float that cost about 1.7% a year, roughly 3 percentage points below the T-bill rate. Deferred taxes and sold derivatives added more cheap financing.",
      "Splitting Berkshire into its public stocks (from 13F filings) and its privately owned businesses shows the public portfolio had the higher Sharpe ratio, suggesting stock selection mattered more than managing the businesses. A rules-based \"systematic Buffett\" portfolio of similar factor tilts, levered to the same risk, performed comparably.",
    ],
    numbers: [
      { value: "0.79", label: "Berkshire's Sharpe ratio, 1976–2017 (market: 0.49)" },
      { value: "1.7×", label: "average leverage, (total assets − cash) / equity" },
      { value: "1.72%", label: "average annual cost of insurance float, about 3 points below T-bills" },
      { value: "13.4% → 5.4%", label: "Berkshire's annual alpha before and after adding BAB and QMJ (t-stat 4.0 → 1.6)" },
    ],
    learnings: [
      { title: "Quality and safety at a fair price", body: "Buffett's stocks are cheap (positive value loading), safe (low beta) and high quality (profitable, stable, high payout). These traits explain most of his edge." },
      { title: "Leverage turned a good Sharpe into great returns", body: "A 0.79 Sharpe ratio alone does not produce 18.6% a year. Applying about 1.7× leverage to a safe portfolio did." },
      { title: "Cheap, stable funding is a moat", body: "Insurance float, a AAA rating and deferred taxes gave Berkshire long-term borrowing below the government's rate, and it never had to sell in a crisis." },
      { title: "Stick with it through drawdowns", body: "From mid-1998 to early 2000 Berkshire fell 44% while the market rose 32%. Its structure as a corporation let it stay the course when a fund might have faced redemptions." },
      { title: "Skill is the strategy, not luck", body: "Because the returns line up with persistent factors, they look like a repeatable approach rather than a lucky coin-flip streak." },
    ],
    formulas: [
      { name: "Leverage from the balance sheet", tex: String.raw`L_t = \frac{TA_t^{MV} - \text{Cash}_t^{MV}}{\text{Equity}_t^{MV}}`, says: "How many dollars of risky assets sit on each dollar of shareholders' equity, at market value.", where: String.raw`TA^{MV} = TA^{BV} + \text{Equity}^{MV} - \text{Equity}^{BV}` },
      { name: "Market value of the private businesses (a residual)", tex: String.raw`\text{Private}_t^{MV} = TA_t^{MV} - \text{Public}_t^{MV} - \text{Cash}_t^{MV}`, says: "Whatever Berkshire is worth beyond its listed stocks and cash must be the value of the companies it owns outright." },
      { name: "Decomposing Berkshire's excess return", tex: String.raw`r^{Equity}_{t+1} - r^f_{t+1} = \Big[w_t\big(r^{Private}_{t+1} - r^f_{t+1}\big) + (1 - w_t)\big(r^{Public}_{t+1} - r^f_{t+1}\big)\Big]\,L_t`, says: "A weighted mix of the private and public portfolios' excess returns, multiplied by leverage.", where: String.raw`w_t = \frac{\text{Private}^{MV}_t}{\text{Private}^{MV}_t + \text{Public}^{MV}_t}` },
      { name: "Six-factor attribution", tex: String.raw`r_t - r^f_t = \alpha + \beta_1 \text{MKT}_t + \beta_2 \text{SMB}_t + \beta_3 \text{HML}_t + \beta_4 \text{UMD}_t + \beta_5 \text{BAB}_t + \beta_6 \text{QMJ}_t + \varepsilon_t`, says: "Explain monthly excess returns with market, size, value, momentum, low-beta and quality factors. Whatever is left over is alpha." },
      { name: "Sharpe ratio and information ratio", tex: String.raw`SR = \frac{E[r - r^f]}{\sigma(r - r^f)}, \qquad IR = \frac{\alpha}{\sigma(\varepsilon)}`, says: "Excess return per unit of total risk, and alpha per unit of the risk not explained by the market." },
    ],
    forAnalysts: [
      "The QMJ ingredients are statement ratios you already practice here: profitability (ROE, ROA, gross margin), growth, safety (low leverage, low earnings volatility) and payout.",
      "Reading Berkshire's balance sheet the way the authors did (float, deferred taxes, derivatives) is a case study in how the liabilities side can be an asset.",
    ],
    quiz: [
      { q: "Which two factors made Buffett's alpha statistically insignificant once added?", choices: ["Size and momentum", "Betting against beta and quality minus junk", "Value and size", "Momentum and market"], answer: 1, explain: "Berkshire loads strongly on BAB (safe, low-beta stocks) and QMJ (high-quality stocks). With them in the regression the alpha drops and loses significance." },
      { q: "How did the authors measure Buffett's leverage?", choices: ["Debt / EBITDA", "(Total assets − cash) / equity, at market values", "Net debt / equity at book value", "Beta of Berkshire's stock"], answer: 1, explain: "L = (TA − Cash) / Equity, all at market value. It averaged about 1.7 to 1." },
      { q: "Why was Berkshire's insurance float such a valuable source of leverage?", choices: ["It never has to be repaid", "Its average cost was below the T-bill rate", "It is counted as equity", "It is tax-free income"], answer: 1, explain: "The float cost about 1.72% a year on average, roughly 3 percentage points below T-bills: borrowing cheaper than the government." },
      { q: "Berkshire's Sharpe ratio over 1976–2017 was about…", choices: ["0.49", "0.79", "1.24", "2.10"], answer: 1, explain: "18.6% excess return over 23.5% volatility gives 0.79, versus 0.49 for the market." },
      { q: "What did splitting Berkshire into public and private holdings suggest?", choices: ["The private companies drove all the returns", "Public stock picks had the higher Sharpe ratio, pointing to stock selection skill", "Both lost money after costs", "Leverage was negative"], answer: 1, explain: "The 13F public portfolio had a higher Sharpe ratio than the imputed private businesses, so Buffett's edge looks more like stock selection than management." },
    ],
  },
  {
    id: "retirement-income",
    short: "Optimal Retirement Income",
    title: "Redefining the Optimal Retirement Income Strategy",
    authors: "David Blanchett",
    journal: "Financial Analysts Journal 79(1), 2023",
    doi: "10.1080/0015198X.2022.2129947",
    cite: "Financial Analysts Journal, vol. 79, no. 1 (2023), pp. 5–16",
    topic: "Retirement planning",
    tone: { bg: "var(--accent-soft)", ink: "text-accent" },
    oneLiner: "Retirees can cut back on wants but not on needs. Model that, let spending respond to a funded ratio, and judge plans by utility, not by probability of success.",
    summary: [
      "Most retirement tools assume a fixed real spending goal and score a plan by its probability of success: the share of simulations that never run out of money. Both assumptions are unrealistic. Retirees adjust, and running $1 short is scored the same as running $50,000 short.",
      "Blanchett splits the goal into needs (inelastic, like healthcare) and wants (elastic, like travel). In US consumer-spending data, roughly 65% of retiree spending is needs on average, and the share falls as total spending rises.",
      "Spending then evolves with a funded ratio, the pension-plan idea of assets (savings plus the present value of guaranteed income) over liabilities (the present value of future spending). Needs stay fixed in real terms; wants rise or fall each year depending on how well funded they are.",
      "Plans are compared with an expected-utility model inspired by prospect theory. Missing needs hurts a lot, wants count roughly one for one, and spending above the goal adds little. The certainty-equivalent income, divided by the goal, gives a client-friendly goal completion score. In the base case a plan with only a 70% probability of success has a 98% goal completion score.",
    ],
    numbers: [
      { value: "≈65%", label: "share of retiree spending that is inelastic needs (2020 Consumer Expenditure Survey, ages 65–80)" },
      { value: "70.2% vs 98.2%", label: "probability of success vs goal completion score for the same base-case plan" },
      { value: "3.8% – 5.4%", label: "range of optimal initial withdrawal rates across household types" },
      { value: "36.8%", label: "extra savings needed at a 3.8% withdrawal rate compared with 5.2%" },
    ],
    learnings: [
      { title: "Not all spending is equal", body: "Separate the goal into needs and wants. The bigger the needs share, the more a plan should lean on guaranteed income and the less risk it can take." },
      { title: "Let spending respond to the funded ratio", body: "A simple table of raises and cuts based on how well funded wants are keeps the plan alive in bad markets and lets it spend more in good ones." },
      { title: "Probability of success ignores the size of a miss", body: "A binary pass or fail treats a small trim to travel like running out of money for medicine. Utility scoring does not." },
      { title: "Advice depends on the household", body: "With high guaranteed income and flexible spending, optimal withdrawal rates and equity shares go up and annuities matter less. Low pensions and high needs point the other way." },
      { title: "Map assets to goals", body: "Needs can be matched with pensions and safe assets, wants with a risk portfolio, and any surplus can be invested more aggressively, which is goals-based investing." },
    ],
    formulas: [
      { name: "Needs funded ratio", tex: String.raw`N\_FR_t = \frac{A_t + \sum_{t=0}^{T}\dfrac{cp_t^s P_t}{(1+r_p)^t}}{\sum_{t=0}^{T}\dfrac{cp_t^s\, n\_g_t}{(1+r_n)^t}}`, says: "Savings plus the present value of guaranteed income, divided by the present value of needs spending.", where: String.raw`A_t = \text{portfolio},\ P_t = \text{pension income},\ n\_g_t = \text{needs goal},\ cp_t^s = \text{survival probability}` },
      { name: "Wants funded ratio", tex: String.raw`W\_FR_t = \max\!\left(\frac{A_t + \sum \dfrac{cp_t^s P_t}{(1+r_p)^t} - \sum \dfrac{cp_t^s\, n\_g_t}{(1+r_n)^t}}{\sum \dfrac{cp_t^s\, w\_g_t}{(1+r_w)^t}},\ 0\right)`, says: "What is left after funding needs, divided by the present value of wants. Wants spending moves up or down each year with this ratio." },
      { name: "Utility of income (per unit of goal)", tex: String.raw`u(x) = \begin{cases} n\left(\dfrac{x}{n}\right)^{\gamma_n} & x \le n \\[6pt] n + (1-n)\left(\dfrac{x-n}{1-n}\right)^{\gamma_w} & n < x \le 1 \\[6pt] x^{\gamma_e} & x > 1 \end{cases} \qquad x = \frac{i}{g}`, says: "Steep pain below the needs line, roughly linear value for wants, and little extra value above the goal. The paper uses γn = 4, γw = 1, γe = 0.25.", where: String.raw`i = \text{income},\ g = \text{total goal},\ n = \text{needs share}` },
      { name: "Utility-equivalent constant income for one path", tex: String.raw`II = \frac{\sum_{t=0}^{T} q_t (1+\rho)^{-t}\, u_t}{\sum_{t=0}^{T} q_t (1+\rho)^{-t}}`, says: "The steady income that would give the same total utility as the bumpy path actually lived." },
      { name: "Certainty equivalent across all paths", tex: String.raw`U = \left[\sum_{i=1}^{R} p_i\, (II_i)^{-\lambda}\right]^{-1/\lambda}`, says: "Average across simulations while penalizing bad paths more than good paths reward (λ = 2)." },
      { name: "Goal completion score", tex: String.raw`\text{Goal completion score} = \frac{U}{g}`, says: "The share of the goal achieved, adjusted for utility. 100 means fully on track." },
    ],
    forAnalysts: [
      "The funded ratio is the household version of a pension plan's funded status and of the coverage ratios in the Liquidity & Solvency lesson: assets you can count on over obligations you must meet.",
      "Present-valuing a stream of guaranteed income is the same discounting you use for leases and pension obligations on a balance sheet.",
    ],
    quiz: [
      { q: "What is the main weakness of 'probability of success' as a metric?", choices: ["It is hard to compute", "It ignores how large a shortfall is", "It only works for annuities", "It uses nominal returns"], answer: 1, explain: "A run that misses by $1 and one that runs out for a decade count the same: both are failures." },
      { q: "How does the dynamic spending rule decide whether wants spending goes up or down?", choices: ["By last year's stock return", "By the wants funded ratio", "By the retiree's age only", "By inflation"], answer: 1, explain: "Each year, wants spending is raised or cut according to a table keyed to the wants funded ratio, for example −20% at 0 and +10% at 2.0." },
      { q: "In the utility model, which part of spending carries the steepest penalty when missed?", choices: ["Excess spending above the goal", "Wants", "Needs", "All equally"], answer: 2, explain: "Needs use a high risk-aversion parameter (γn = 4), so shortfalls below the needs line lose utility fast." },
      { q: "In the base case, the probability of success was about 70%. What was the goal completion score?", choices: ["About 50%", "About 70%", "About 85%", "About 98%"], answer: 3, explain: "Because shortfalls mostly trimmed wants rather than needs, the utility-adjusted score was 98.2%." },
      { q: "Which household should, according to the paper, use a higher initial withdrawal rate?", choices: ["Low pension income, needs are 90% of the goal", "High pension income, needs are 30% of the goal", "Any household with $1 million saved", "Households that hold no equities"], answer: 1, explain: "Guaranteed income covers needs and flexible wants absorb shocks, so the optimal withdrawal rate rises (up to about 5.4% in Table 2)." },
    ],
  },
];

export const paperById = (id: string) => PAPERS.find((p) => p.id === id);
