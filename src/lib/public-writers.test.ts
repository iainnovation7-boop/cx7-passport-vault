import { expect, it, vi } from "vitest";
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => ({ handler: (fn: () => unknown) => fn }) }));
import { issueVerifiableProof, revokePassportN1 } from "./solana-proof.functions";
it("public historical issuance fails closed without calling a signing path", async () => {
  const r = await issueVerifiableProof();
  expect(r.ok).toBe(false);
  if (r.ok) throw new Error("Unexpected issuance");
  expect(r.error).toContain("verified issuer authorization");
});
it("public historical revocation fails closed", async () => {
  const r = await revokePassportN1();
  expect(r.ok).toBe(false);
  if (r.ok) throw new Error("Unexpected revocation");
  expect(r.error).toContain("cannot be revoked");
});