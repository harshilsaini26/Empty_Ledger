import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudyArticle } from "@/components/research/StudyArticle";
import { PAPERS, paperById } from "@/lib/research/papers";

export const dynamicParams = false;
export function generateStaticParams() {
  return PAPERS.map((p) => ({ id: p.id }));
}
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const p = paperById((await params).id);
  return { title: p ? p.short : "Research" };
}

export default async function PaperPage({ params }: { params: Promise<{ id: string }> }) {
  const p = paperById((await params).id);
  if (!p) notFound();
  const next = PAPERS[(PAPERS.findIndex((x) => x.id === p.id) + 1) % PAPERS.length];
  return (
    <StudyArticle
      p={p}
      back={{ href: "/research", label: "Research desk" }}
      next={{ href: `/research/${next.id}`, label: `Next paper: ${next.short}` }}
      group={{ ids: PAPERS.map((x) => x.id), badge: "scholar" }}
    />
  );
}
