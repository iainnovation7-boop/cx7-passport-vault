import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Btn, DataTable, PageHeader, Status } from "@/components/cx7/ui";
import { platforms } from "@/lib/cx7-data";

export const Route = createFileRoute("/platforms")({
  head: () => ({
    meta: [
      { title: "Your Platform / AI Agent — CX7" },
      { name: "description", content: "Connected platforms and AI agents governed by CX7 Decision Passports." },
      { property: "og:title", content: "Your Platform / AI Agent — CX7" },
      { property: "og:description", content: "See integration status for every connected agent, ERP and CRM." },
    ],
  }),
  component: Page,
});

function Page() {
  const [sel, setSel] = useState(0);
  const p = platforms[sel];
  return (
    <>
      <PageHeader step="01 · Source" title="Your Platform / AI Agent" sub="Every system that requests authority, in one place.">
        <Btn variant="gold">Connect Platform</Btn>
      </PageHeader>
      <div className="glass-gold mb-8 grid gap-6 rounded-2xl p-8 sm:grid-cols-2 lg:grid-cols-4">
        {[["Platform Name", p.name], ["Organization", p.org], ["Integration Status", <Status key="s" value={p.status} />], ["Last Activity", p.last]].map(([k, v]) => (
          <div key={k as string}><p className="eyebrow">{k}</p><div className="mt-2 text-lg font-semibold">{v}</div></div>
        ))}
      </div>
      <DataTable
        cols={["Platform", "Organization", "Type", "Status", "Last activity", ""]}
        rows={platforms.map((x, i) => [
          <span className="font-semibold">{x.name}</span>, x.org,
          <span className="text-muted-foreground">{x.type}</span>, <Status value={x.status} />, x.last,
          <button className="text-gold hover:underline" onClick={() => setSel(i)}>View Integration</button>,
        ])}
      />
    </>
  );
}
