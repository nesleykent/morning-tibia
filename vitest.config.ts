import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
    // Pin the runtime's own timezone. Several fixtures format an instant into an explicit
    // zone ("America/Sao_Paulo") or into the viewer's local calendar, so a suite that
    // inherits the developer's timezone passes in São Paulo and fails on a UTC runner,
    // which is exactly how a green local run once shipped a red deploy. Pinning makes a
    // local run reproduce CI rather than disagree with it silently.
    env: { TZ: "UTC" },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "server-only": path.resolve(__dirname, "lib/testing/serverOnlyStub.ts"),
    },
  },
});
