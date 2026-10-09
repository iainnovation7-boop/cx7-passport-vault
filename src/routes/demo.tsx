import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Btn, PageHeader, Status } from "@/components/cx7/ui";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Run Live Scenario — CX7" },
      { name: "description", content: "Watch a decision passport react to a changed premise, end to end." },
      { property: "og:title", content: "Run Live Scenario — CX7" },
      { property: "og:description", content: "Passport issued, premise changed, execution blocked, proof verified." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const steps = [
  { label: "Valid passport issued", detail: "DP-7E94 · Supplier payment up to $480,000", status: "VALID" },
  { label: "Initial premises", detail: "Supplier rating A · Budget available · FX < 5.40", status: "VALID" },
  { label: "Premise changes", detail: "Supplier rating downgraded A → BB", status: "PREMISE CHANGED" },
  { label: "Passport flagged", detail: "Authority no longer matches reality", status: "PREMISE CHANGED" },
  { label: "Agent attempts execution", detail: "Pay supplier #4471 · $410,000", status: "PENDING REVIEW" },
  { label: "Execution blocked", detail: "Gate denies action at 14:07:03", status: "BLOCKED" },
  { label: "Human review", detail: "A. Silva reviews revised conditions", status: "UNDER REVIEW" },
  { label: "New passport issued", detail: "DP-7F21 · Limit $250,000 · escrow required", status: "VALID" },
  { label: "Proof verified on Solana", detail: "Signature 5xKq…9vTn anchored", status: "VERIFIED" },
];

function Page() {
  const [step, setStep] = useState(-1);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (step >= steps.length - 1) { setRunning(false); return; }
    const t = setTimeout(() => setStep((s) => s + 1), 1100);
    return () => clearTimeout(t);
  }, [running, step]);

  const start = () => { setStep(0); setRunning(true); };
  const current = step >= 0 ? steps[step] : null;

  return (
    <>
      <PageHeader step="Live Scenario" title="Run Live Scenario" sub="Nine seconds. One broken premise. Authority that responds.">
        <Btn variant="gold" onClick={start} disabled={running}>{running ? "Running…" : step >= 0 ? "Replay Scenario" : "Run Demo Scenario"}</Btn>
      </PageHeader>
      <p className="mb-6 text-xs text-muted-foreground">Controlled demonstration · Illustrative events and signatures · No on-chain verification or business execution</p>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="glass-gold flex min-h-[320px] flex-col justify-between rounded-3xl p-10">
          <p className="eyebrow">Current state</p>
          {current ? (
            <div key={step} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <p className="font-mono text-sm text-gold">Step {String(step + 1).padStart(2, "0")} / {steps.length}</p>
              <h2 className="mt-3 text-4xl font-semibold">{current.label}</h2>
              <p className="mt-3 text-muted-foreground">{current.detail}</p>
              <div className="mt-6"><Status value={current.status} /></div>
            </div>
          ) : (
            <p className="text-2xl text-muted-foreground">Press <span className="text-gold">Run Demo Scenario</span> to begin.</p>
          )}
          <div className="mt-8 h-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-gold-gradient transition-all duration-700" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>
        </div>

        <ol className="space-y-2">
          {steps.map((s, i) => (
            <li key={s.label} className={`flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-500 ${i === step ? "glass border-gold/40" : i < step ? "opacity-70" : "opacity-30"}`}>
              <span className={`grid size-7 shrink-0 place-items-center rounded-full font-mono text-[11px] ${i <= step ? "bg-gold-gradient text-primary-foreground" : "border"}`}>{i + 1}</span>
              <span className="flex-1 text-sm font-medium">{s.label}</span>
              {i <= step && <Status value={s.status} />}
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
