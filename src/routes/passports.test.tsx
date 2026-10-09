import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Route } from "./passports";
import { passports } from "@/lib/cx7-data";

afterEach(cleanup);

describe("public catalogue operations", () => {
  it("does not allow issuance or review for illustrative catalogue records", () => {
    const Page = Route.options.component;
    if (!Page) throw new Error("Passport page missing");
    render(<Page />);
    expect(screen.getByRole("button", { name: "Issue New Passport" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Review Decision" })).toBeDisabled();
  });
  it("opens each existing passport with its own supplied details", () => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    const Page = Route.options.component;
    if (!Page) throw new Error("Passport page missing");
    const { container } = render(<Page />);
    for (const passport of passports) {
      fireEvent.click(screen.getByRole("button", { name: `View Passport ${passport.id}` }));
      const details = container.querySelector(".glass-gold");
      expect(details).toHaveTextContent(passport.id);
      expect(details).toHaveTextContent(passport.owner);
      expect(details).toHaveTextContent(passport.limit);
      expect(details).toHaveTextContent(passport.until);
    }
    vi.restoreAllMocks();
  });
});