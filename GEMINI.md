# Gemini CLI Operational Guidelines

## Git Repository Rules

- **Approval Required:** NEVR commit or push code changes to the repository until the USER (developer) has explicitly evaluated and approved the changes. Wait for confirmation such as "check it in" or "it looks good, commit it."
- Whenever a commit is performed, it must be followed by a push to the remote repository.
- Always include a concise, descriptive commit message.
- **Submodule Sync:** After pushing changes to `gtaurus_lib` or `gtaurus_server`, always update the submodule references in `gtaurus` by running `cd deps/gtaurus_lib && git pull origin main` and/or `cd deps/gtaurus_server && git pull origin main`, then committing and pushing the updated submodule refs from the `gtaurus` root. This ensures the other machine receives all changes via `git pull && git submodule update --init --recursive`.

## Scanning and Investigation Rules

To maintain context efficiency and focus on relevant source code, the following directories and file types are excluded from scanning, searching, and indexing:

1. **Build Artifacts & Dependencies:**
   - `dist/` (Frontend build output)
   - `node_modules/` (Dependencies)
   - `src-tauri/target/` (Rust build output)
2. **Large Data Files & Examples:**
   - `examples/` (Contains large `.gcode` files)
   - `*.gcode` (Any G-code files, as they can be extremely large and usually don't contain application logic)
3. **Logs and Temporary Files:**
   - `*.log`
   - `npm-debug.log*`
   - `.gemini/tmp/` (Temporary directory context)

## Technical Integrity

- Before modifying G-code parsing or streaming logic, always consult `src/utils/parser.ts` and `src/utils/streamer.ts`.
- When working on the Tauri backend, verify changes in `src-tauri/src/`.
- Ensure all UI changes are validated in `src/components/`.

## Shell & Commands

- **Windows Environment**: Always prefer PowerShell-native commands when developing on windows.
  - Use `Select-String` instead of `grep`.
  - Use `ls` or `Get-ChildItem` (aliased as `ls` in pwsh) instead of complex unix-only find flags.
  - Avoid using Unix-specific utilities like `sed` or `awk` unless explicitly confirmed to be available via Git Bash/WSL.
