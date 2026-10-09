import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CX7DecisionPassportHome from "./CX7DecisionPassportHome";

vi.mock("@tanstack/react-router", () => ({ Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a> }));

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) { this.setAttribute("open", ""); });
  HTMLDialogElement.prototype.close = vi.fn();
  HTMLDialogElement.prototype.scrollTo = vi.fn();
});
afterEach(cleanup);

describe("START v5 experience", () => {
  it("opens the four existing modules in order with supplied v5 evidence", () => {
    render(<CX7DecisionPassportHome />);
    fireEvent.click(screen.getByRole("button", { name: "START" }));
    expect(screen.getByRole("heading", { name: "Discount Policy Reconciliation." })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Decision Passport →" }));
    expect(screen.getByText("v5 · VALID")).toBeInTheDocument();
    expect(screen.getByText("31/03/2027")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Execution Gate →" }));
    expect(screen.getByRole("heading", { name: "Authority / Execution." })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Solana Proof →" }));
    expect(screen.getByText("FINALIZED")).toBeInTheDocument();
    expect(screen.getByText("MATCH")).toBeInTheDocument();
    const closeButton = screen.getAllByRole("button", { name: "Close" }).at(-1);
    if (!closeButton) throw new Error("Final module must have a close control");
    fireEvent.click(closeButton);
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalledOnce();
  });
});