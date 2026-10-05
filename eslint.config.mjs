import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Product and brand images are local files of unknown size; plain <img>
      // with lazy loading is intentional.
      "@next/next/no-img-element": "off",
      // Existing API-response mappers still use `any`; flagged, not blocking.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default config;
