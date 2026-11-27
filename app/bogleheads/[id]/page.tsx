import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudyArticle } from "@/components/research/StudyArticle";
import { CHAPTERS, chapterById } from "@/lib/bogleheads/chapters";

export const dynamicParams = false;
export function generateStaticParams() {
  return CHAPTERS.map((c) => ({ id: c.id }));
}
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const c = chapterById((await params).id);
  return { title: c ? `${c.short} · Bogleheads` : "Bogleheads" };
}

export default async function ChapterPage({ params }: { params: Promise<{ id: string }> }) {
  const c = chapterById((await params).id);
  if (!c) notFound();
  const i = CHAPTERS.findIndex((x) => x.id === c.id);
  const next = CHAPTERS[(i + 1) % CHAPTERS.length];
  return (
    <StudyArticle
      p={c}
      back={{ href: "/bogleheads", label: "Bogleheads philosophy" }}
      next={{ href: `/bogleheads/${next.id}`, label: `Chapter ${((i + 1) % CHAPTERS.length) + 1}: ${next.short}` }}
      group={{ ids: CHAPTERS.map((x) => x.id), badge: "boglehead" }}
      linkLabel="Link to the rest of the app"
      footnote="Study notes in our own words, from the sources linked above. Not investment advice."
    />
  );
}
