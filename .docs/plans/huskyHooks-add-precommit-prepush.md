# Husky + lint-staged Integration Plan

## Current Context Summary

- Repo uses ESLint (flat config wrapper for `.eslintrc.json`), Prettier, and scripts like `lint`, `lint:silent`, `type-check`, and `format` but no Husky or lint-staged automation.
- Security-focused ESLint plugins (`eslint-plugin-security`, `eslint-plugin-sonarjs`) are not installed or referenced yet.
- Git hooks are not configured, so lint/build safeguards rely on manual execution.

## Proposed Plan

1. **Add Tooling Dependencies**  
   Install `husky`, `lint-staged`, `eslint-plugin-security`, and `eslint-plugin-sonarjs` as dev dependencies to support the requested workflow and lint rules.
2. **Wire Husky Setup Script**  
   Add a `prepare` script (`husky`) in `package.json` so hooks are installed automatically after dependency installs.
3. **Configure lint-staged**  
   Define a `lint-staged` block (JSON in `package.json` or separate config) targeting JS/TS/JSON styles to run ESLint with `--fix` and Prettier where appropriate.
4. **Extend ESLint Config**  
   Register the Security and SonarJS plugins in `.eslintrc.json`, add them to `plugins`/`extends`, and enable a sensible rule preset (e.g., `plugin:security/recommended`, `plugin:sonarjs/recommended`). Adjust overrides if conflicts arise.
5. **Create Husky Hooks**
   - `pre-commit`: run `lint-staged` so staged files pass lint (and optionally formatting).
   - `pre-push`: run `npm run build` (and optionally `npm run type-check`) to prevent pushing code that fails to compile.
6. **Document & Verify**  
   Update README/AGENTS (if needed) or provide usage notes, then test hooks locally (simulate staged commit/push) to confirm automation works without slowing the workflow excessively.

## Optional Enhancements

- Add a `npm run lint:staged` helper that `lint-staged` can call, keeping hook commands concise.
- Consider caching ESLint results with `--cache` for faster hook runs.
- Include `npm run type-check` in `pre-push` to catch TS issues before build.
