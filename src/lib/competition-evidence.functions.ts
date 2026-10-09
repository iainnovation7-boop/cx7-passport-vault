import { createServerFn } from "@tanstack/react-start";

export const readReferenceEvidence = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { readCompetitionEvidence } = await import("./competition-evidence.server");
    return { ok: true as const, data: await readCompetitionEvidence() };
  } catch {
    return { ok: false as const, error: "UNAVAILABLE — Devnet evidence could not be read or verified. No transaction was executed." };
  }
});
export const readPythEvidence = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { readCompetitionPyth } = await import("./competition-evidence.server");
    return { ok: true as const, data: await readCompetitionPyth() };
  } catch {
    return { ok: false as const, error: "UNAVAILABLE — Pyth data could not be read from Solana Devnet. No result is asserted." };
  }
});