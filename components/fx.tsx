"use client";
// Small motion helpers shared across the app. No animation library: CSS does the
// work, React only sets variables and keys. Everything respects reduced motion.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Number that counts toward its value (ease-out, ~600ms). */
export function CountUp({ value, duration = 600, format = (n: number) => String(Math.round(n)) }: { value: number; duration?: number; format?: (n: number) => string }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const [bump, setBump] = useState(0);
  useEffect(() => {
    const start = from.current;
    if (start === value) return;
    if (value > start) setBump((b) => b + 1);
    if (reduced) {
      from.current = value;
      setShown(value);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / duration);
      const e = 1 - Math.pow(1 - k, 3);
      setShown(start + (value - start) * e);
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      from.current = value;
    };
  }, [value, duration, reduced]);
  return (
    <span key={bump} className={`num inline-block ${bump ? "bump" : ""}`}>
      {format(shown)}
    </span>
  );
}

/** Pointer-tracked spotlight for .spotlight cards. */
export function spot(e: React.PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - r.left}px`);
  el.style.setProperty("--my", `${e.clientY - r.top}px`);
}

const CONFETTI_COLORS = ["var(--accent)", "var(--hi)", "var(--blue)", "var(--bad)", "var(--chart-4)"];

/** A one-shot burst of paper confetti. Change `fire` to re-trigger. Decorative. */
export function Confetti({ fire, count = 26 }: { fire: number; count?: number }) {
  const bits = useMemo(() => {
    let s = fire * 9301 + 49297;
    const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    return Array.from({ length: count }, (_, i) => {
      const a = r() * Math.PI * 2;
      const d = 90 + r() * 170;
      return {
        i,
        dx: `${Math.cos(a) * d}px`,
        dy: `${Math.sin(a) * d * 0.7 + 120}px`,
        rot: `${(r() - 0.5) * 720}deg`,
        delay: `${Math.round(r() * 90)}ms`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        w: 6 + Math.round(r() * 6),
      };
    });
  }, [fire, count]);
  if (!fire) return null;
  return (
    <div key={fire} aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-visible">
      {bits.map((b) => (
        <span
          key={b.i}
          className="confetti-bit"
          style={{ background: b.color, width: b.w, ["--dx" as string]: b.dx, ["--dy" as string]: b.dy, ["--rot" as string]: b.rot, ["--delay" as string]: b.delay }}
        />
      ))}
    </div>
  );
}

/** Rubber stamp. Rendered on top of its positioned parent. */
export function Stamp({ children, sub, bad = false, large = false, className = "", tilt = -9 }: { children: React.ReactNode; sub?: string; bad?: boolean; large?: boolean; className?: string; tilt?: number }) {
  return (
    <span aria-hidden className={`stamp ${bad ? "stamp-bad" : ""} ${large ? "stamp-lg" : ""} ${className}`} style={{ ["--tilt" as string]: `${tilt}deg` }}>
      {children}
      {sub && <small>{sub}</small>}
    </span>
  );
}

/** Floating "+10 XP" that rises off an element. Put it inside a relative parent. */
export function FloatXp({ amount, id }: { amount: number; id: number }) {
  if (!amount) return null;
  return (
    <span key={id} aria-hidden className="float-xp rounded-full bg-hi px-2.5 py-0.5 font-mono text-xs font-extrabold text-[#12201a] shadow">
      +{amount} XP
    </span>
  );
}

/**
 * Segmented control with a sliding thumb that overshoots slightly as it lands.
 * Works as tabs (role=tablist) and supports arrow keys.
 */
export function Segmented<T extends string>({
  items,
  value,
  onChange,
  label,
  className = "",
}: {
  items: readonly { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [thumb, setThumb] = useState<{ x: number; w: number } | null>(null);
  useIso(() => {
    const measure = () => {
      const el = refs.current[value];
      if (el) setThumb({ x: el.offsetLeft, w: el.offsetWidth });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [value, items]);
  const idx = items.findIndex((i) => i.id === value);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const n = items[(idx + (e.key === "ArrowRight" ? 1 : items.length - 1)) % items.length];
    onChange(n.id);
    refs.current[n.id]?.focus();
  };
  return (
    <div ref={wrap} role="tablist" aria-label={label} onKeyDown={onKey} className={`relative inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-panel-2 p-1 ${className}`}>
      {thumb && (
        <span
          aria-hidden
          className="absolute top-1 bottom-1 rounded-full bg-panel shadow-[0_2px_0_var(--line),0_6px_14px_-8px_rgba(0,0,0,0.3)]"
          style={{ left: thumb.x, width: thumb.w, transition: "left 320ms var(--ease-pop), width 320ms var(--ease-pop)" }}
        />
      )}
      {items.map((t) => (
        <button
          key={t.id}
          ref={(el) => {
            refs.current[t.id] = el;
          }}
          role="tab"
          aria-selected={value === t.id}
          tabIndex={value === t.id ? 0 : -1}
          onClick={() => onChange(t.id)}
          className={`relative z-[1] min-h-9 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors ${value === t.id ? "text-ink" : "text-muted hover:text-ink"}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Ticker tape of formulas. Decorative: pauses on hover, stops under reduced motion. */
export function Ticker({ items }: { items: string[] }) {
  const row = (
    <div className="flex shrink-0 items-center gap-8 pr-8">
      {items.map((t, i) => (
        <span key={i} className="flex items-center gap-8 whitespace-nowrap font-mono text-sm">
          <span>{t}</span>
          <span className="text-hi" aria-hidden>
            ◆
          </span>
        </span>
      ))}
    </div>
  );
  return (
    <div aria-hidden className="marquee -mx-4 overflow-hidden border-y-2 border-ink bg-ink py-2.5 text-bg sm:mx-0 sm:rounded-full">
      <div className="marquee-track">
        {row}
        {row}
      </div>
    </div>
  );
}

/** Circular progress ring (SVG). */
export function Ring({ value, size = 72, stroke = 8, children }: { value: number; size?: number; stroke?: number; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--panel-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--hi)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(1, value)))}
          style={{ transition: "stroke-dashoffset 700ms var(--ease-pop)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

/** Number keys 1-4 and letters A-D pick a choice. Active only while `enabled`. */
export function useChoiceKeys(count: number, enabled: boolean, onPick: (i: number) => void) {
  const cb = useRef(onPick);
  cb.current = onPick;
  useEffect(() => {
    if (!enabled) return;
    const h = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      const k = e.key.toLowerCase();
      let i = -1;
      if (k >= "1" && k <= "9") i = Number(k) - 1;
      else if (k.length === 1 && k >= "a" && k <= "z") i = k.charCodeAt(0) - 97;
      if (i >= 0 && i < count) {
        e.preventDefault();
        cb.current(i);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [count, enabled]);
}
