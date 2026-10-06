import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Btn, DataTable, Mono, PageHeader, Status } from "@/components/cx7/ui";
import { passports } from "@/lib/cx7-data";

export const Route = createFileRoute("/passports")({
  head: () => ({
    meta: [
      { title: "Decision Passports — CX7" },
      { name: "description", content: "Issued decision passports with limits, validity windows and authority owners." },
      { property: "og:title", content: "Decision Passports — CX7" },
      { property: "og:description", content: "Time-bound authority for every autonomous decision." },
    ],
  }),
  component: Page,
});

function Page() {
  const [sel, setSel] = useState(0);
  const p = passports[sel];
  return (
    <>
      <PageHeader step="02 · Authority" title="Decision Passport" sub="Who may decide what, up to which limit, until when.">
        <Btn variant="gold">Issue New Passport</Btn>
        <Btn>Review Decision</Btn>
      </PageHeader>
      <div className="glass-gold mb-8 rounded-2xl p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="eyebrow">Passport</p><p className="mt-2 font-mono text-3xl text-gold">{p.id}</p></div>
          <Status value={p.status} />
        </div>
        <div className="hairline my-6" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[["Decision Type", p.type], ["Authorized Limit", p.limit], ["Valid Until", p.until], ["Authority Owner", p.owner]].map(([k, v]) => (
            <div key={k}><p className="eyebrow">{k}</p><p className="mt-2 font-semibold">{v}</p></div>
          ))}
        </div>
      </div>
      <DataTable
        cols={["Passport ID", "Decision type", "Limit", "Valid until", "Owner", "Status", ""]}
        rows={passports.map((x, i) => [
          <Mono>{x.id}</Mono>, x.type, x.limit, <span className="font-mono text-xs">{x.until}</span>, x.owner, <Status value={x.status} />,
          <button className="whitespace-nowrap text-gold hover:underline" onClick={() => setSel(i)}>View Passport</button>,
        ])}
      />
    </>
  );
}
