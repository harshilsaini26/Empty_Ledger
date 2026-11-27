// Server-rendered math: KaTeX runs at build time, so pages ship plain HTML and CSS.
import katex from "katex";

export function Tex({ tex, block = false }: { tex: string; block?: boolean }) {
  const html = katex.renderToString(tex, { displayMode: block, throwOnError: false, strict: "ignore", output: "htmlAndMathml" });
  return <span className={block ? "block overflow-x-auto py-1" : ""} dangerouslySetInnerHTML={{ __html: html }} />;
}
