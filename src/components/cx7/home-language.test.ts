import { describe, expect, it } from "vitest";
import { homeLanguages } from "./home-panels";
import { homeV5 } from "./home-v5";

describe("Localized v5 evidence preservation", () => {
  it.each(["en", "pt-BR"] as const)("preserves the recorded passport, dates and statuses in %s", language => {
    const { passport, proof } = homeLanguages[language].panels;
    expect(passport.metrics.map(([, value]) => value).slice(0, 3)).toEqual(["v5 · VALID", "31/03/2027", "v4 · SUPERSEDED"]);
    expect(proof.metrics.map(([, value]) => value).slice(0, 3)).toEqual(["Solana Devnet", "FINALIZED", "MATCH"]);
  });
  it.each(["en", "pt-BR"] as const)("preserves the 5/8/10/12 percent results and exception requirement in %s", language => {
    const metrics = homeLanguages[language].panels.gate.metrics;
    expect(metrics.map(([label]) => Number.parseInt(label))).toEqual([5, 8, 10, 12]);
    expect(metrics.map(([, result]) => result)).toEqual(["AUTHORIZED", "BLOCKED", "AUTHORIZED", "BLOCKED"]);
    expect(homeV5.outcomes.map(({ exception }) => exception)).toEqual([false, false, true, false]);
  });
});