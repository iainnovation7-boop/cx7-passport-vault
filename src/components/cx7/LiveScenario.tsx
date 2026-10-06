import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { getScenarioAuthority, getScenarioPremise, issueVerifiableProof, type ProofResult, type ScenarioAuthority } from "@/lib/solana-proof.functions";
import { AWAITING_FUNDING, isGenuineProof, onchainLabel } from "@/lib/onchain-display";
import type { PremiseReading } from "@/lib/pyth-premise";
import { premiseRows } from "./premise-view";

type Field = [label: string, value: string, changed?: boolean];
type Stage = { kicker: string; status: string; fields: Field[]; reason?: string; note?: string; cta: string; events: string[] };

const MIN_LAMPORTS = 20_000_000;

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
    note: "The Supplier Risk change is a demonstration. The live Pyth premise below is shown exactly as read — no price change is simulated.",
    cta: "Attempt Execution →",
    events: ["Premise Changed"],
  },
  {
    kicker: "Step 3 · Execution gate",
    status: "EXECUTION BLOCKED",
    fields: [["Agent request", "Execute R$ 1.750.000"], ["Passport checked", "PREMISE CHANGED"], ["Gate result", "EXECUTION BLOCKED", true], ["On-chain revocation of n1", AWAITING_FUNDING]],
    reason: "Authority no longer valid — governing premise changed.",
    cta: "Human Review →",
    events: ["Execution Blocked"],
  },
  {
    kicker: "Step 4 · Human review",
    status: "VALID NOW",
    fields: [["Previous passport", "SUPERSEDED", true], ["New passport status", "VALID NOW", true], ["New authorized amount", "R$ 1.600.000", true], ["Supplier Risk", "REVIEWED"], ["Human Authority", "REAPPROVED"], ["n2 issuance on-chain", AWAITING_FUNDING]],
    cta: "Retry Execution →",
    events: ["Human Review Started", "Previous Passport Superseded", "New Passport Issued"],
  },
  {
    kicker: "Step 5 · Execution approved",
    status: "EXECUTION APPROVED",
    fields: [["Passport checked", "VALID NOW"], ["Within approved conditions", "YES"], ["Gate result", "EXECUTION APPROVED", true], ["Blockchain execution", AWAITING_FUNDING]],
    cta: "Solana Proof →",
    events: ["Execution Approved"],
  },
  {
    kicker: "Step 6 · Solana proof",
    status: AWAITING_FUNDING,
    fields: [],
    cta: "Restart Scenario ↻",
    events: ["Solana Proof Pending"],
  },
];

function Origin({ real, label }: { real: boolean; label: string }) {
  return <span className={`cx7-origin ${real ? "cx7-origin-real" : "cx7-origin-demo"}`}>{label}</span>;
}

const short = (s: string) => (s.length > 16 ? `${s.slice(0, 8)}…${s.slice(-6)}` : s);

export function LiveScenario() {
  const [step, setStep] = useState(0);
  const base = stages[step] ?? stages[0]!;
  const issue = useServerFn(issueVerifiableProof);
  const loadAuthority = useServerFn(getScenarioAuthority);
  const loadPremise = useServerFn(getScenarioPremise);
  const [proof, setProof] = useState<ProofResult | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [authority, setAuthority] = useState<ScenarioAuthority | null>(null);
  const [premise, setPremise] = useState<{ ok: true; reading: PremiseReading } | { ok: false; error: string } | null>(null);
  const [reading, setReading] = useState(false);

  const refreshPremise = useCallback(async () => {
    setReading(true);
    try {
      setPremise(await loadPremise());
    } catch (e) {
      setPremise({ ok: false, error: e instanceof Error ? e.message : "Read failed" });
    } finally {
      setReading(false);
    }
  }, [loadPremise]);

  useEffect(() => {
    void refreshPremise();
    loadAuthority().then(setAuthority, (e) => setAuthority({ ok: false, error: e instanceof Error ? e.message : "Read failed" }));
  }, [refreshPremise, loadAuthority]);

  const isProofStep = step === stages.length - 1;
  const verified = proof && isGenuineProof(proof) && proof.ok ? proof : null;
  const funded = authority?.ok ? authority.lamports >= MIN_LAMPORTS : false;
  const proofStatus = issuing ? "ISSUING…" : verified ? "VERIFIED" : proof ? "FAILED" : funded ? "READY TO ISSUE" : AWAITING_FUNDING;
  const stage: Stage = isProofStep
    ? {
        ...base,
        status: proofStatus,
        fields: [
          ["Network", "Solana Devnet"],
          ["Schema", authority?.ok ? authority.schemaName : "CX7_DECISION_PASSPORT_V2"],
          ["Sensitive data", "NEVER ON-CHAIN"],
          ["Proof Status", proofStatus, true],
          ...(verified
            ? ([
                ["Passport version", `n${verified.passportVersion}`],
                ["Attestation Address", verified.attestation],
                ["Transaction Signature", verified.signature],
                ["Anchored At", verified.anchoredAt ? new Date(verified.anchoredAt).toUTCString() : "Confirmed"],
                ["Expires", new Date(verified.expiry * 1000).toUTCString()],
              ] as Field[])
            : []),
        ],
        note: verified
          ? "Only pseudonymous identifiers and SHA-256 hashes are on-chain. No names, amounts or documents."
          : proof && !proof.ok
            ? `Proof could not be issued: ${proof.error.replace(/\.$/, "")}. The passport is unchanged — you can retry.`
            : "No attestation exists yet. No signature, Explorer link or on-chain status is shown until one is really issued.",
      }
    : base;
  const timeline = [...stages.slice(0, step + 1).flatMap((s) => s.events), ...(isProofStep && verified ? ["Proof Verified on Solana"] : [])];
  const runProof = async () => {
    setIssuing(true);
    try {
      setProof(await issue());
    } catch (e) {
      setProof({ ok: false, error: e instanceof Error ? e.message : "Request failed" });
    } finally {
      setIssuing(false);
    }
  };
  const last = step === stages.length - 1;
  const showPremise = step <= 2;
  const showAuthority = step === 0 || step === 3 || isProofStep;
  const auth = authority?.ok ? authority : null;
  const versionView = auth ? (step === 0 ? auth.n1 : auth.n2) : null;

  return (
    <>
      <p className="cx7-ready-kicker">Live scenario · {stage.kicker}</p>
      <h2 id="cx7-panel-title">Watch authority respond to reality.</h2>
      <p className="cx7-ready-subtitle">Decision Passport → Premise Monitor → Execution Gate → Solana Proof</p>
      <div className="cx7-ready-status-row">
        <span className="cx7-ready-status" aria-live="polite">{stage.status}</span>
        {isProofStep ? <Origin real={!!verified} label={verified ? "REAL · VERIFIED ON-CHAIN" : "NOT YET ON-CHAIN"} /> : <Origin real={false} label="DEMO · NOT YET ON-CHAIN" />}
      </div>
      <div className="cx7-ready-grid">
        {stage.fields.map(([label, value, changed]) => (
          <div className={`cx7-ready-metric${changed ? " cx7-ready-changed" : ""}`} key={label}><small>{label}</small><strong>{value}</strong></div>
        ))}
      </div>
      {stage.reason && <p className="cx7-ready-reason">Reason: {stage.reason}</p>}
      {stage.note && <p className="cx7-ready-reason">{stage.note}</p>}

      {showPremise && (
        <section className="cx7-real-block" aria-label="Premise Monitor">
          <p className="cx7-ready-kicker">Premise Monitor <Origin real label="REAL DATA · LIVE READ" /></p>
          {premise?.ok ? (
            <div className="cx7-ready-grid">
              {premiseRows(premise.reading).map(([label, value, changed]) => (
                <div className={`cx7-ready-metric${changed ? " cx7-ready-changed" : ""}`} key={label}><small>{label}</small><strong>{value}</strong></div>
              ))}
            </div>
          ) : (
            <p className="cx7-ready-note">{premise ? `Live read unavailable: ${premise.error}` : "Reading Pyth SOL/USD on Solana Devnet…"}</p>
          )}
          <Button variant="ghost" className="cx7-ready-cta" disabled={reading} onClick={refreshPremise}>{reading ? "Reading…" : "Refresh live price ↻"}</Button>
        </section>
      )}

      {showAuthority && (
        <section className="cx7-real-block" aria-label="Passport authority">
          <p className="cx7-ready-kicker">Passport authority <Origin real label="REAL READ · SOLANA DEVNET" /></p>
          {auth && versionView ? (
            <div className="cx7-ready-grid">
              <div className="cx7-ready-metric"><small>Lineage</small><strong>{short(auth.lineage)}</strong></div>
              <div className="cx7-ready-metric"><small>Passport version</small><strong>n{versionView.version}</strong></div>
              <div className="cx7-ready-metric"><small>Predecessor</small><strong>{versionView.predecessor ? `n1 · ${short(versionView.predecessor)}` : "None (first version)"}</strong></div>
              <div className="cx7-ready-metric"><small>Expected state</small><strong>{versionView.version === 1 ? "VALID → REVOKED on premise change" : "VALID after n1 revoked"}</strong></div>
              <div className="cx7-ready-metric"><small>Validity</small><strong>24 hours from issuance</strong></div>
              <div className="cx7-ready-metric cx7-ready-changed"><small>On-chain status</small><strong>{onchainLabel(versionView.read.ok ? { ok: true, status: versionView.read.status, attestation: versionView.read.attestation } : versionView.read)}</strong></div>
              <div className="cx7-ready-metric"><small>Premise bound</small><strong>{auth.premiseCondition}</strong></div>
              <div className="cx7-ready-metric"><small>Authority balance</small><strong>{(auth.lamports / 1e9).toFixed(4)} SOL{auth.lamports < MIN_LAMPORTS ? ` · ${AWAITING_FUNDING}` : ""}</strong></div>
            </div>
          ) : (
            <p className="cx7-ready-note">{authority && !authority.ok ? `Read unavailable: ${authority.error}` : "Reading passport state on Solana Devnet…"}</p>
          )}
        </section>
      )}

      <p className="cx7-ready-kicker" style={{ marginTop: 24 }}>Authority timeline</p>
      <div className="cx7-ready-timeline">
        {timeline.map((label, i) => (
          <div className="cx7-ready-event" key={label}><time>{String(i + 1).padStart(2, "0")}</time><b>{label}</b></div>
        ))}
      </div>
      {isProofStep && !verified && funded && (
        <Button variant="ghost" className="cx7-ready-cta" disabled={issuing} onClick={runProof}>{issuing ? "Issuing on Solana Devnet…" : proof ? "Retry ↻" : "Issue Verifiable Proof →"}</Button>
      )}
      {verified && (
        <Button asChild variant="ghost" className="cx7-ready-cta"><a href={verified.explorerUrl} target="_blank" rel="noreferrer">View on Solana Explorer ↗</a></Button>
      )}
      <Button variant="ghost" className="cx7-ready-cta" onClick={() => setStep(last ? 0 : step + 1)}>{stage.cta}</Button>
      <p className="cx7-ready-note">REAL blocks are live reads (Pyth price, Solana Devnet state). DEMO steps are a front-end narrative; revocation, execution and issuance on-chain await Devnet funding.</p>
    </>
  );
}
