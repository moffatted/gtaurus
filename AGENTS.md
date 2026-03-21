# Agent Rules

## UI Layout Efficiency

- Prioritize vertical space efficiency in all UI work, especially wizards, settings panels, and modal flows.
- Default to compact spacing and sizing unless readability or accessibility would be harmed.
- Prefer reducing stacked whitespace before reducing text clarity.
- Keep critical actions visible without scrolling whenever practical on common laptop screen heights.
- For dense steps, use tighter paddings/gaps and concise helper text.

## Code Modularity

- Keep files focused and reasonably small when practical.
- Apply separation of concerns to split UI, state, and service logic cleanly.
- Prefer extracting reusable logic/components over growing large, multi-purpose files.
- Follow language-specific best practices for TypeScript, React, and Rust.

## Rust Documentation

- Use Rust doc comments (`///`) for public items and module-level docs (`//!`) where helpful for context.
- Document intent, parameters, return values, and side effects for non-trivial functions and methods.
- Include rustdoc sections like `# Errors`, `# Panics`, and `# Safety` when applicable.
- Keep examples concise and realistic; prefer examples that compile when practical.
- Update docs alongside code changes so behavior and constraints remain accurate.

## Validation & Verification

- Run `npm run -s typecheck` after TypeScript/React changes and before committing.
- Run relevant tests for touched areas when available.
- If validation cannot be run, clearly state what was not validated and why.

## Change Scope

- Keep changes tightly scoped to the request.
- Avoid unrelated refactors in the same commit unless explicitly requested.
- Do not modify or revert unrelated dirty files.

## Commit Hygiene

- Use focused commits with clear, user-impactful commit messages.
- Include documentation/help updates when behavior or UI affordances change.
- If the developer says "commit" without qualifiers, treat it as "commit and push" by default.
- Only keep commits local when the developer explicitly asks to "commit locally" or "do not push".

## UI Help Affordances

- Place help affordances in a consistent top-right location when feasible.
- Prefer in-flow placement over absolute overlays to avoid covering controls.
- If a panel has fixed top-right visuals (for example, view cubes or status overlays), place help in the nearest non-overlapping control cluster.

## GitHub Workflow

- Default to creating a feature or bugfix branch from `main` before making code changes.
- Before switching branches, run `git status -sb` and confirm the working tree is clean, or explicitly stash/commit first.
- Never carry unstaged work across branches unintentionally; if checkout is blocked or risky, stop and resolve state first.
- Stage intentionally with explicit paths when practical (avoid broad `git add .` unless requested).
- Keep commits focused and atomic: one logical change set per commit with clear messages.
- Before merging, verify validation for touched areas (at minimum `npm run -s typecheck`, plus relevant tests).
- Prefer merge via feature branch history; only commit directly to `main` when explicitly requested.
- After merge/push, verify with `git status -sb` and branch tracking to confirm clean synced state.
- Let the developer test and review before commit/push unless they explicitly request immediate check-in.
