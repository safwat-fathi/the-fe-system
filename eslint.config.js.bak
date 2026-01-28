const { FlatCompat } = require("@eslint/eslintrc");
const securityPlugin = require("eslint-plugin-security");
const sonarjsPlugin = require("eslint-plugin-sonarjs");
const eslintrc = require("./.eslintrc.json");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: false,
  allConfig: false,
});

const jsTsFilesGlob = ["**/*.{js,jsx,ts,tsx}"];

const pickRulesConfig = (config) => ({
  name: config.name,
  rules: config.rules,
});

module.exports = [
  ...compat
    .config({
      ...eslintrc,
      parser: require.resolve("@typescript-eslint/parser"),
    })
    .map((c) => ({
      ...c,
      files: jsTsFilesGlob,
    })),
  {
    ...pickRulesConfig(securityPlugin.configs.recommended),
    files: jsTsFilesGlob,
  },
  {
    ...pickRulesConfig(sonarjsPlugin.configs.recommended),
    files: jsTsFilesGlob,
  },
  {
    ignores: [
      ".now/*",
      "*.css",
      ".changeset",
      "dist",
      "esm/*",
      "public/*",
      "tests/*",
      "scripts/*",
      "*.config.js",
      ".DS_Store",
      "node_modules",
      "coverage",
      ".next",
      "build",
    ],
  },
];
