import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Route } from "./reconciliation";

vi.mock("@/lib/reconciliation-ai.functions", () => ({ aiDivergences: vi.fn() }));
afterEach(cleanup);

function setup() {
  const Page = Route.options.component;
  if (!Page) throw new Error("Reconciliation page missing");
  render(<Page />);
  fireEvent.change(screen.getByPlaceholderText("Process name"), { target: { value: "Discount approval" } });
  fireEvent.change(screen.getByPlaceholderText("Role / person 1"), { target: { value: "C" } });
  fireEvent.change(screen.getByPlaceholderText("Role / person 2"), { target: { value: "S" } });
}

describe("reconciliation participant interaction", () => {
  it("selects C and S and associates the editor with the selected participant", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "S" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Process version — S" }), { target: { value: "S approves up to 5%." } });
    fireEvent.click(screen.getByRole("button", { name: "C" }));
    expect(screen.getByRole("textbox", { name: "Process version — C" })).toHaveValue("");
    fireEvent.change(screen.getByRole("textbox", { name: "Process version — C" }), { target: { value: "C approves up to 10%." } });
    fireEvent.click(screen.getByRole("button", { name: "S" }));
    expect(screen.getByRole("textbox", { name: "Process version — S" })).toHaveValue("S approves up to 5%.");
    fireEvent.click(screen.getByRole("button", { name: "C" }));
    expect(screen.getByRole("textbox", { name: "Process version — C" })).toHaveValue("C approves up to 10%.");
  });

  it("enables sealing only after text and comparison only after two sealed independent versions", () => {
    setup();
    const seal = () => screen.getByRole("button", { name: "Seal this version" });
    const compare = screen.getByRole("button", { name: "Compare versions" });
    expect(seal()).toBeDisabled();
    expect(compare).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox", { name: "Process version — C" }), { target: { value: "   " } });
    expect(seal()).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox", { name: "Process version — C" }), { target: { value: "C approves 10%." } });
    expect(seal()).toBeEnabled();
    fireEvent.click(seal());
    expect(compare).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "S" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Process version — S" }), { target: { value: "S approves 5%." } });
    fireEvent.click(seal());
    expect(compare).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "C · sealed" }));
    expect(screen.queryByRole("textbox", { name: "Process version — C" })).not.toBeInTheDocument();
  });

  it("counts 0, 1, 2 and 3 sealed versions and resets to 0", () => {
    setup();
    const count = () => screen.getByRole("status", { name: "Sealed version count" });
    const compare = () => screen.getByRole("button", { name: "Compare versions" });
    expect(count()).toHaveTextContent(/^0 sealed version/);
    expect(compare()).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "+ Add role" }));
    fireEvent.change(screen.getByPlaceholderText("Role / person 3"), { target: { value: "Finance" } });
    ["C", "S", "Finance"].forEach((role, index) => {
      fireEvent.click(screen.getByRole("button", { name: role }));
      fireEvent.change(screen.getByRole("textbox", { name: `Process version — ${role}` }), { target: { value: `${role} approves 5%.` } });
      expect(count()).toHaveTextContent(new RegExp(`^${index} sealed version`));
      fireEvent.click(screen.getByRole("button", { name: "Seal this version" }));
      expect(count()).toHaveTextContent(new RegExp(`^${index + 1} sealed version`));
      if (index === 0) expect(compare()).toBeDisabled();
      else expect(compare()).toBeEnabled();
    });
    fireEvent.click(screen.getByRole("button", { name: "Reset session" }));
    expect(count()).toHaveTextContent(/^0 sealed version/);
    expect(compare()).toBeDisabled();
  });
});