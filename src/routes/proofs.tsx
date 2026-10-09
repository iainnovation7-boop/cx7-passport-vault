import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Btn, DataTable, Mono, PageHeader, Status } from "@/components/cx7/ui";
import { proofs } from "@/lib/cx7-data";

export const Route = createFileRoute("/proofs")({
  head: () => ({
    meta: [
      { title: "Solana Proof — CX7" },
      { name: "description", content: "Verifiable, on-chain proofs for every decision passport." },
      { property: "og:title", content: "Solana Proof — CX7" },
      { property: "og:description", content: "Every authority change anchored and verifiable on Solana." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const [verified, setVerified] = useState<Record<string, boolean>>({});
  return (
    <>
      <PageHeader step="04 · Evidence" title="Solana Proof" sub="Immutable evidence of who authorised what, and when.">
        <Btn variant="gold" disabled onClick={() => setVerified(Object.fromEntries(proofs.map((p) => [p.id, true])))}>Verify Proof</Btn>
      </PageHeader>
      <p className="mb-6 text-xs text-muted-foreground">Illustrative records · Not live on-chain verification · Full transaction signatures unavailable</p>
      <DataTable
        cols={["Proof ID", "Passport", "Network", "Status", "Signature", "Anchored at", ""]}
        rows={proofs.map((x) => [
          <Mono>{x.id}</Mono>, <Mono>{x.passport}</Mono>, x.network,
          <Status value={verified[x.id] && x.status === "PENDING" ? "VERIFIED" : x.status} />,
          <span className="font-mono text-xs text-cyan">{x.sig}</span>, <span className="font-mono text-xs">{x.at}</span>,
          <span className="text-xs text-muted-foreground">Transaction link unavailable</span>,
        ])}
      />
    </>
  );
}
