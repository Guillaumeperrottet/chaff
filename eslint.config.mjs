import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // ta config Next.js existante
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // override pour src/lib/prisma.ts
  {
    files: ["src/lib/prisma.ts"],
    rules: {
      "no-var": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
];

export default eslintConfig;
