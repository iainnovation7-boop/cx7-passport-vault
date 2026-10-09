import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/gate")({
  beforeLoad: () => { throw redirect({ to: "/", replace: true }); },
  head: () => ({ meta: [{ title: "CX7 Decision Passport — Gate retired" }, { name: "description", content: "This historical illustrative experience is retired. Only evidenced CX7 capabilities remain public." }, { property: "og:title", content: "CX7 Decision Passport — Gate retired" }, { property: "og:description", content: "Continue to CX7's current evidenced capabilities." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
});
