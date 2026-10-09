import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Btn, PageHeader, Status } from "@/components/cx7/ui";
import { readReferenceEvidence } from "@/lib/competition-evidence.functions";

export const Route = createFileRoute("/evidence")({
  head: () => ({ meta: [{ title: "Reference On-chain Lifecycle — CX7 Decision Passport" }, { name: "description", content: "Read-only Solana Devnet evidence of the previously executed CX7 reference lifecycle." }, { property: "og:title", content: "CX7 Reference On-chain Lifecycle" }, { property: "og:description", content: "Actual SAS accounts and transaction evidence, separate from current-session reconciliation." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: () => readReferenceEvidence(), component: Page,
});
function Page() {
  const initial = Route.useLoaderData();
  const [fresh, setFresh] = useState<typeof initial | null>(null);
  const [isFetching, setFetching] = useState(false);
  const read = useServerFn(readReferenceEvidence);
  const result = fresh ?? initial;
  const refetch = async () => { setFetching(true); try { setFresh(await read()); } finally { setFetching(false); } };
  return <>
    <PageHeader step="Solana Devnet · Read only" title="Reference On-chain Lifecycle" sub="Previously executed technical reference. These passports did not originate from your current reconciliation."><Btn onClick={() => { void refetch(); }} disabled={isFetching}>{isFetching ? "Reading…" : "Read again"}</Btn></PageHeader>
    {!result.ok ? <p role="alert" className="text-warning">{result.error}</p> : <>
      <dl className="mb-8 grid gap-3 text-sm [overflow-wrap:anywhere] md:grid-cols-2">
        {[["Network", result.data.network], ["Read at", result.data.readAt], ["Authority", result.data.authority], ["Authority balance", `${result.data.balanceSol} SOL`], ["Credential", result.data.credential], ["Schema", result.data.schemaName]].map(([k,v]) => <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="font-mono text-xs">{v}</dd></div>)}
      </dl>
      {result.data.rows.map(r => <section key={r.version} className="mb-6 min-w-0 border-t py-6 [overflow-wrap:anywhere]">
        <div className="mb-4 flex flex-wrap items-center gap-3"><h2 className="text-2xl">n{r.version}</h2><Status value={r.status} /></div>
        <dl className="grid gap-3 text-sm md:grid-cols-2">{[["Attestation", r.attestation], ["Decision hash", r.decisionHash], ["Issued at", r.issuedAt ? new Date(r.issuedAt * 1000).toISOString() : "Account closed — timestamp unavailable"], ["Expiration", r.validUntil ? new Date(r.validUntil * 1000).toISOString() : "Closed account — unavailable"], ["Predecessor", r.previousVersionId ?? "None"], ["Historical transaction", r.signature ?? "Unavailable"]].map(([k,v]) => <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="font-mono text-xs">{v}</dd></div>)}</dl>
        {r.revocationEvidence && <p className="mt-4 text-xs text-muted-foreground">Revocation evidence: absent predecessor plus verified on-chain successor {r.revocationEvidence}.</p>}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gold"><a href={r.accountUrl} target="_blank" rel="noreferrer">View attestation on Explorer ↗</a>{r.explorerUrl && <a href={r.explorerUrl} target="_blank" rel="noreferrer">View historical transaction ↗</a>}</div>
      </section>)}
    </>}
  </>;
}