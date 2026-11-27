import type { Metadata } from "next";
import { LearnPath } from "@/components/LearnPath";
import { PageHead } from "@/components/PageHead";

export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  return (
    <div>
      <PageHead eyebrow="11 lessons · CFA Level I FSA" title={<>The <span className="highlight">learning path</span></>}>
        Each stop has a short read, a concept quiz and drills that use real company numbers. Score 60% to unlock the next stop.
      </PageHead>
      <LearnPath />
    </div>
  );
}
