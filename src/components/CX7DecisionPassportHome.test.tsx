import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CX7DecisionPassportHome from "./CX7DecisionPassportHome";

vi.mock("@tanstack/react-router", () => ({ Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a> }));

beforeEach(() => {
  window.localStorage.clear();
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) { this.setAttribute("open", ""); });
  HTMLDialogElement.prototype.close = vi.fn();
  HTMLDialogElement.prototype.scrollTo = vi.fn();
});
afterEach(cleanup);

describe("START v5 experience", () => {
  it("defaults to English and retains Portuguese preference without changing the active module or evidence", () => {
    const { unmount, container } = render(<CX7DecisionPassportHome />);
    expect(document.documentElement.lang).toBe("en");
    fireEvent.click(screen.getByRole("button", { name: "Open Solana Proof" }));
    const originalLinks = Array.from(container.querySelectorAll('dialog a')).map(link => link.getAttribute('href'));
    expect(originalLinks).toHaveLength(5);
    fireEvent.click(screen.getByRole("button", { name: "PT-BR" }));
    expect(document.documentElement.lang).toBe("pt-BR");
    expect(window.localStorage.getItem("cx7-home-language")).toBe("pt-BR");
    expect(container.querySelector('dialog')?.hasAttribute('open')).toBe(true);
    expect(Array.from(container.querySelectorAll('dialog a')).map(link => link.getAttribute('href'))).toEqual(originalLinks);
    unmount();
    render(<CX7DecisionPassportHome />);
    expect(document.documentElement.lang).toBe("pt-BR");
    fireEvent.click(screen.getByRole("button", { name: "EN" }));
    expect(document.documentElement.lang).toBe("en");
    expect(window.localStorage.getItem("cx7-home-language")).toBe("en");
  });

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