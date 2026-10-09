import { Btn } from "@/components/cx7/ui";
import mark from "@/assets/cx7-mark.png";
import { V5, V5_AUTHORITY_CHECKS } from "@/lib/hackathon-v5";
import { V5Proof, type V5Result } from "./cx7/V5Proof";
export default function CX7DecisionPassportHome({ evidence }: { evidence: V5Result }) {
  return <main className="mx-auto max-w-4xl px-5 py-8 md:py-12">
    <header className="pb-9">
      <div className="mb-6 flex items-center justify-between gap-4"><img src={mark} width={220} height={160} className="h-16 w-auto" alt="CX7 authority emblem" /><span className="font-mono text-xs text-muted-foreground">HACKATHON · DEVNET</span></div>
      <h1 className="text-3xl font-semibold text-gold sm:text-4xl">CX7 Decision Passport</h1>
      <p className="mt-4 max-w-2xl text-lg leading-7">Decision authority with externally verifiable evidence on Solana.</p>
      <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground">CX7 determines whether an action is authorized under the organization’s current decision rules.</p>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">When an authorized Decision Passport is issued, CX7 generates an evidence hash. That hash can be preserved through a Solana Devnet attestation and later read back from the network for comparison.</p>
    </header>
    <section className="border-t py-9">
      <p className="font-mono text-xs text-success">REAL VERIFIED CASE</p>
      <h2 className="mt-3 text-2xl">Discount Policy Reconciliation</h2>
      <dl className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3">
        <div><dt className="text-xs text-muted-foreground">Passport</dt><dd className="mt-2 text-xl">v5</dd></div>
        <div><dt className="text-xs text-muted-foreground">Recorded status</dt><dd className="mt-2 font-mono text-success">{evidence.ok ? evidence.data.snapshotStatus : "UNVERIFIED"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Valid until</dt><dd className="mt-2 text-sm">March 31, 2027</dd></div>
      </dl>
      <h3 className="mt-7 text-sm">Authority checks</h3>
      <p className="mt-2 text-xs leading-6 text-muted-foreground">Recorded CX7 v5 case outcomes supplied with this proof. No live engine call or decision is made by this page.</p>
      <ul className="mt-3 divide-y divide-border">{V5_AUTHORITY_CHECKS.map(check => <li key={check.discount} className="flex flex-col gap-2 py-4 text-sm sm:flex-row sm:items-center sm:justify-between"><span className="max-w-lg leading-6">{check.condition}</span><span className={check.outcome === "AUTHORIZED" ? "font-mono text-xs text-success" : "font-mono text-xs text-warning"}>{check.outcome}</span></li>)}</ul>
      <p className="mt-4 text-xs text-muted-foreground">Previous Passport: v4 — SUPERSEDED (CX7 case snapshot).</p>
    </section>
    <section className="border-t py-9">
      <h2 className="text-xl text-gold">CX7 EVIDENCE HASH</h2>
      <p className="mt-4 break-all font-mono text-sm leading-7">{V5.hash}</p>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">This hash was generated from the real CX7 Passport v5 evidence snapshot before the Solana attestation was issued.</p>
    </section>
    <V5Proof initial={evidence} />
    <section className="grid gap-7 border-t py-9 sm:grid-cols-2">
      <div><h2 className="text-base text-gold">WHAT CX7 DOES</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">CX7 determines whether an action is authorized under the organization’s current decision rules.</p></div>
      <div><h2 className="text-base text-gold">WHAT SOLANA DOES</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">Solana preserves the external cryptographic evidence associated with the issued Passport.</p></div>
      <p className="text-sm leading-7 sm:col-span-2">The blockchain evidence does not determine whether the business decision itself is correct. Decision authority remains a CX7 governance function.</p>
    </section>
    <section className="border-t py-9">
      <h2 className="text-xl text-gold">VERIFY IT YOURSELF</h2>
      <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-7 text-muted-foreground"><li>Open the Solana Devnet transaction.</li><li>Confirm that the transaction is finalized.</li><li>Open the attestation account.</li><li>Compare the evidence hash with the CX7 hash shown on this page.</li><li>Confirm that both hashes are identical.</li></ol>
    </section>
    <section className="border-t py-9">
      <h2 className="text-base text-gold">PRIVACY</h2>
      <p className="mt-3 text-xs leading-7 text-muted-foreground">No customer names, emails, organization identifiers, policy text or internal Passport IDs were written to Solana. The on-chain evidence contains pseudonymous identifiers, hashes, public cryptographic references, version, timestamps and status.</p>
    </section>
    <footer className="border-t pt-7">
      <Btn to="/reconciliation" className="min-h-11 shadow-none">Open session reconciliation →</Btn>
      <p className="mt-4 text-xs leading-6 text-muted-foreground">Session-only reconciliation creates an off-chain Draft, not the issued v5 case shown above.</p>
      <p className="mt-7 text-sm text-gold">Permission expires when reality changes.</p>
    </footer>
  </main>;
}
