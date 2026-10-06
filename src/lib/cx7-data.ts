export type PassportStatus = "VALID" | "PREMISE CHANGED" | "UNDER REVIEW" | "SUSPENDED" | "SUPERSEDED" | "EXPIRED";
export type GateStatus = "APPROVED" | "BLOCKED" | "PENDING REVIEW";
export type ProofStatus = "VERIFIED" | "PENDING" | "FAILED";

export const platforms = [
  { name: "Atlas Treasury Agent", org: "Meridian Capital", type: "AI Agent", status: "Connected", last: "2 min ago" },
  { name: "SAP S/4HANA", org: "Northwind Industrial", type: "ERP", status: "Connected", last: "14 min ago" },
  { name: "Salesforce Pricing Bot", org: "Helios Retail", type: "CRM", status: "Degraded", last: "1 h ago" },
  { name: "Internal Procurement Core", org: "Meridian Capital", type: "Internal system", status: "Pending", last: "—" },
];

export const passports: { id: string; type: string; limit: string; until: string; owner: string; status: PassportStatus }[] = [
  { id: "DP-7F21", type: "Treasury rebalancing", limit: "$2,500,000", until: "2026-10-06 18:00", owner: "CFO · L. Moreau", status: "VALID" },
  { id: "DP-7E94", type: "Supplier payment", limit: "$480,000", until: "2026-10-07 09:00", owner: "Procurement · A. Silva", status: "PREMISE CHANGED" },
  { id: "DP-7E10", type: "Dynamic pricing", limit: "±8% margin", until: "2026-10-06 23:59", owner: "CRO · K. Tanaka", status: "UNDER REVIEW" },
  { id: "DP-7C55", type: "Credit approval", limit: "$120,000", until: "2026-10-05 17:00", owner: "Risk · M. Okafor", status: "SUSPENDED" },
  { id: "DP-7B02", type: "Treasury rebalancing", limit: "$3,000,000", until: "2026-10-05 12:00", owner: "CFO · L. Moreau", status: "SUPERSEDED" },
  { id: "DP-7A88", type: "FX hedging", limit: "€900,000", until: "2026-10-01 18:00", owner: "Treasury · J. Becker", status: "EXPIRED" },
];

export const gateLog: { action: string; passport: string; permission: string; status: GateStatus; ts: string }[] = [
  { action: "Rebalance 1.8M USD → T-Bills", passport: "DP-7F21", permission: "Within limit", status: "APPROVED", ts: "14:12:41" },
  { action: "Pay supplier #4471 · $410,000", passport: "DP-7E94", permission: "Premise changed", status: "BLOCKED", ts: "14:07:03" },
  { action: "Raise SKU price +6%", passport: "DP-7E10", permission: "Awaiting owner", status: "PENDING REVIEW", ts: "13:58:19" },
  { action: "Approve credit line · $95,000", passport: "DP-7C55", permission: "Suspended", status: "BLOCKED", ts: "13:40:02" },
];

export const proofs: { id: string; passport: string; network: string; status: ProofStatus; sig: string; at: string }[] = [
  { id: "PRF-0391", passport: "DP-7F21", network: "Solana Mainnet", status: "VERIFIED", sig: "5xKq…9vTn", at: "14:11:08" },
  { id: "PRF-0390", passport: "DP-7E94", network: "Solana Mainnet", status: "VERIFIED", sig: "3hBz…Qa2L", at: "14:07:05" },
  { id: "PRF-0389", passport: "DP-7E10", network: "Solana Devnet", status: "PENDING", sig: "—", at: "13:58:22" },
  { id: "PRF-0388", passport: "DP-7C55", network: "Solana Mainnet", status: "FAILED", sig: "2mRw…Lx7c", at: "13:40:10" },
];

export const timeline = [
  { t: "14:02", label: "Passport Issued", detail: "DP-7E94 · Supplier payment up to $480,000", tone: "gold" },
  { t: "14:07", label: "Premise Changed", detail: "Supplier credit rating downgraded A → BB", tone: "warning" },
  { t: "14:07:03", label: "Execution Blocked", detail: "Agent payment of $410,000 halted at the gate", tone: "danger" },
  { t: "14:09", label: "Human Review Started", detail: "A. Silva assigned as authority owner", tone: "cyan" },
  { t: "14:10", label: "New Passport Issued", detail: "DP-7F21 · Revised limit and conditions", tone: "gold" },
  { t: "14:11", label: "Proof Verified on Solana", detail: "Signature 5xKq…9vTn anchored", tone: "success" },
] as const;

export const kpis = [
  { label: "Active Passports", value: "128" },
  { label: "Premises Changed", value: "7" },
  { label: "Blocked Executions", value: "23" },
  { label: "Verified Proofs", value: "1,942" },
];
