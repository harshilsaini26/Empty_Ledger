import type { Metadata } from "next";
import { PageHead } from "@/components/PageHead";
import { Arcade } from "@/components/games/Arcade";

export const metadata: Metadata = { title: "Play" };

export default function PlayPage() {
  return (
    <div>
      <PageHead eyebrow="Arcade · 4 games" title={<>Insert <span className="highlight">coin</span>.</>}>
        Short games that drill the skills analysts use every day. Every game uses real 10-K numbers (or the training companies until the SEC data is built).
      </PageHead>
      <Arcade />
    </div>
  );
}
