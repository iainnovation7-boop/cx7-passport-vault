import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Btn, DataTable, Mono, PageHeader, Status } from "@/components/cx7/ui";
import { gateLog } from "@/lib/cx7-data";

export const Route = createFileRoute("/gate")({
  head: () => ({
    meta: [
      { title: "Execution Gate — CX7" },
      { name: "description", content: "Control what autonomous systems may execute, in real time." },
      { property: "og:title", content: "Execution Gate — CX7" },
      { property: "og:description", content: "Approve, block or route AI actions to human review." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const [check, setCheck] = useState<"idle" | "running" | "done">("idle");
  const run = () => { setCheck("running"); setTimeout(() => setCheck("done"), 1400); };
  const top = gateLog[1];
  if (!top) return null;
  return (
    <>
      <PageHeader step="03 · Control" title="Execution Gate" sub="Nothing executes without a valid passport behind it.">
        <Btn variant="gold" onClick={run} disabled={check === "running"}>{check === "running" ? "Checking…" : "Run Demo Check"}</Btn>
        <Button asChild variant="outline"><a href="#gate-log">View Gate Log</a></Button>
      </PageHeader>
      <p className="mb-6 text-xs text-muted-foreground">Controlled demonstration · Illustrative gate records · No business execution</p>
      <div className={`mb-8 rounded-2xl p-8 ${check === "done" ? "glass border-danger/40" : "glass-gold"}`}>
        <p className="eyebrow">Requested Action</p>
        <p className="mt-2 text-2xl font-semibold">{top.action}</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-4">
          <div><p className="eyebrow">Linked Passport</p><p className="mt-2"><Mono>{top.passport}</Mono></p></div>
          <div><p className="eyebrow">Current Permission</p><p className="mt-2 font-semibold">{top.permission}</p></div>
          <div><p className="eyebrow">Execution Status</p><div className="mt-2"><Status value={check === "idle" ? "PENDING REVIEW" : check === "running" ? "PENDING REVIEW" : "BLOCKED"} /></div></div>
          <div><p className="eyebrow">Timestamp</p><p className="mt-2 font-mono text-sm">{top.ts}</p></div>
        </div>
        {check === "done" && <p className="mt-6 text-sm text-danger">Premise changed since issuance — execution blocked. Human review required.</p>}
      </div>
      <div id="gate-log" className="scroll-mt-28"><DataTable
        cols={["Requested action", "Passport", "Permission", "Status", "Timestamp"]}
        rows={gateLog.map((x) => [x.action, <Mono>{x.passport}</Mono>, x.permission, <Status value={x.status} />, <span className="font-mono text-xs">{x.ts}</span>])}
      /></div>
    </>
  );
}
