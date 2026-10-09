import { describe, expect, it } from "vitest";
import { catalogueStatus } from "./passport-presentation";

describe("static catalogue validity display", () => {
  it("does not show VALID for the observed expired DP-7F21 date", () => {
    expect(catalogueStatus("VALID", "2026-10-06 18:00", Date.parse("2026-10-09T03:58:00Z"))).toBe("EXPIRED");
  });
  it("keeps a valid record before its existing expiry and expires at the boundary", () => {
    const expiry = Date.parse("2026-10-06T18:00");
    expect(catalogueStatus("VALID", "2026-10-06 18:00", expiry - 1)).toBe("VALID");
    expect(catalogueStatus("VALID", "2026-10-06 18:00", expiry)).toBe("EXPIRED");
  });
  it("preserves suspended and superseded states", () => {
    expect(catalogueStatus("SUSPENDED", "2026-10-05 17:00", Date.parse("2026-10-09T03:58:00Z"))).toBe("SUSPENDED");
    expect(catalogueStatus("SUPERSEDED", "2026-10-05 12:00", Date.parse("2026-10-09T03:58:00Z"))).toBe("SUPERSEDED");
  });
  it("does not claim validity before checking the clock or an unreadable date", () => {
    expect(catalogueStatus("VALID", "2026-10-06 18:00", null)).toBe("VALIDITY NOT CHECKED");
    expect(catalogueStatus("VALID", "unknown", 1)).toBe("VALIDITY NOT CHECKED");
  });
});