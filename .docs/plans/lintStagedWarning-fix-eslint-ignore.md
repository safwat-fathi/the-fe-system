# Lint-Staged ESLint Warning Fix Plan

## Summary

- Current lint-staged command runs ESLint on any staged `*.js/ts` file, including `eslint.config.js`.
- ESLint ignores that file due to the `*.config.js` ignore entry, which triggers a warning.
- We pass `--max-warnings=0`, so lint-staged treats the warning as a failure and aborts commits.

## Plan

1. Update the lint-staged ESLint command to include `--no-warn-ignored` so ignored files don't emit warnings, keeping the strict `--max-warnings=0` behavior for real issues.
2. (Optional) Document rationale in AGENTS/plan summary once implemented.
3. Re-run lint-staged to confirm the hook passes when staging `eslint.config.js`.
