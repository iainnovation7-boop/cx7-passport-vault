import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { Route } from "./platforms";

afterEach(cleanup);
it("does not offer a nonexistent platform connection", () => {
  const Page = Route.options.component;
  if (!Page) throw new Error("Platform page missing");
  render(<Page />);
  expect(screen.getByRole("button", { name: "Connect Platform" })).toBeDisabled();
});