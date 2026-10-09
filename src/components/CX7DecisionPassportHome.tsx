import { Btn } from "@/components/cx7/ui";
import mark from "@/assets/cx7-mark.png";
export default function CX7DecisionPassportHome() {
  return <main className="mx-auto max-w-4xl px-5 py-12 md:py-20">
    <img src={mark} width={220} height={160} className="mb-6 h-24 w-auto" alt="CX7 authority emblem" />
    <h1 className="text-4xl font-semibold text-gold md:text-5xl">CX7 Decision Passport</h1>
    <p className="mt-4 text-sm text-muted-foreground">Powered by the CX7 Decision Authority Engine</p>
    <p className="mt-8 max-w-2xl text-xl leading-relaxed">AI can execute. CX7 determines whether execution is still authorized.</p>
    <nav aria-label="Home capabilities" className="mt-10 flex flex-col items-start gap-4">
      <Btn variant="gold" to="/reconciliation">START RECONCILIATION →</Btn>
      <Btn to="/evidence">VIEW REAL ON-CHAIN EVIDENCE →</Btn>
      <Btn to="/premise">LIVE PREMISE — PYTH →</Btn>
    </nav>
    <div className="mt-12 border-t pt-6 text-sm leading-relaxed text-muted-foreground">
      <p>Session-scoped reconciliation. On-chain proof is persistent.</p>
      <p className="mt-3">Permission expires when reality changes.</p>
    </div>
  </main>;
}
