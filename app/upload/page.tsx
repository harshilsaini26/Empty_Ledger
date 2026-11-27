import type { Metadata } from "next";
import { getCatalog, getIndex, getPeers } from "@/lib/data";
import { UploadLab } from "@/components/UploadLab";
import type { PeersFile } from "@/lib/engine/types";
import { PageHead } from "@/components/PageHead";

export const metadata: Metadata = { title: "Analyze a file" };

export default function UploadPage() {
  const peers = getPeers();
  // Only the group benchmarks are needed in the browser, not every company's rows.
  const bench: PeersFile | null = peers
    ? { groups: peers.groups, universe: peers.universe, companies: {}, category_labels: peers.category_labels }
    : null;
  const sectors = [...new Set([...getIndex().map((r) => r.sector), "Utilities", "Real Estate", "Materials", "Energy", "Industrials"])].sort();
  return (
    <div>
      <PageHead eyebrow="Runs in your browser · never uploaded" title={<>Analyze <span className="highlight">any</span> statement</>}>
        Upload a CSV or Excel file with one column per fiscal year: the app&apos;s template, or statements copied from a 10-K or annual
        report. Everything runs in your browser; the file is never sent anywhere.
      </PageHead>
      <UploadLab catalog={getCatalog()} peers={bench} sectors={sectors} />
    </div>
  );
}
