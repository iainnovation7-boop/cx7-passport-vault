import { hashPassport, scenarioPassports, toHex } from "./passport-hash";
import { firstVersion, successorOf, versionId } from "./passport-version";
import { solUsdPremise } from "./schema-v2";
import type { PremiseCondition } from "./pyth-premise";

/** Premise the scenario passports depend on (configurable; evaluated against the real Pyth price). */
export const SCENARIO_PREMISE: PremiseCondition = { op: ">=", threshold: 100, maxAgeSec: 300 };

async function hmacHex(key: string, message: string) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(message)));
}

/** N1 (original authority) and N2 (reapproved successor) of the Live Scenario lineage. */
export async function scenarioVersions() {
  const key = process.env["CX7_PSEUDONYMIZATION_KEY"];
  if (!key) throw new Error("CX7_PSEUDONYMIZATION_KEY is not configured");
  const lineage = await hmacHex(key, `lineage|${scenarioPassports.previous.organization_id}|CX7-PP`);
  const { authority_state: _a, ...prevBusiness } = scenarioPassports.previous;
  const { authority_state: _b, ...currBusiness } = scenarioPassports.current;
  const n1 = firstVersion(lineage, await hashPassport(prevBusiness));
  const n2 = await successorOf(n1, await hashPassport(currBusiness));
  return { n1, n2, n1Id: await versionId(n1), n2Id: await versionId(n2), premise: solUsdPremise(SCENARIO_PREMISE) };
}
