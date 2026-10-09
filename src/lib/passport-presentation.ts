/** Static catalogue presentation only; never used for issuance or on-chain verification. */
export function catalogueStatus(status: string, until: string, now: number | null): string {
  if (status !== "VALID") return status;
  const expiry = Date.parse(until.replace(" ", "T"));
  if (now === null || !Number.isFinite(expiry)) return "VALIDITY NOT CHECKED";
  return expiry <= now ? "EXPIRED" : status;
}