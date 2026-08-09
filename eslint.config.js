import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import html from "@html-eslint/eslint-plugin";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"], plugins: { js }, extends: ["js/recommended"], languageOptions: {
      globals:
        globals.browser
    }
  },
  {
    files: ["**/*.js", "**/*.ts"],
    plugins: {
      html,
    },
    extends: ["html/recommended"],
    rules: {
      "html/use-baseline": ["error", {
        "available": 2020
      }]
    }
  },
  js.configs.recommended,
]);
