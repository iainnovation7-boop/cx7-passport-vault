import { expect, it } from "vitest";
import { Route } from "./passports";
it("retires the illustrative passports experience without rendering a mock catalogue", () => {
  expect(Route.options.component).toBeUndefined();
  const guard = Route.options.beforeLoad;
  expect(guard).toBeTypeOf("function");
  try { (guard as () => void)(); throw new Error("Redirect missing"); } catch (e) {
    expect((e as { options: { to: string } }).options.to).toBe("/reconciliation");
  }
});
