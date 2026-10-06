import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/cx7/ui";
import { timeline } from "@/lib/cx7-data";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "Authority Timeline — CX7" },
      { name: "description", content: "How authority changes as reality changes, event by event." },
      { property: "og:title", content: "Authority Timeline — CX7" },
      { property: "og:description", content: "A live record of passports, premises, blocks and proofs." },
    ],
  }),
  component: Page,
});

const dot: Record<string, string> = { gold: "bg-gold", warning: "bg-warning", danger: "bg-danger", cyan: "bg-cyan", success: "bg-success" };

function Page() {
  return (
    <>
      <PageHeader step="Live record" title="Authority Timeline" sub="Authority is not static. It follows reality." />
      <ol className="relative mx-auto max-w-3xl border-l border-gold/20">
        {timeline.map((e) => (
          <li key={e.t} className="relative pb-10 pl-10 last:pb-0">
            <span className={`absolute -left-[7px] top-2 size-3.5 rounded-full ring-4 ring-background ${dot[e.tone]}`} />
            <p className="font-mono text-sm text-gold">{e.t}</p>
            <h3 className="mt-1 text-2xl font-semibold">{e.label}</h3>
            <p className="mt-1 text-muted-foreground">{e.detail}</p>
          </li>
        ))}
      </ol>
    </>
  );
}
