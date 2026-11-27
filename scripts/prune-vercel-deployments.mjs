#!/usr/bin/env node
// Delete old Vercel deployments of this project, keeping the live production one and the newest few.
//
//   VERCEL_TOKEN=...  VERCEL_PROJECT=empty-ledger  node scripts/prune-vercel-deployments.mjs [--dry-run]
//
// Env: VERCEL_TOKEN (required, from vercel.com/account/tokens), VERCEL_PROJECT (project name or id),
//      VERCEL_TEAM_ID (only for team accounts), KEEP (newest deployments to keep, default 3).
// Deleting a deployment is permanent and removes it as an instant-rollback target.

const API = "https://api.vercel.com";

/** Which deployments to delete: everything except the live production one, the newest `keep`,
 *  and anything still building. `deployments` may be in any order. */
export function pickDeletions(deployments, productionId, keep) {
  const done = deployments.filter((d) => !["BUILDING", "QUEUED", "INITIALIZING"].includes(d.state));
  const newest = [...deployments].sort((a, b) => b.created - a.created).slice(0, keep).map((d) => d.uid);
  return done.filter((d) => d.uid !== productionId && !newest.includes(d.uid)).sort((a, b) => a.created - b.created);
}

async function api(path, { method = "GET", token, team } = {}) {
  const url = new URL(path, API);
  if (team) url.searchParams.set("teamId", team);
  const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`${method} ${url.pathname} -> ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

async function main() {
  const token = process.env.VERCEL_TOKEN;
  const project = process.env.VERCEL_PROJECT;
  const team = process.env.VERCEL_TEAM_ID || undefined;
  const keep = Number(process.env.KEEP ?? 3);
  const dry = process.argv.includes("--dry-run") || process.env.DRY_RUN === "true";
  if (!token || !project) throw new Error("Set VERCEL_TOKEN and VERCEL_PROJECT.");
  if (!Number.isInteger(keep) || keep < 1) throw new Error("KEEP must be a whole number of at least 1.");

  const proj = await api(`/v9/projects/${encodeURIComponent(project)}`, { token, team });
  const productionId = proj.targets?.production?.id;
  if (!productionId) throw new Error("Could not find the live production deployment; deleting nothing.");

  const all = [];
  for (let until; ; ) {
    const page = await api(`/v6/deployments?projectId=${proj.id}&limit=100${until ? `&until=${until}` : ""}`, { token, team });
    all.push(...page.deployments.map((d) => ({ uid: d.uid, created: d.created, state: d.state ?? d.readyState, url: d.url, target: d.target })));
    until = page.pagination?.next;
    if (!until) break;
  }

  const doomed = pickDeletions(all, productionId, keep);
  console.log(`${all.length} deployments, keeping ${all.length - doomed.length} (live production ${productionId} + newest ${keep}).`);
  for (const d of doomed) {
    const when = new Date(d.created).toISOString().slice(0, 16).replace("T", " ");
    if (dry) console.log(`would delete ${d.uid}  ${when}  ${d.target ?? "preview"}  ${d.url}`);
    else {
      await api(`/v13/deployments/${d.uid}`, { method: "DELETE", token, team });
      console.log(`deleted ${d.uid}  ${when}  ${d.target ?? "preview"}`);
    }
  }
  if (!doomed.length) console.log("Nothing to delete.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
