# Development Workflow Rules

## Testing Before Committing

**CRITICAL**: Always verify changes work before committing to version control.

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
   - Test the affected endpoints/commands
   - Verify error handling works as expected
   - Check logs for any warnings or errors

4. **For Build Configuration Changes**:
   - Run a clean build: `npm run build` or `npm run tauri build`
   - Verify no build errors or warnings
   - Test the built application if possible

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

- **Wait for Instructions**: Never commit code unless specifically instructed by the user to "commit". Do not proactively commit changes after completing a task.
- **Commit implies Push**: When the user requests to "commit" code, they also mean to "push" it to the remote repository. Always perform both actions (`git commit` followed by `git push`) unless otherwise specified.
- **Multi-Machine Sync**: To support development across multiple machines, the agent MUST check for remote changes (`git fetch`) at the beginning of each session. If the local branch is behind `origin`, the agent must notify the user and recommend a `git pull` before starting any work.

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
# 6. If everything works, commit
git add -A
git commit -m "fix: resolve dark mode switching issue

- Fixed async theme switching
- Added proper await handling
- Tested both light and dark modes"

# 7. Push to remote
git push origin main
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
