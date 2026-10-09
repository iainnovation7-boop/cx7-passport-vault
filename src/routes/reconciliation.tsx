import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Btn, PageHeader, Status } from "@/components/cx7/ui";
import {
  buildAuthorityDraft, compareVersions, createPassportDraft, mergeDivergences, validationErrors,
  type Agreement, type Divergence, type HumanValidation, type ProcessDef, type ProcessVersion, type ReconciledAuthorityDraft,
} from "@/lib/reconciliation";
import { aiDivergences } from "@/lib/reconciliation-ai.functions";

export const Route = createFileRoute("/reconciliation")({
  head: () => ({
    meta: [
      { title: "Process Reconciliation — CX7" },
      { name: "description", content: "Compare how each role understands a process and turn validated rules into governed decision authority." },
      { property: "og:title", content: "Process Reconciliation — CX7" },
      { property: "og:description", content: "Detect conflicting rules, informal exceptions and hidden authority before they become decisions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});


const emptyV: HumanValidation = {
  validatorName: "", validatorRoleId: "", decisionType: "", validRule: "", validException: "", authorizedRole: "",
  allowedAction: "", premises: "", approvalLimit: "", validityPeriod: "", escalation: "", resolutions: {}, confirmed: false,
};
type S = {
  def: ProcessDef; drafts: Record<string, string>; versions: ProcessVersion[];
  agreements: Agreement[]; divergences: Divergence[] | null; v: HumanValidation;
  authority: ReconciledAuthorityDraft | null; passport: Awaited<ReturnType<typeof createPassportDraft>> | null;
};
const init: S = {
  def: { name: "", policy: "", roles: [{ id: "r1", label: "", isValidator: false }, { id: "r2", label: "", isValidator: false }] },
  drafts: {}, versions: [], agreements: [], divergences: null, v: emptyV, authority: null, passport: null,
};

const inp = "w-full rounded-lg border bg-background/40 px-3 py-2 text-sm outline-none focus:border-gold";
const Sec = ({ n, t, children }: { n: number; t: string; children: React.ReactNode }) => (
  <section className="mb-6 border-b pb-6">
    <p className="eyebrow mb-4">Step {n} · {t}</p>{children}
  </section>
);

function Page() {
  const [s, setS] = useState<S>(init);
  const [active, setActive] = useState("r1");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const up = (p: Partial<S>) => setS((x) => ({ ...x, ...p }));
  const upDef = (p: Partial<ProcessDef>) => up({ def: { ...s.def, ...p }, divergences: null, authority: null, passport: null });
  const upV = (p: Partial<HumanValidation>) => up({ v: { ...s.v, ...p }, authority: null, passport: null });
  const roles = s.def.roles.filter((r) => r.label.trim());
  const sealed = (id: string) => s.versions.find((v) => v.roleId === id);

  async function compare() {
    setMsg(null); setBusy(true);
    try {
      const c = compareVersions(s.def, s.versions);
      const label = (id: string) => s.def.roles.find((r) => r.id === id)?.label ?? id;
      const ai = await aiDivergences({ data: { name: s.def.name, policy: s.def.policy, versions: s.versions.map((v) => ({ role: label(v.roleId), text: v.text })) } });
      if (!ai.ok) setMsg(`AI analysis unavailable (${ai.error}) — showing rule-based findings only.`);
      up({ agreements: c.agreements, divergences: mergeDivergences(c.divergences, ai.divergences), v: { ...s.v, resolutions: {} }, authority: null, passport: null });
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  }

  const errs = s.divergences ? validationErrors(s.def, s.divergences, s.v) : [];

  return (
    <>
      <PageHeader step="00 · Origin" title="Process Reconciliation" sub="How each role really runs the process — reconciled by a human before it becomes authority.">
        <Btn onClick={() => { setS(init); setActive("r1"); setMsg(null); }}>Reset session</Btn>
      </PageHeader>
      <p className="mb-6 text-xs text-muted-foreground">Session only · Unsaved · Validator authorization unavailable</p>

      <Sec n={1} t="Define the process">
        <div className="grid gap-3 md:grid-cols-2">
          <input className={inp} aria-label="Process field" placeholder="Process name" value={s.def.name} onChange={(e) => upDef({ name: e.target.value })} />
          <input className={inp} aria-label="Process field" placeholder="Current known policy (optional)" value={s.def.policy} onChange={(e) => upDef({ policy: e.target.value })} />
        </div>
        <div className="mt-4 space-y-2">
          {s.def.roles.map((r, i) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3">
              <input className={`${inp} max-w-xs`} placeholder={`Role / person ${i + 1}`} value={r.label}
                onChange={(e) => upDef({ roles: s.def.roles.map((x) => x.id === r.id ? { ...x, label: e.target.value } : x) })} />

            </div>
          ))}
          <Btn onClick={() => upDef({ roles: [...s.def.roles, { id: `r${Date.now()}`, label: "", isValidator: false }] })}>+ Add role</Btn>
        </div>
      </Sec>

      <Sec n={2} t="Capture independent versions">
        <div className="mb-3 flex flex-wrap gap-2">
          {roles.map((r) => (
            <Btn key={r.id} type="button" pressed={active === r.id}
              className={`min-h-11 min-w-11 touch-manipulation ${active === r.id ? "border-gold bg-gold/10 text-gold ring-1 ring-gold/40" : ""}`}
              onClick={() => setActive(r.id)}>
              {r.label}{sealed(r.id) ? " · sealed" : ""}
            </Btn>
          ))}
        </div>
        {roles.some((r) => r.id === active) && (sealed(active) ? (
          <p className="text-sm text-muted-foreground">Version sealed at {sealed(active)?.sealedAt}. Stored separately in this session; participant identity is not verified.</p>
        ) : (
          <div className="space-y-3">
            <textarea key={active} aria-label={`Process version — ${roles.find((r) => r.id === active)?.label ?? ""}`} className={`${inp} min-h-28`} placeholder="Describe the process from first step to last, as you actually do it."
              value={s.drafts[active] ?? ""} onChange={(e) => up({ drafts: { ...s.drafts, [active]: e.target.value } })} />
            <Btn disabled={!s.drafts[active]?.trim()} onClick={() => {
              const { [active]: text, ...rest } = s.drafts;
              if (!text?.trim() || sealed(active)) return;
              up({ drafts: rest, versions: [...s.versions, { roleId: active, text, sealedAt: new Date().toISOString() }], divergences: null });
            }}>Seal this version</Btn>
          </div>
        ))}
      </Sec>

      <Sec n={3} t="Compare">
        <Btn variant="gold" disabled={busy || s.versions.length < 2 || !s.def.name.trim()} onClick={compare}>{busy ? "Analyzing…" : "Compare versions"}</Btn>
        <span className="ml-3 text-xs text-muted-foreground">{s.versions.length} sealed version(s) · minimum 2</span>
        {msg && <p className="mt-3 text-sm text-warning">{msg}</p>}
        {s.agreements.length > 0 && s.divergences && (
          <p className="mt-4 text-sm"><span className="eyebrow mr-2">Agreed</span>{s.agreements.map((a) => `${a.topic}: ${a.statement}`).join(" · ")}</p>
        )}
      </Sec>

      {s.divergences && (
        <Sec n={4} t="Reconciliation review">
          {s.divergences.length === 0 ? <p className="text-sm text-muted-foreground">No divergences detected.</p> : (
            <div className="space-y-4">
              {s.divergences.map((d) => (
                <div key={d.id} className="border-b py-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{d.topic}</span><Status value="PENDING REVIEW" />
                    <span className="font-mono text-[10px] uppercase text-muted-foreground">{d.origin === "ai" ? "AI-detected" : "rule-detected"}</span>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {d.statements.map((x, i) => (
                      <p key={i} className="text-sm"><span className="eyebrow mr-1">{String.fromCharCode(65 + i)} · {x.source}</span><br />{x.statement}</p>
                    ))}
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                    <p><b className="text-foreground">Why it matters:</b> {d.whyItMatters}</p>
                    <p><b className="text-foreground">Risk if unresolved:</b> {d.risk}</p>
                    <p><b className="text-gold-soft">Question:</b> {d.question}</p>
                  </div>
                  <input className={`${inp} mt-3`} placeholder="Human resolution (required)" value={s.v.resolutions[d.id] ?? ""}
                    onChange={(e) => upV({ resolutions: { ...s.v.resolutions, [d.id]: e.target.value } })} />
                </div>
              ))}
            </div>
          )}
        </Sec>
      )}

      {s.divergences && (
        <Sec n={5} t="Human validation">
          <div className="grid gap-3 md:grid-cols-2">
            <input className={inp} aria-label="Process field" placeholder="Validator name" value={s.v.validatorName} onChange={(e) => upV({ validatorName: e.target.value })} />
            <select className={inp} value={s.v.validatorRoleId} onChange={(e) => upV({ validatorRoleId: e.target.value })}>
              <option value="">Validator role…</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.label}{r.isValidator ? "" : " (not authorized)"}</option>)}
            </select>
            {([["decisionType", "Decision type"], ["validRule", "Valid rule"], ["validException", "Valid exception (or “none”)"], ["authorizedRole", "Authorized role / person"],
              ["allowedAction", "Allowed action"], ["premises", "Conditions / premises"], ["approvalLimit", "Approval limit"], ["validityPeriod", "Validity period (optional)"],
              ["escalation", "Requires escalation / review when…"]] as const).map(([k, l]) => (
              <input key={k} className={inp} placeholder={l} value={s.v[k]} onChange={(e) => upV({ [k]: e.target.value })} />
            ))}
          </div>
          <label className="mt-4 flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={s.v.confirmed} onChange={(e) => upV({ confirmed: e.target.checked })} />
            I have reviewed every proposed resolution. Authority remains unvalidated until a verified validator confirms it.
          </label>
          {errs.length > 0 && <ul className="mt-3 list-disc pl-5 text-xs text-warning">{errs.map((e) => <li key={e}>{e}</li>)}</ul>}
          <div className="mt-4"><Btn variant="gold" disabled={errs.length > 0} onClick={() => { if (!s.divergences) return; up({ authority: buildAuthorityDraft(s.def, s.versions, s.divergences, s.v) }); }}>Validate</Btn></div>
        </Sec>
      )}

      {s.authority && (
        <Sec n={6} t="Governed output — Reconciled Authority Draft">
          <pre className="overflow-x-auto rounded-lg border bg-background/40 p-4 font-mono text-xs">{JSON.stringify(s.authority, null, 2)}</pre>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Btn variant="gold" onClick={async () => { if (!s.authority) return; up({ passport: await createPassportDraft(s.authority) }); }}>Create Decision Passport Draft</Btn>
            <span className="text-xs text-muted-foreground">Creates a DRAFT only. Nothing is issued on-chain; existing issuance controls still apply.</span>
          </div>
          {s.passport && (
            <div className="mt-4 border-t border-gold/30 pt-4">
              <div className="mb-2 flex items-center gap-2"><Status value="PENDING" /><span className="font-mono text-xs">DRAFT · off-chain · hash {s.passport.draft_hash.slice(0, 16)}…</span></div>
              <pre className="overflow-x-auto font-mono text-xs">{JSON.stringify(s.passport.record, null, 2)}</pre>
            </div>
          )}
        </Sec>
      )}
    </>
  );
}
