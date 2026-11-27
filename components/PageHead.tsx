/** Page title block: mono eyebrow that says what the page is, display title, one-line lede. */
export function PageHead({ eyebrow, title, children }: { eyebrow: string; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="pop">
      <div className="font-mono text-xs font-extrabold tracking-[0.18em] text-muted uppercase">{eyebrow}</div>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
      {children && <p className="mt-3 max-w-2xl text-muted">{children}</p>}
    </header>
  );
}
