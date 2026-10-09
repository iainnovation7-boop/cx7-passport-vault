import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// AI assists detection only. It cannot resolve, choose a correct version, or create a passport.
const Input = z.object({
  name: z.string().max(200),
  policy: z.string().max(4000),
  versions: z.array(z.object({ role: z.string().max(120), text: z.string().max(6000) })).min(2).max(8),
});

const item = {
  type: "object",
  additionalProperties: false,
  required: ["topic", "category", "statements", "whyItMatters", "risk", "question"],
  properties: {
    topic: { type: "string" },
    category: { type: "string", enum: ["conflicting_rule", "approval_limit", "informal_exception", "informal_authority", "missing_owner", "asymmetric_knowledge", "clarification"] },
    statements: { type: "array", items: { type: "object", additionalProperties: false, required: ["source", "statement"], properties: { source: { type: "string" }, statement: { type: "string" } } } },
    whyItMatters: { type: "string" },
    risk: { type: "string" },
    question: { type: "string" },
  },
};
const schema = { type: "object", additionalProperties: false, required: ["divergences"], properties: { divergences: { type: "array", items: item } } };

export const aiDivergences = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { ok: false as const, error: "AI is not configured.", divergences: [] };
    const prompt = [
      `Process: ${data.name}`,
      `Official policy: ${data.policy || "(none)"}`,
      ...data.versions.map((v) => `Version by ${v.role}:\n${v.text}`),
    ].join("\n\n");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, Authorization: `Bearer ${key}`, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions:
          "You compare independent descriptions of the same business process. List only real divergences: conflicting rules, different approval limits, informal exceptions, authority exercised outside the formal system, missing steps/owners, knowledge held by one role only, points needing clarification. Quote each source faithfully. NEVER decide which version is correct and never propose a final rule; end each item with a neutral question for a human validator. Max 6 items. Return [] if none.",
        input: prompt,
        text: { format: { type: "json_schema", name: "divergences", strict: true, schema } },
      }),
    });
    if (!res.ok || !res.body) {
      const msg = res.status === 402 ? "AI credits exhausted." : res.status === 429 ? "AI rate limited, try again later." : `AI request failed (${res.status}).`;
      return { ok: false as const, error: msg, divergences: [] };
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", out = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const l of lines) {
        if (!l.startsWith("data:")) continue;
        try {
          const ev = JSON.parse(l.slice(5).trim());
          if (ev.type === "response.output_text.delta") out += ev.delta;
        } catch { /* ignore keep-alives */ }
      }
    }
    try {
      return { ok: true as const, error: null, divergences: JSON.parse(out).divergences as never[] };
    } catch {
      return { ok: false as const, error: "AI returned no usable result.", divergences: [] };
    }
  });
