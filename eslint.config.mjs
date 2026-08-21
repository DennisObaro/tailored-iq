import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Raw drop of the landing-page project, kept for reference only. It is
    // TanStack Start source (server functions, lucide imports, ~50 unported
    // shadcn primitives) that this app neither builds nor resolves.
    "incoming-landing:/**",
  ]),
]);

export default eslintConfig;
