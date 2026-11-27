# Ledger Legends design language

**Thesis:** learning financial statements should feel like playing at an accountant's desk. The visuals come from the desk itself: green-ruled ledger paper, calculator keys, a highlighter, a red pen and the rubber stamp that says the books tie out.

## Picks from Web-Design-Bucket

I used the bucket as a structural reference and wrote every component from scratch. Nothing was copied from React Bits or Originkit, so their licence terms don't apply.

| Entry | What we took |
|---|---|
| `Design-systems/don_t_board_me` | Gamified micro-interactions, pill CTAs, monospaced step counters, round 22px cards |
| `Design-systems/quickbooks_conceptual_dashboard` | Hatched tracks for unfilled progress, pin-style markers, data-forward cards |
| `Design-systems/poppi` | One colour plane per item, used for the four arcade cabinets |
| `Web-elements/rubber-segment` | Sliding, overshooting thumb: the desktop nav and the company report tabs (`Segmented` in `components/fx.tsx`) |
| `Web-elements/flip-card` | The 3D flip that reveals the answer in Higher or Lower |
| `Web-elements/spotlight-card` | Pointer spotlight on feature, arcade and company cards (`.spotlight`) |
| `Background/formula-stream` (idea only) | A light CSS ticker tape of ratio formulas on the home page instead of a canvas background |

Following the bucket's rules, there is no heavy (WebGL or physics) effect. The site's signature is the stamp. Data views (company reports, upload results) stay quiet.

## Tokens (`app/globals.css`)

| Role | Light | Dark | Notes |
|---|---|---|---|
| Paper (`--bg`) | `#f1f6ee` | `#0c1310` | ledger paper |
| Ink (`--ink`) | `#12201a` | `#e5eee9` | 15.5:1 on paper |
| Muted (`--muted`) | `#4c5d55` | `#9cb0a6` | 6.4:1 on paper |
| Ledger green (`--accent`) | `#0a7350` | `#3dd69c` | primary actions, correct answers; white text 5.6:1 |
| Highlighter (`--hi`) | `#ffd43b` | `#ffd43b` | XP, streaks, "best" (always with dark ink text) |
| Red pen (`--bad`) | `#b8301e` | `#ff7d6b` | wrong answers, red flags |
| Blue pencil (`--blue`) | `#2a50d8` | `#86a2ff` | explore links, focus ring |

**Type:**
- Display and headings: Bricolage Grotesque.
- Controls and body: system UI.
- Numbers, tags and stamps: JetBrains Mono.

## Motion

The motion personality is **Playful**:

- **Easing:** one signature curve, `--ease-pop` (`cubic-bezier(0.34, 1.56, 0.64, 1)`, about 10% overshoot), used for entrances and feedback.
- **Durations:** three of them, 120 / 240 / 420 ms.
- **Entrance:** everything rises 10px and scales from 0.96. Lists stagger 40ms apart, and the cascade is capped under 400ms.
- **Signature moment:** the rubber stamp (`<Stamp>`). It slams in from 2.2x with a tilt on every answer ("Tied out", "Audited", "Needs review").
- **Secondary layer:**
  - Calculator-key buttons squash their bottom edge when pressed.
  - A red-pen strike-through draws across a wrong answer.
  - "+XP" floats up off a right answer.
  - Counters count up.
- **Ambient layer:**
  - The current lesson coin breathes.
  - The formula ticker scrolls and pauses on hover.
  - Confetti fires only for level-ups, records and passed lessons.

Under `prefers-reduced-motion`, every animation and transition collapses to its end state, the ticker and confetti stop, and state still reads through colour, borders and text.

## Platform conventions (from the HIG review)

- **Mobile navigation:** a bottom tab bar (Home, Learn, Play, Explore, Analyze) replaces the hamburger menu, with 56px targets and safe-area padding.
- **Keyboard:** answers take 1–4 or A–D, Higher or Lower takes ↑ / ↓ / →, the report tabs take arrow keys, and a skip link leads to the content.
- **Focus:** visible `:focus-visible` rings in blue pencil.
- **Light and dark:** both follow the system setting, and there is no in-app switch.
