import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/cx7/ui";
import { V5Proof } from "@/components/cx7/V5Proof";
import { readV5Evidence } from "@/lib/hackathon-v5.functions";

export const Route = createFileRoute("/evidence")({
  head: () => ({ meta: [{ title: "Passport v5 Evidence — CX7 Decision Passport" }, { name: "description", content: "Read-only finalized Solana Devnet v5 attestation and evidence hash comparison." }, { property: "og:title", content: "CX7 Passport v5 Evidence" }, { property: "og:description", content: "Independently read the v5 attestation and compare its hash with the supplied CX7 evidence hash." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: () => readV5Evidence(), component: Page,
});
function Page() {
  return <>
    <PageHeader step="Solana Devnet · Read only" title="Passport v5 Evidence" sub="External cryptographic evidence for the supplied CX7 case, not a new issuance." />
    <V5Proof initial={Route.useLoaderData()} />
  </>;
}