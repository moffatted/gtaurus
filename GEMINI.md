# Gemini CLI Operational Guidelines

## Git Repository Rules

- Whenever a commit is performed, it must be followed by a push to the remote repository.
- Always include a concise, descriptive commit message.

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

- **Windows Environment**: Always prefer PowerShell-native commands.
  - Use `Select-String` instead of `grep`.
  - Use `ls` or `Get-ChildItem` (aliased as `ls` in pwsh) instead of complex unix-only find flags.
  - Avoid using Unix-specific utilities like `sed` or `awk` unless explicitly confirmed to be available via Git Bash/WSL.
