import { createFileRoute, Link } from "@tanstack/react-router";
import { Flow } from "@/components/cx7/Flow";
import { Btn } from "@/components/cx7/ui";
import { kpis, timeline } from "@/lib/cx7-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CX7 Decision Passport — Governed authority for AI" },
      { name: "description", content: "Time-bound, verifiable authority for autonomous systems. AI permissions expire when reality changes." },
      { property: "og:title", content: "CX7 Decision Passport" },
      { property: "og:description", content: "Governed authority for autonomous systems, proven on Solana." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="space-y-20">
      <section className="glass-gold relative overflow-hidden rounded-3xl px-6 py-20 text-center md:py-28">
        <div className="pointer-events-none absolute inset-x-0 top-0 hairline" />
        <p className="eyebrow">IA Innovation</p>
        <p className="mt-10 font-display text-6xl font-bold md:text-8xl text-gold-gradient">CX7</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-[0.3em] md:text-4xl">DECISION PASSPORT</h1>
        <p className="mx-auto mt-6 max-w-lg text-lg text-gold-soft">Governed authority for autonomous systems</p>
        <p className="mt-2 text-sm text-muted-foreground">AI permissions expire when reality changes.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Btn variant="gold" to="/demo">Run Demo Scenario</Btn>
          <Btn to="/passports">View Passports</Btn>
        </div>
      </section>

      <Flow />

      <section className="grid grid-cols-2 border-y lg:grid-cols-4">
        {kpis.map((k, i) => (
          <div key={k.label} className={`px-6 py-10 ${i > 0 ? "lg:border-l" : ""} ${i % 2 ? "border-l" : ""}`}>
            <p className="font-display text-5xl font-semibold md:text-6xl">{k.value}</p>
            <p className="eyebrow mt-3">{k.label}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="eyebrow">Authority Timeline</p>
          <h2 className="mt-3 text-3xl font-semibold">Authority is alive.</h2>
          <p className="mt-3 text-muted-foreground">Every permission is tied to its premises. When they change, execution stops until a human re-authorises.</p>
          <div className="mt-6"><Btn to="/timeline">Full timeline</Btn></div>
        </div>
        <ol className="relative space-y-5 border-l border-gold/20 pl-6">
          {timeline.map((e) => (
            <li key={e.t} className="relative">
              <span className="absolute -left-[29px] top-1.5 size-2.5 rounded-full bg-gold" />
              <span className="font-mono text-xs text-gold">{e.t}</span>
              <span className="ml-3 font-semibold">{e.label}</span>
            </li>
          ))}
        </ol>
      </section>

      <Link to="/demo" className="glass group flex flex-col items-start justify-between gap-6 rounded-3xl p-10 md:flex-row md:items-center">
        <div>
          <p className="eyebrow text-cyan">Run Live Scenario</p>
          <h2 className="mt-3 text-3xl font-semibold">Watch a premise break — and authority respond.</h2>
        </div>
        <span className="rounded-full border border-cyan/40 px-6 py-3 text-cyan transition-colors group-hover:bg-cyan/10">Start →</span>
      </Link>
    </div>
  );
}
