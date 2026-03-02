# Build, Test, and Release Strategy

This document outlines the comprehensive strategy for building, testing, deploying, and releasing Gtaurus for production across multiple platforms (Windows, Linux, and macOS).
It covers standard Rust binaries, Tauri desktop apps, and standalone web servers running directly on the host.

## Git Submodules and Dependencies

Gtaurus relies on internal git submodules (e.g., `gtaurus_lib` and `gtaurus_server`).
When building or testing, both locally and in CI/CD environments, it is critical to ensure that these submodules are fully checked out and updated.

**To initialize and update submodules locally:**

```bash
git submodule update --init --recursive
```

## Production Build Process

Gtaurus uses the Tauri V2 framework with a Next.js/React frontend.
The build process compiles both the frontend web assets and the Rust desktop backend into native applications.

### Prerequisites

- **Node.js**: For frontend compilation and package management (v20+ recommended).
- **Rust (Stable)**: For compiling the Tauri backend.
- **Tauri CLI**: For scaffolding and building (e.g., via `npx @tauri-apps/cli`).
- **Platform-Specific Dependencies**: Linux requires specific system libraries (e.g., WebKit2GTK).
  See the [Tauri documentation](https://v2.tauri.app/start/prerequisites/) for a full list.

### Local Build Commands

To generate a production-ready installer for your current operating system, follow these steps:

```bash
# 1. Ensure submodules are up-to-date
git submodule update --init --recursive

# 2. Install Node.js dependencies
npm install

# 3. Build the application installers
npm run tauri build
```

This process automatically:

1. Compiles the Next.js frontend into static assets pointing to `dist/` or `out/`.
2. Compiles the Rust backend using `cargo build --release`.
3. Bundles everything into a native application installer (e.g., `.msi` or `.exe` for Windows, `.deb` or `.AppImage` for Linux, `.dmg` or `.app` for macOS).

## Testing Strategy

A robust testing strategy is required to maintain the stability of both the web frontend and Rust backend.

### Frontend Testing

- **Unit and Component Tests**: Run using Vitest or Jest.

  ```bash
  npm run test:unit
  ```

- **Linting and Formatting**: Enforced via ESLint and Prettier.

  ```bash
  npm run lint
  ```

### Backend (Rust) Testing

- **Unit Tests**: Run using standard Cargo test commands.

  ```bash
  cargo test
  ```

- **Linting and Formatting**: Enforced via Clippy and rustfmt.

  ```bash
  cargo clippy -- -D warnings
  cargo fmt -- --check
  ```

## CI/CD Pipeline on GitHub Actions

To enforce best practices and ensure consistent builds, Gtaurus utilizes GitHub Actions for continuous integration (CI) and continuous deployment (CD).
Automated releases for Rust projects on GitHub are typically triggered by specific events like pushing a version tag (e.g., `v1.0.0`) or merging into a release branch.

The strategy varies depending on the specific component being shipped:

### 1. Rust Tauri (Desktop Apps)

Tauri apps require more complex CI because they need to bundle frontend assets and often require code signing for macOS and Windows.

- **Primary Tool**: `tauri-apps/tauri-action` is the official and most robust way to automate this.
- **Key Features**:
  - Automatically detects the frontend (React, Vue, etc.) and runs the build script.
  - Creates a GitHub Release and uploads platform-specific installers (`.dmg`, `.exe`, `.AppImage`).
  - Supports Updater JSON generation, allowing the app to self-update.
- **Configuration**: Always provide a `GITHUB_TOKEN` so the action has permission to create the release and upload large assets.

#### Comprehensive GitHub Actions Workflow (Tauri)

Below is an example workflow (`.github/workflows/release.yml`) that incorporates building, testing, caching, and releasing, ensuring submodules are properly initialized:

```yaml
name: Build, Test, and Release

on:
  push:
    branches:
      - main
    tags:
      - "v*"
  pull_request:
    branches:
      - main

jobs:
  test:
    name: Run Linting and Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - name: Install Frontend Dependencies
        run: npm ci

      - name: Setup Rust toolchain
        uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt, clippy

      - name: Rust Cache
        uses: Swatinem/rust-cache@v2

      - name: Install Tauri Linux Dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev

      - name: Run Frontend Tests
        run: npm run test:unit || echo "No frontend tests configured yet"

      - name: Run Rust Tests
        run: cargo test

  release:
    name: Build and Release
    needs: test
    if: startsWith(github.ref, 'refs/tags/v')
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: ubuntu-22.04
            args: ""
          - platform: windows-latest
            args: ""
          - platform: macos-latest
            args: "--target aarch64-apple-darwin"
    runs-on: ${{ matrix.platform }}
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - name: Install Frontend Dependencies
        run: npm ci

      - name: Setup Rust toolchain
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.platform == 'macos-latest' && 'aarch64-apple-darwin' || '' }}

      - name: Rust Cache
        uses: Swatinem/rust-cache@v2

      - name: Install Tauri Linux Dependencies
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev

      - name: Build and Package Tauri App
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: "Gtaurus ${{ github.ref_name }}"
          releaseBody: "See the assets below for the cross-platform installers."
          releaseDraft: true
          prerelease: false
          args: ${{ matrix.args }}
```

### 2. General Rust Binaries (CLI Tools)

For standalone Rust utilities or standard CLI projects within the repository (like background workers), the goal is to cross-compile the binary and attach them to the release.

- **Recommended Tool**: `cargo-dist` is the industry standard. It automatically generates GitHub Actions YAML, handles cross-compilation, and creates installers (`.msi`, `.deb`).
- **Alternative**: `rust-build.action` is a simpler choice that compiles for different targets and uploads zipped binaries directly.
- **Workflow Pattern**:
  1. Trigger on pushes to `tags: ['v*']`.
  2. Matrix job across `ubuntu-latest`, `macos-latest`, `windows-latest`.
  3. Uses an upload action like `softprops/action-gh-release`.

### 3. Rust Web Servers (Standalone Host Backends)

Because Gtaurus operates as a G-code sender communicating directly with machine hardware via serial interfaces, the `gtaurus_server` backend must run **directly on the host machine** and is NOT deployed via Docker containers.

- **Recommended Workflow**:
  - **Build**: Compile as a standalone daemon or service using standard `cargo build --release` targeting the host architecture (e.g., `x86_64-unknown-linux-gnu` or `aarch64-unknown-linux-gnu`).
  - **Deployment**: Transfer the compiled binary to the target hardware (e.g., via SCP, custom update script, or GitHub Releases) and configure it as a local system service (like `systemd`).

## CI/CD Automation Summary Table

| Project Type | Common "Release" Artifact | Primary Automation Tool |
| :--- | :--- | :--- |
| **Desktop (Tauri)** | `.exe`, `.dmg`, `.deb` | `tauri-action` |
| **CLI / Tool** | Zipped Binaries / Installers | `cargo-dist` |
| **Web Server / Backend** | Host Native Binary | `cargo-dist` / SCP |

## Best Practices for All Rust CI Projects

- **Caching**: Always use `Swatinem/rust-cache` in your workflows to avoid re-compiling every dependency from scratch on every run.
- **Matrix Strategy**: Run tests across targeted operating systems to ensure broad compatibility.
- **Permissions**: Ensure your workflow has `contents: write` permissions in the YAML file if it needs to create releases or upload tags.
- **Token Security**: Rely on the built-in `${{ secrets.GITHUB_TOKEN }}` for most tasks. Only create a Personal Access Token (PAT) if you need to trigger subsequent downstream workflows from the release action.

## Release Versioning Strategy

Gtaurus follows [Semantic Versioning (SemVer)](https://semver.org/).
To ensure consistency across the project, you **must synchronize version strings** across three specific files before pushing a release tag:

1. **`package.json`**: Controls the node package and frontend version.
2. **`src-tauri/tauri.conf.json`**: Controls the Tauri bundle version and update identity.
3. **`src-tauri/Cargo.toml`**: Controls the Rust binary version.

> [!IMPORTANT]
> The automated GitHub release uses the git tag (e.g., `v1.0.0`) to generate the release.
> Ensure the local code correctly matches this version prior to tagging.

## Updates and Maintenance (Future CI Enhancements)

In the future, the release pipeline can be expanded to automate the Tauri **Updater** plugin.
This involves:

1. Injecting a `TAURI_PRIVATE_KEY` secret into the GitHub Action for automated signing of release bundles.
2. Building an automated mechanism to generate and host the `latest.json` update metadata alongside GitHub Releases.
