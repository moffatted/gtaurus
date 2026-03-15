# GitHub Actions Workflow Rules

## Workflow Structure

- **Naming**: Use descriptive names for workflows (e.g., `ci.yml`, `release.yml`).
- **Triggers**:
  - Run CI on `push` to `main` or `master`.
  - Run CI on `pull_request` targeting `main` or `master`.
- **Concurrency**: Implement concurrency groups to cancel outdated builds on pull requests to save resources.

  ```yaml
  concurrency:
    group: ${{ github.workflow }}-${{ github.ref }}
    cancel-in-progress: true
  ```

## Jobs & Steps

- **Environment**: Use `ubuntu-latest` for general linting and building. Use specific OS runners (macos, windows) only for Tauri build matrix validation.
- **Node Setup**: Always use `actions/setup-node` with caching enabled.

  ```yaml
  - uses: actions/setup-node@v4
    with:
      node-version: 22 # Or project specific version
      cache: 'npm'
  ```

- **Dependencies**: Use `npm ci` instead of `npm install` in CI environments to ensure strict adherence to `package-lock.json`.

## Standard CI Checks

Every generic PR pipeline should include:

1. **Linting**: Run the repository lint command when available.
2. **Type Checking**: Run `tsc --noEmit` (or the project's `typecheck` script).
3. **Frontend Tests**: Run `npm run test`.
4. **Rust Checks**: Run `cargo check`/`cargo test` for changed Rust crates.
5. **Build Verification**: Run `npm run build` and `cargo check` for Tauri app.

## Copilot and PR Quality

- Require clear PR descriptions with problem, approach, risk, and test evidence.
- Prefer smaller PRs that can be reviewed in one pass.
- For risky changes, request Copilot review plus at least one human reviewer.
- Ensure every bug fix PR includes or references a regression test.
- Keep generated code reviewable: split generated scaffolding from logic changes.

## Tauri Specifics (If Applicable)

- If building the Tauri app in CI:
  - Install system dependencies (e.g., `libwebkit2gtk-4.0-dev`, `build-essential`, `libssl-dev` etc. for Linux).
  - Use `tauri-apps/tauri-action` for reliable builds if automating releases.

## Security & Secrets

- **Secrets**: Never hardcode credentials. Use `${{ secrets.MY_SECRET }}`.
- **Permissions**: Use least-privilege permissions for the `GITHUB_TOKEN`.

  ```yaml
  permissions:
    contents: read
  ```

- **Action Pinning**: Prefer pinning actions to specific SHAs or major versions (e.g., `@v4`) for stability.
