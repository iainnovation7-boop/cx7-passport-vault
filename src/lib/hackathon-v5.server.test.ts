import { beforeEach, describe, expect, it, vi } from "vitest";
import { V5 } from "./hackathon-v5";

const mocks = vi.hoisted(() => ({ genesis: vi.fn(), tx: vi.fn(), statuses: vi.fn(), attestation: vi.fn(), schema: vi.fn(), credential: vi.fn(), decode: vi.fn() }));
vi.mock("@solana/kit", () => ({ address: (v: string) => v, signature: (v: string) => v, createSolanaRpc: () => ({ getGenesisHash: () => ({ send: mocks.genesis }), getTransaction: () => ({ send: mocks.tx }), getSignatureStatuses: () => ({ send: mocks.statuses }) }) }));
vi.mock("sas-lib", () => ({ SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS: "sas", fetchMaybeAttestation: mocks.attestation, fetchMaybeSchema: mocks.schema, fetchMaybeCredential: mocks.credential, deserializeAttestationData: mocks.decode }));
import { readHackathonV5 } from "./hackathon-v5.server";

beforeEach(() => {
  vi.stubEnv("SOLANA_RPC_URL", "https://invalid.test/read-only");
  mocks.genesis.mockResolvedValue("EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG");
  mocks.tx.mockResolvedValue({ meta: { err: null }, transaction: { message: { accountKeys: [V5.authority, V5.attestation, V5.credential, V5.schema, "sas"] } } });
  mocks.statuses.mockResolvedValue({ value: [{ err: null, confirmationStatus: "finalized" }] });
  mocks.attestation.mockResolvedValue({ exists: true, programAddress: "sas", data: { signer: V5.authority, credential: V5.credential, schema: V5.schema, expiry: BigInt(V5.expiry), data: [] } });
  mocks.schema.mockResolvedValue({ exists: true, programAddress: "sas", data: { credential: V5.credential, name: new TextEncoder().encode("CX7_DECISION_PASSPORT_V2") } });
  mocks.credential.mockResolvedValue({ exists: true, programAddress: "sas", data: { authority: V5.authority, authorizedSigners: [V5.authority] } });
  mocks.decode.mockReturnValue({ protocol_version: 1, passport_version: 5, authority: V5.authority, valid_until: BigInt(V5.expiry), status: "VALID", decision_hash: V5.hash, passport_id: "private-id", policy_text: "private-text" });
});
describe("read-only v5 verification", () => {
  it("publishes only allowlisted metadata after a real-read shaped match", async () => {
    const result = await readHackathonV5();
    expect(result.match).toBe(true);
    expect(result.transactionStatus).toBe("FINALIZED");
    expect(JSON.stringify(result)).not.toContain("private-id");
    expect(JSON.stringify(result)).not.toContain("private-text");
  });
  it("rejects any non-Devnet network", async () => {
    mocks.genesis.mockResolvedValue("mainnet");
    await expect(readHackathonV5()).rejects.toThrow("Wrong network");
  });
  it("never treats an absent account as evidence", async () => {
    mocks.attestation.mockResolvedValue({ exists: false });
    await expect(readHackathonV5()).rejects.toThrow("Unverified references");
  });
  it("rejects an unfinalized transaction", async () => {
    mocks.statuses.mockResolvedValue({ value: [{ err: null, confirmationStatus: "confirmed" }] });
    await expect(readHackathonV5()).rejects.toThrow("Unverified references");
  });
});