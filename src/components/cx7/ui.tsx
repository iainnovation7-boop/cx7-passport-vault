import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tone: Record<string, string> = {
  VALID: "text-success border-success/40 bg-success/10",
  APPROVED: "text-success border-success/40 bg-success/10",
  VERIFIED: "text-success border-success/40 bg-success/10",
  Connected: "text-success border-success/40 bg-success/10",
  "PREMISE CHANGED": "text-warning border-warning/40 bg-warning/10",
  "UNDER REVIEW": "text-cyan border-cyan/40 bg-cyan/10",
  "PENDING REVIEW": "text-cyan border-cyan/40 bg-cyan/10",
  PENDING: "text-cyan border-cyan/40 bg-cyan/10",
  Pending: "text-cyan border-cyan/40 bg-cyan/10",
  Degraded: "text-warning border-warning/40 bg-warning/10",
  SUSPENDED: "text-danger border-danger/40 bg-danger/10",
  BLOCKED: "text-danger border-danger/40 bg-danger/10",
  FAILED: "text-danger border-danger/40 bg-danger/10",
  SUPERSEDED: "text-muted-foreground border-border bg-muted/40",
  EXPIRED: "text-muted-foreground border-border bg-muted/40",
};

export function Status({ value }: { value: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 font-mono text-[10px] tracking-widest uppercase", tone[value] ?? tone["EXPIRED"])}>
      <span className="size-1.5 rounded-full bg-current" />
      {value}
    </span>
  );
}

export function Btn({ children, variant = "ghost", onClick, to, disabled }: { children: ReactNode; variant?: "gold" | "ghost"; onClick?: () => void; to?: string; disabled?: boolean }) {
  const cls = cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-40",
    variant === "gold"
      ? "bg-gold-gradient text-primary-foreground hover:brightness-110 shadow-[var(--shadow-glow)]"
      : "border border-gold/30 text-gold-soft hover:border-gold hover:bg-gold/10",
  );
  if (to) return <Link to={to} className={cls}>{children}</Link>;
  return <button className={cls} onClick={onClick} disabled={disabled}>{children}</button>;
}

export function PageHeader({ step, title, sub, children }: { step: string; title: string; sub: string; children?: ReactNode }) {
  return (
    <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="eyebrow">{step}</p>
        <h1 className="mt-3 text-4xl font-semibold md:text-5xl">{title}</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">{sub}</p>
      </div>
      {children && <div className="flex flex-wrap gap-3">{children}</div>}
    </header>
  );
}

export function DataTable({ cols, rows }: { cols: string[]; rows: ReactNode[][] }) {
  return (
    <div className="glass overflow-x-auto rounded-2xl">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b">
            {cols.map((c) => <th key={c} className="eyebrow px-5 py-4 text-left font-normal">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b last:border-0 transition-colors hover:bg-gold/5">
              {r.map((cell, j) => <td key={j} className="px-5 py-4">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const Mono = ({ children }: { children: ReactNode }) => <span className="font-mono text-gold-soft">{children}</span>;
