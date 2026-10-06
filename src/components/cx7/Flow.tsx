import { Link } from "@tanstack/react-router";
import { Fragment } from "react";

const nodes = [
  { to: "/platforms", n: "01", title: "Your Platform", sub: "AI Agent · ERP · CRM" },
  { to: "/passports", n: "02", title: "Decision Passport", sub: "Time-bound authority" },
  { to: "/gate", n: "03", title: "Execution Gate", sub: "Allow · Block · Review" },
  { to: "/proofs", n: "04", title: "Solana Proof", sub: "Verifiable record" },
] as const;

export function Flow() {
  return (
    <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center lg:gap-0">
      {nodes.map((n, i) => (
        <Fragment key={n.to}>
          <Link
            to={n.to}
            className={`group relative flex-1 rounded-2xl p-6 transition-all hover:-translate-y-1 ${i === 1 ? "glass-gold" : "glass hover:border-gold/40"}`}
          >
            <span className="font-mono text-xs text-gold">{n.n}</span>
            <h3 className="mt-4 text-lg font-semibold">{n.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{n.sub}</p>
            <span className="absolute right-5 top-5 text-gold/0 transition-colors group-hover:text-gold">→</span>
          </Link>
          {i < nodes.length - 1 && (
            <div className="relative mx-auto h-8 w-px bg-border lg:mx-0 lg:h-px lg:w-10">
              <div className="flow-line absolute inset-0 hidden lg:block" />
              <span className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan shadow-cyan" />
            </div>
          )}
        </Fragment>
      ))}
    </div>
  );
}
