import { describe, expect, it } from "vitest";
// @ts-expect-error plain ES module script without type declarations
import { pickDeletions } from "../scripts/prune-vercel-deployments.mjs";

const d = (uid: string, created: number, state = "READY") => ({ uid, created, state });

describe("pruning Vercel deployments", () => {
  const all = [d("a", 1), d("b", 2), d("live", 3), d("c", 4), d("d", 5), d("e", 6), d("f", 7, "BUILDING")];

  it("keeps the live production deployment and the newest few, oldest deleted first", () => {
    const out = pickDeletions(all, "live", 3).map((x: { uid: string }) => x.uid);
    expect(out).toEqual(["a", "b", "c"]);
  });
  it("never deletes a deployment that is still building", () => {
    const out = pickDeletions(all, "live", 1).map((x: { uid: string }) => x.uid);
    expect(out).not.toContain("f");
    expect(out).not.toContain("live");
    expect(out).toEqual(["a", "b", "c", "d", "e"]);
  });
  it("deletes nothing when there are fewer deployments than it keeps", () => {
    expect(pickDeletions([d("live", 1), d("x", 2)], "live", 3)).toEqual([]);
  });
});
