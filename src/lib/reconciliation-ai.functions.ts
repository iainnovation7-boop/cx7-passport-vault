import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Fail closed until secure AI access is provisioned. No participant content leaves this function.
export const aiDivergences = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({
    name: z.string().min(1).max(200),
    policy: z.string().max(4000),
    versions: z.array(z.object({ role: z.string().min(1).max(120), text: z.string().min(1).max(6000) })).min(2).max(8),
  }).parse(data))
  .handler(async () => ({
    ok: false as const,
    error: "AI comparison requires secure Lovable Cloud configuration. No content was sent to AI.",
    divergences: [] as import("./reconciliation").Divergence[],
  }));
