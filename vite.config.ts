// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { fileURLToPath } from "node:url";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Published-runtime compatibility: route Node-only CommonJS deps of the Solana libs to bundled equivalents
  // so the server never needs createRequire at startup (which crashes the published runtime with HTTP 500).
  vite: {
    resolve: {
      alias: [
        // borsher (used by sas-lib) does require("buffer"), which the published runtime can only load via createRequire;
        // this verbatim copy points it at the bundled npm "buffer" package instead.
        { find: /^borsher$/, replacement: fileURLToPath(new URL("./src/lib/vendor/borsher/index.cjs", import.meta.url)) },
        { find: /^ws$/, replacement: fileURLToPath(new URL("./src/lib/ws-shim.ts", import.meta.url)) },
        { find: /^@solana\/kit$/, replacement: fileURLToPath(new URL("./node_modules/@solana/kit/dist/index.node.mjs", import.meta.url)) },
      ],
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
