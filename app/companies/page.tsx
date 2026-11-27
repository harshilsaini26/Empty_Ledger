import type { Metadata } from "next";
import { getGeneratedAt, getIndex } from "@/lib/data";
import { CompanyBrowser } from "@/components/CompanyBrowser";
import { PageHead } from "@/components/PageHead";

export const metadata: Metadata = { title: "Companies" };

export default function CompaniesPage() {
  const index = getIndex();
  const sec = index.filter((r) => !r.practice);
  const practice = index.filter((r) => r.practice);
  const at = getGeneratedAt();
  return (
    <div>
      <PageHead eyebrow="SEC EDGAR 10-K data" title={<>Pick a <span className="highlight">company</span></>}>
        Five fiscal years of 10-K statements for the 50 largest S&amp;P 500 companies, pulled from SEC EDGAR, plus five fictional
        training companies built to teach specific patterns.
        {at && <> Data refreshed {at.slice(0, 10)}.</>}
      </PageHead>
      <CompanyBrowser sec={sec} practice={practice} />
    </div>
  );
}
