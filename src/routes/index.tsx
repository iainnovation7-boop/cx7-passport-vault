import { createFileRoute } from "@tanstack/react-router";
import CX7DecisionPassportHome from "@/components/CX7DecisionPassportHome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CX7 Decision Passport — Governed authority for AI" },
      { name: "description", content: "Session-scoped reconciliation, explicit human confirmation, off-chain drafts and real Solana Devnet reference evidence." },
      { property: "og:title", content: "CX7 Decision Passport" },
      { property: "og:description", content: "Powered by the CX7 Decision Authority Engine. Session-confirmed drafts and read-only technical evidence." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <CX7DecisionPassportHome />;
}
