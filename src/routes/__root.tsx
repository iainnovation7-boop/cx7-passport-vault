import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-gold-gradient text-7xl font-bold">404</h1>
        <p className="mt-4 text-muted-foreground">This authority path does not exist.</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-gold-gradient px-5 py-2 text-sm font-semibold text-primary-foreground">Go home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong. Try again or head home.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-full bg-gold-gradient px-4 py-2 text-sm font-semibold text-primary-foreground">Try again</button>
          <a href="/" className="rounded-full border px-4 py-2 text-sm">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CX7 Decision Passport" },
      { name: "description", content: "Governed authority for autonomous systems." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Manrope:wght@400;500;600&family=Sora:wght@400;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

const nav = [
  { to: "/reconciliation", label: "Reconciliation" },
  { to: "/evidence", label: "Evidence" },
  { to: "/premise", label: "Pyth" },
] as const;

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const isHome = useRouterState({ select: (state) => state.location.pathname === "/" });
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen">
        <header className={isHome ? "hidden" : "sticky top-0 z-30 border-b bg-background/70 backdrop-blur-xl"}>
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
            <Link to="/" className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-md bg-gold-gradient font-display text-xs font-bold text-primary-foreground">CX7</span>
              <span className="eyebrow hidden sm:inline">IA Innovation</span>
            </Link>
            <nav className="flex min-w-0 items-center gap-1 overflow-x-auto text-sm">
              {nav.map((n) => (
                <Link key={n.to} to={n.to} className="inline-flex min-h-11 shrink-0 items-center rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-gold" }}>
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <div className={isHome ? "" : "mx-auto max-w-7xl px-5 py-12"}>
          <Outlet />
        </div>
        <footer className={isHome ? "hidden" : "mx-auto max-w-7xl px-5 pb-10"}>
          <div className="hairline mb-6" />
          <p className="eyebrow text-center">Permission expires when reality changes.</p>
        </footer>
      </div>
    </QueryClientProvider>
  );
}
