"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { APP_NAME } from "@/lib/brand";
import { levelFor, streakOf, useProgress } from "@/lib/game/progress";
import { Confetti, CountUp, Ring } from "./fx";
import { IconCompanies, IconFlame, IconHome, IconLearn, IconPlay, IconUpload } from "./icons";

const NAV = [
  { href: "/", label: "Home", short: "Home", Icon: IconHome },
  { href: "/learn", label: "Learn", short: "Learn", Icon: IconLearn },
  { href: "/play", label: "Play", short: "Play", Icon: IconPlay },
  { href: "/companies", label: "Companies", short: "Explore", Icon: IconCompanies },
  { href: "/upload", label: "Analyze a file", short: "Analyze", Icon: IconUpload },
  { href: "/research", label: "Research", short: "Research", Icon: IconLearn, desktopOnly: true },
  { href: "/bogleheads", label: "Bogleheads", short: "Bogleheads", Icon: IconLearn, desktopOnly: true },
];

const isActive = (path: string | null, href: string) =>
  href === "/" ? path === "/" : !!path?.startsWith(href) || (href === "/companies" && !!path?.startsWith("/company/"));
// On phones the tab bar has five slots, so Research and Bogleheads live under Learn there.
const isActiveTab = (path: string | null, href: string) => isActive(path, href) || (href === "/learn" && (!!path?.startsWith("/research") || !!path?.startsWith("/bogleheads")));

export function XpBar({ compact = false }: { compact?: boolean }) {
  const { p, ready } = useProgress();
  const lv = levelFor(p.xp);
  const streak = streakOf(p.days);
  if (!ready) return <div className="h-10 w-40" />;
  return (
    <Link
      href="/progress"
      className="group flex items-center gap-2.5 rounded-full border border-line bg-panel py-1 pr-3 pl-1 shadow-[0_3px_0_var(--line)] transition-transform duration-150 hover:-translate-y-px active:translate-y-0.5"
      aria-label={`Level ${lv.index}, ${lv.title}, ${p.xp} XP${streak ? `, ${streak}-day streak` : ""}. Open your progress.`}
    >
      <Ring value={lv.progress} size={34} stroke={4}>
        <span className="font-display text-xs font-extrabold">{lv.index}</span>
      </Ring>
      {!compact && <span className="hidden text-xs font-semibold text-muted lg:inline">{lv.title}</span>}
      <span className="rounded-full bg-hi px-2 py-0.5 font-mono text-xs font-extrabold text-[#12201a]">
        <CountUp value={p.xp} /> XP
      </span>
      {streak > 0 && (
        <span className="flex items-center gap-0.5 text-sm font-extrabold text-bad">
          <IconFlame className="h-4 w-4" />
          <span className="num">{streak}</span>
        </span>
      )}
    </Link>
  );
}

function Toasts() {
  const { toasts } = useProgress();
  const levelUps = toasts.filter((t) => t.kind === "level");
  const rest = toasts.filter((t) => t.kind !== "level");
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex flex-col items-center gap-2" aria-live="assertive">
        {levelUps.map((t) => (
          <div key={t.id} className="toast-in relative rounded-3xl border-2 border-ink bg-hi px-6 py-3 text-center text-[#12201a] shadow-[0_6px_0_var(--ink)]" style={{ ["--tilt" as string]: "-2deg" }}>
            <Confetti fire={t.id} count={34} />
            <div className="font-mono text-[11px] font-extrabold tracking-[0.2em] uppercase">Promotion</div>
            <div className="font-display text-xl font-extrabold">{t.text}</div>
          </div>
        ))}
      </div>
      <div className="pointer-events-none fixed right-4 bottom-24 z-50 flex flex-col items-end gap-2 md:bottom-6" aria-live="polite">
        {rest.map((t, i) => (
          <div
            key={t.id}
            className={`toast-in rounded-2xl px-4 py-2 text-sm font-extrabold ${
              t.kind === "xp" ? "bg-hi font-mono text-[#12201a] shadow-[0_4px_0_var(--hi-deep)]" : "sticker bg-panel text-ink"
            }`}
            style={{ ["--tilt" as string]: t.kind === "badge" ? `${i % 2 ? 3 : -3}deg` : "0deg" }}
          >
            {t.text}
          </div>
        ))}
      </div>
    </>
  );
}

/** Desktop nav: a pill that slides to the current section. */
function TopNav() {
  const path = usePathname();
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [thumb, setThumb] = useState<{ x: number; w: number } | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const active = NAV.findIndex((n) => isActive(path, n.href));
  const target = hover ?? active;
  useLayoutEffect(() => {
    const el = target >= 0 ? refs.current[target] : null;
    setThumb(el ? { x: el.offsetLeft, w: el.offsetWidth } : null);
  }, [target, path]);
  return (
    <nav aria-label="Main" className="relative hidden items-center rounded-full border border-line bg-panel-2 p-1 md:flex" onMouseLeave={() => setHover(null)}>
      {thumb && (
        <span
          aria-hidden
          className={`absolute top-1 bottom-1 rounded-full ${hover !== null && hover !== active ? "bg-panel/70" : "bg-panel shadow-[0_2px_0_var(--line)]"}`}
          style={{ left: thumb.x, width: thumb.w, transition: "left 320ms var(--ease-pop), width 320ms var(--ease-pop), background 120ms" }}
        />
      )}
      {NAV.slice(1).map((n, j) => {
        const i = j + 1;
        const on = i === active;
        return (
          <Link
            key={n.href}
            href={n.href}
            ref={(el) => {
              refs.current[i] = el;
            }}
            onMouseEnter={() => setHover(i)}
            aria-current={on ? "page" : undefined}
            className={`relative z-[1] rounded-full px-3.5 py-2 text-sm font-bold transition-colors ${on ? "text-ink" : "text-muted hover:text-ink"}`}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Mobile: a bottom tab bar, the platform's pattern for top-level navigation. */
function TabBar() {
  const path = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {NAV.filter((n) => !n.desktopOnly).map((n) => {
          const on = isActiveTab(path, n.href);
          return (
            <li key={n.href}>
              <Link href={n.href} aria-current={on ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${on ? "text-accent" : "text-muted"}`}>
                <span className={`grid h-8 w-12 place-items-center rounded-full transition-all duration-300 ${on ? "bg-accent-soft" : ""}`} style={{ transitionTimingFunction: "var(--ease-pop)" }}>
                  <n.Icon className={`h-[22px] w-[22px] transition-transform duration-300 ${on ? "scale-110" : ""}`} />
                </span>
                {n.short}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5 font-display text-lg font-extrabold tracking-tight" aria-label={`${APP_NAME} home`}>
      <span
        aria-hidden
        className="grid h-9 w-9 place-items-center rounded-xl border-2 border-ink bg-accent font-mono text-sm text-on-accent shadow-[0_3px_0_var(--ink)] transition-transform duration-300 group-hover:-rotate-12"
        style={{ transitionTimingFunction: "var(--ease-pop)" }}
      >
        LL
      </span>
      <span className="hidden sm:inline">{APP_NAME}</span>
    </Link>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-bg">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5">
          <Logo />
          <TopNav />
          <XpBar />
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 pt-8 pb-28 md:pb-12">
        {children}
      </main>
      <footer className="mx-auto max-w-6xl px-4 pb-28 text-xs text-muted md:pb-10">
        Data: SEC EDGAR XBRL company facts (public domain). Training companies are fictional. For learning only, not investment advice.{" "}
        <Link className="underline" href="/about">
          Method & sources
        </Link>
      </footer>
      <TabBar />
      <Toasts />
    </>
  );
}
