# Copilot Workspace Instructions

- Never use browser-native dialogs such as `window.confirm`, `window.alert`, or `window.prompt` in this codebase.
- Use in-app modal/dialog components for confirmations, warnings, and user prompts.
- For destructive actions, require an explicit in-app confirmation step with clear action labeling.
