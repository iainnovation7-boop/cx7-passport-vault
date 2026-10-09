import { createServerFn } from "@tanstack/react-start";

export const readV5Evidence = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { readHackathonV5 } = await import("./hackathon-v5.server");
    return { ok: true as const, data: await readHackathonV5() };
  } catch {
    return { ok: false as const, error: "UNAVAILABLE — the Devnet proof could not be independently read and verified. No transaction was executed." };
  }
});