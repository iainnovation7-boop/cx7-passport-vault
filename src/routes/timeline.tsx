import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/timeline")({
  beforeLoad: () => { throw redirect({ to: "/evidence", replace: true }); },
  head: () => ({ meta: [{ title: "CX7 Decision Passport — Timeline retired" }, { name: "description", content: "This historical illustrative experience is retired. Only evidenced CX7 capabilities remain public." }, { property: "og:title", content: "CX7 Decision Passport — Timeline retired" }, { property: "og:description", content: "Continue to CX7's current evidenced capabilities." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
});
