import { createFileRoute } from "@tanstack/react-router";
import CX7DecisionPassportHome from "@/components/CX7DecisionPassportHome";
import { readV5Evidence } from "@/lib/hackathon-v5.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CX7 Decision Passport — Governed authority for AI" },
      { name: "description", content: "Discount Policy Reconciliation: CX7 Passport v5 evidence hash, finalized Solana Devnet attestation and independent read-back comparison." },
      { property: "og:title", content: "CX7 Decision Passport" },
      { property: "og:description", content: "CX7 governs decision authority. Solana preserves external cryptographic evidence. Inspect the real v5 proof and read-back hash." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => readV5Evidence(),
  component: Index,
});

function Index() {
  return <CX7DecisionPassportHome evidence={Route.useLoaderData()} />;
}
