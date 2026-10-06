import { useState } from "react";
import { Button } from "@/components/ui/button";

type Field = [label: string, value: string, changed?: boolean];
type Stage = { kicker: string; status: string; fields: Field[]; reason?: string; note?: string; cta: string; events: string[] };

const stages: Stage[] = [
  {
    kicker: "Step 1 · Authority valid",
    status: "VALID NOW",
    fields: [["Decision Passport", "VALID NOW"], ["Authorized amount", "R$ 1.800.000"], ["Validity", "24 hours"], ["Supplier Risk", "LOW"], ["Human Authority", "APPROVED"]],
    cta: "Continue →",
    events: ["Passport Issued"],
  },
  {
    kicker: "Step 2 · Premise changed",
    status: "PREMISE CHANGED",
    fields: [["Decision Passport", "PREMISE CHANGED", true], ["Authorized amount", "R$ 1.800.000"], ["Validity", "24 hours"], ["Supplier Risk", "LOW → HIGH", true], ["Human Authority", "APPROVED"]],
    cta: "Attempt Execution →",
    events: ["Premise Changed"],
  },
  {
    kicker: "Step 3 · Execution gate",
    status: "EXECUTION BLOCKED",
    fields: [["Agent request", "Execute R$ 1.750.000"], ["Passport checked", "PREMISE CHANGED"], ["Gate result", "EXECUTION BLOCKED", true]],
    reason: "Authority no longer valid — governing premise changed.",
    cta: "Human Review →",
    events: ["Execution Blocked"],
  },
  {
    kicker: "Step 4 · Human review",
    status: "VALID NOW",
    fields: [["Previous passport", "SUPERSEDED", true], ["New passport status", "VALID NOW", true], ["New authorized amount", "R$ 1.600.000", true], ["Supplier Risk", "REVIEWED"], ["Human Authority", "REAPPROVED"]],
    cta: "Retry Execution →",
    events: ["Human Review Started", "Previous Passport Superseded", "New Passport Issued"],
  },
  {
    kicker: "Step 5 · Execution approved",
    status: "EXECUTION APPROVED",
    fields: [["Passport checked", "VALID NOW"], ["Within approved conditions", "YES"], ["Gate result", "EXECUTION APPROVED", true]],
    cta: "Solana Proof →",
    events: ["Execution Approved"],
  },
  {
    kicker: "Step 6 · Solana proof",
    status: "PENDING INTEGRATION",
    fields: [["Network", "Solana"], ["Sensitive data", "NEVER ON-CHAIN"], ["Record", "CRYPTOGRAPHIC PROOF ONLY"], ["Proof Status", "PENDING INTEGRATION", true]],
    note: "Solana connection is the next implementation step. No transaction hash, signature, slot or confirmation is shown because none exists yet.",
    cta: "Restart Scenario ↻",
    events: ["Solana Proof Pending"],
  },
];

export function LiveScenario() {
  const [step, setStep] = useState(0);
  const stage = stages[step] ?? stages[0]!;
  const timeline = stages.slice(0, step + 1).flatMap((s) => s.events);
  const last = step === stages.length - 1;
  return (
    <>
      <p className="cx7-ready-kicker">Live scenario · {stage.kicker}</p>
      <h2 id="cx7-panel-title">Watch authority respond to reality.</h2>
      <p className="cx7-ready-subtitle">Decision Passport → Premise Monitor → Execution Gate → Solana Proof</p>
      <div className="cx7-ready-status-row"><span className="cx7-ready-status" aria-live="polite">{stage.status}</span></div>
      <div className="cx7-ready-grid">
        {stage.fields.map(([label, value, changed]) => (
          <div className={`cx7-ready-metric${changed ? " cx7-ready-changed" : ""}`} key={label}><small>{label}</small><strong>{value}</strong></div>
        ))}
      </div>
      {stage.reason && <p className="cx7-ready-reason">Reason: {stage.reason}</p>}
      {stage.note && <p className="cx7-ready-reason">{stage.note}</p>}
      <p className="cx7-ready-kicker" style={{ marginTop: 24 }}>Authority timeline</p>
      <div className="cx7-ready-timeline">
        {timeline.map((label, i) => (
          <div className="cx7-ready-event" key={label}><time>{String(i + 1).padStart(2, "0")}</time><b>{label}</b></div>
        ))}
      </div>
      <Button variant="ghost" className="cx7-ready-cta" onClick={() => setStep(last ? 0 : step + 1)}>{stage.cta}</Button>
      <p className="cx7-ready-note">Visual front-end demonstration only. No Solana transaction is claimed until the backend integration is implemented.</p>
    </>
  );
}
