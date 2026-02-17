# Development Workflow Rules

## Testing Before Committing

**CRITICAL**: Always verify changes work before committing to version control.

### Required Testing Steps

1. **For UI/UX Changes**:
   - Verify the application is running (`npm run tauri dev`)
   - Manually test the changed functionality in the running application
   - Test both light and dark modes if theme-related
   - Verify responsive behavior if layout-related
   - Check for console errors in browser dev tools

2. **For Backend/API Changes**:
   - Test the affected endpoints/commands
   - Verify error handling works as expected
   - Check logs for any warnings or errors

3. **For Build Configuration Changes**:
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
```
<type>: <short description>

- Detail 1
- Detail 2
- Detail 3
```

Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`

## Example Workflow

```bash
# 1. Make changes
# 2. Ensure dev server is running
npm run tauri dev

# 3. Manually test changes in the application
# 4. Check for errors in terminal and browser console
# 5. If everything works, commit
git add -A
git commit -m "fix: resolve dark mode switching issue

- Fixed async theme switching
- Added proper await handling
- Tested both light and dark modes"

# 6. Push to remote
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
