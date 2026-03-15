# Development Workflow Rules

## Testing Before Committing

**CRITICAL**: Always verify changes work before committing to version control.

## Copilot-First Implementation Loop

Use this loop for every non-trivial task:

1. **Understand and scope**
   - Restate goal and constraints in one or two lines.
   - Identify impacted layers: `src` (TS/React), `src-tauri` (Tauri Rust), `deps/*` (shared/server Rust).
2. **Inspect before editing**
   - Read nearby call sites and types before proposing new APIs.
   - Reuse existing patterns from adjacent modules.
3. **Make small, reviewable changes**
   - Keep edits focused by concern (UI, command boundary, transport logic).
   - Avoid broad refactors unless explicitly requested.
4. **Validate immediately**
   - Run typecheck/tests/build for changed layer right after editing.
   - Fix regressions before moving to the next layer.
5. **Summarize and hand off clearly**
   - Report files changed, behavior impact, and what was verified.

### Testing Tauri Desktop Applications

**For Tauri applications running as desktop apps:**

1. **For UI/UX Changes**:
   - Verify the application is running (`npm run tauri dev`)
   - The Tauri app runs as a native desktop window, not in a web browser
   - Manually test the changed functionality in the running desktop application
   - Test interactions (clicks, inputs, theme switching, etc.)
   - Verify visual appearance in the desktop window
   - Test both light and dark modes if theme-related
   - Verify responsive behavior if layout-related
   - Check the terminal output for any console errors or warnings
   - Check the browser dev tools if available (right-click > Inspect)

2. **For Web Applications**:
   - Use `browser_subagent` tool to open the application in Chrome
   - Navigate to the changed functionality
   - Test interactions and capture screenshots
   - Check for console errors

3. **For Backend/API Changes**:
   - Test the affected commands/endpoints.
   - Verify both success and failure paths.
   - Check logs for warnings/errors and ensure messages are actionable.

4. **For Build Configuration Changes**:
   - Run a clean build: `npm run build` or `npm run tauri build`
   - Verify no build errors or warnings
   - Test the built application if possible

5. **For Rust Crate Changes**:
   - Run `cargo check` and `cargo test` in the edited crate.
   - Prefer adding a regression test when fixing a bug.

6. **For Cross-Boundary Changes (TS <-> Rust)**:
   - Verify command payload types and serialization behavior.
   - Validate that Rust-side input validation still rejects malformed data.
   - Confirm frontend presents a user-actionable error message.

### Testing Checklist

Before running `git commit`, verify:

- [ ] Application runs without errors
- [ ] Changed functionality works as expected
- [ ] No console errors or warnings
- [ ] No regression in existing features
- [ ] Both light and dark themes work (if applicable)
- [ ] Modal/dialog positioning is correct (if applicable)
- [ ] Interactive elements respond properly (buttons, inputs, etc.)

### When to Skip Testing

Only skip manual testing if:

- Changes are documentation-only (README, comments)
- Changes are configuration files that don't affect runtime
- Changes are minor typo fixes in non-critical code

### Commit Message Format

After testing, use descriptive commit messages:

```text
<type>: <short description>

- Detail 1
- Detail 2
- Detail 3
```

Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`

## Git Operations

- **Wait for Instructions**: Never commit unless explicitly asked.
- **Do Not Assume Push**: Ask before pushing if the user only asked to commit.
- **Multi-Machine Sync**: Start work by checking remote state (`git fetch`, then inspect status).
- **Branch Hygiene**: Prefer feature branches for non-trivial work; keep commits atomic.

## T3 + Tauri + Rust Best Practices

- Keep frontend and backend contracts typed and version-friendly.
- Validate at both boundaries: TS schema validation and Rust command validation.
- Keep Tauri command surface minimal; do not expose internal-only helpers.
- Prefer `Result`-based Rust error flow with stable error codes/messages for the UI.
- Keep hardware/transport details behind traits and adapters for testability.
- Add regression tests for production fixes.
- Update docs when command signatures or behavior change.

## Example Workflow

```bash
# 1. Start session by checking for remote changes
git fetch
git status

# 2. If behind origin, pull the latest changes
git pull origin main

# 3. Make changes and test
npm run tauri dev

# 4. Manually test changes in the application
# 5. Check for errors in terminal and browser console
# 6. If everything works and user requested commit, commit
git add -A
git commit -m "fix: resolve dark mode switching issue

- Fixed async theme switching
- Added proper await handling
- Tested both light and dark modes"

# 7. Push only when explicitly requested
git push origin <branch>
```

## Rollback Strategy

If you discover issues after committing:

1. Fix the issue immediately
2. Test thoroughly
3. Commit the fix with a clear message
4. Reference the original commit if needed

```bash
git commit -m "fix: correct modal positioning issue from commit abc123"
```
