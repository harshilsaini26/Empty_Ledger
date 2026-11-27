"use client";
import { useId } from "react";

/** Labelled range input with its value shown in mono. */
export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  fmt = (v) => String(v),
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  fmt?: (v: number) => string;
  hint?: string;
}) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-bold">
          {label}
        </label>
        <output htmlFor={id} className="num rounded-full bg-hi-soft px-2 py-0.5 font-mono text-sm font-extrabold text-gold">
          {fmt(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="lab-range mt-2 w-full"
        style={{ ["--fill" as string]: `${pct}%` }}
      />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** A single headline number in a lab. */
export function Readout({ label, value, tone = "", sub }: { label: string; value: string; tone?: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panel-2/60 px-4 py-3">
      <div className="font-mono text-[10px] font-bold tracking-widest text-muted uppercase">{label}</div>
      <div className={`num mt-0.5 font-display text-2xl font-extrabold ${tone}`}>{value}</div>
      {sub && <div className="text-xs text-muted">{sub}</div>}
    </div>
  );
}
