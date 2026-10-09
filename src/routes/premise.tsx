import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Btn, PageHeader } from "@/components/cx7/ui";
import { readPythEvidence } from "@/lib/competition-evidence.functions";
const options = queryOptions({ queryKey: ["pyth-evidence"], queryFn: () => readPythEvidence(), staleTime: 0 });
export const Route = createFileRoute("/premise")({ head: () => ({ meta: [{ title: "Live Premise Source — Pyth · CX7" }, { name: "description", content: "Read the real Pyth SOL/USD PriceUpdateV2 account on Solana Devnet." }, { property: "og:title", content: "CX7 — Pyth Premise Source" }, { property: "og:description", content: "Independent, read-only machine-verifiable SOL/USD premise." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), loader: ({ context }) => context.queryClient.ensureQueryData(options), component: Page });
function Page() {
  const { data: r, refetch, isFetching } = useSuspenseQuery(options);
  return <><PageHeader step="Solana Devnet · Read only" title="Live Premise Source — Pyth" sub="An independent technical premise source. This price does not govern discount reconciliation."><Btn disabled={isFetching} onClick={() => { void refetch(); }}>{isFetching ? "Reading…" : "Read again"}</Btn></PageHeader>
    {!r.ok ? <p role="alert" className="text-warning">{r.error}</p> : <dl className="grid gap-6 border-t py-6 [overflow-wrap:anywhere] md:grid-cols-2">{[["SOL/USD", `$${r.data.value.toFixed(6)}`], ["Publication time", new Date(r.data.publishTime * 1000).toISOString()], ["Read at", new Date(r.data.readAt * 1000).toISOString()], ["Configured condition", r.data.condition], ["Evaluation at read time", r.data.stale ? "UNAVAILABLE — stale or partially verified price" : r.data.result ? "TRUE" : "FALSE"], ["Source", r.data.source], ["Account", r.data.account]].map(([k,v]) => <div key={k}><dt className="eyebrow">{k}</dt><dd className="mt-2 text-sm">{v}</dd></div>)}</dl>}
  </>;
}