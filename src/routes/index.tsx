import { createFileRoute } from "@tanstack/react-router";
import CX7DecisionPassportHome from "@/components/CX7DecisionPassportHome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CX7 Decision Passport — Governed authority for AI" },
      { name: "description", content: "Time-bound, verifiable authority for autonomous systems. AI permissions expire when reality changes." },
      { property: "og:title", content: "CX7 Decision Passport" },
      { property: "og:description", content: "Governed authority for autonomous systems. Solana integration not connected yet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <CX7DecisionPassportHome />;
}
