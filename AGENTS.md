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

## UI Help Affordances

- Place help affordances in a consistent top-right location when feasible.
- Prefer in-flow placement over absolute overlays to avoid covering controls.
- If a panel has fixed top-right visuals (for example, view cubes or status overlays), place help in the nearest non-overlapping control cluster.

## GitHub Workflow

- Default to creating bugfix/feature branches from main before modifying code.
- Let the developer test and review before committing and pushing unless they explicitly request commit/push.
- If the developer explicitly requests direct work on the current branch or main, proceed and follow their instruction.
