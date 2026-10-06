import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const versionSchema = z.object({
  protocol_version: z.number().int(),
  lineage_id: z.string().min(1).max(128),
  version: z.number().int().min(1),
  decision_hash: z.string().regex(/^[0-9a-f]{64}$/),
  previous_version_id: z.string().nullable(),
  previous_decision_hash: z.string().nullable(),
});

/** E1 — read-only on-chain verification (no transaction). */
export const verifyPassport = createServerFn({ method: "POST" })
  .inputValidator((d) => versionSchema.parse(d))
  .handler(async ({ data }) => {
    try {
      const { verifyPassportVersion } = await import("./passport-verify.server");
      return { ok: true as const, ...(await verifyPassportVersion(data)) };
    } catch (e) {
      return { ok: false as const, error: (e instanceof Error ? e.message : String(e)).slice(0, 300) };
    }
  });

/** E3 — real SOL/USD premise from Pyth on Solana Devnet (read-only). */
export const readPremise = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ op: z.enum([">=", "<="]), threshold: z.number().positive(), maxAgeSec: z.number().int().min(10).max(86400).default(300) }).parse(d))
  .handler(async ({ data }) => {
    try {
      const { readSolUsdPremise } = await import("./pyth-premise.server");
      return { ok: true as const, reading: await readSolUsdPremise(data) };
    } catch (e) {
      return { ok: false as const, error: (e instanceof Error ? e.message : String(e)).slice(0, 300) };
    }
  });
