# Build, Deploy, and Release Strategy

This document outlines the strategy for building Gtaurus for production and creating cross-platform releases for Windows, Linux, and macOS.

## Production Build Process

Gtaurus is built using the Tauri V2 framework. The production build process compiles the frontend assets and the Rust backend into a platform-agnostic distribution.

### Prerequisites

- **Node.js**: For frontend compilation and build scripts.
- **Rust (Stable)**: For compiling the Tauri backend.
- **Tauri CLI**: Installed via `npm install -g @tauri-apps/cli`.

### Local Build Commands

To generate a production-ready installer for your current operating system, run:

```bash
# Install dependencies
npm install

# Build the application
npm run tauri build
```

This command will:

1. Run `npm run build` to compile the React frontend.
2. Compile the Rust backend using `cargo build --release`.
3. Bundle the assets into a native installer (e.g., `.exe` or `.msi` on Windows).

## Release Versioning Strategy

Gtaurus uses [Semantic Versioning (SemVer)](https://semver.org/). To ensure consistency across the project, three files must have their version strings synchronized:

1. **`package.json`**: Controls the frontend version.
2. **`src-tauri/tauri.conf.json`**: Controls the Tauri bundle version and update identity.
3. **`src-tauri/Cargo.toml`**: Controls the Rust binary version.

> [!IMPORTANT]
> Always update all three files when bumping the version for a release.

## Cross-Platform Release Strategy

To support multi-platform releases, we use **GitHub Actions**. This allows for automated builds on Windows, Linux, and macOS infrastructure.

### GitHub Actions Workflow Example

Create a file at `.github/workflows/release.yml`:

```yaml
name: Release
on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    strategy:
      fail-fast: false
      matrix:
        platform: [macos-latest, ubuntu-22.04, windows-latest]
    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: npm install
      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
      - name: Build local app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: v__VERSION__ # the action automatically replaces this with your tag
          releaseName: "Gtaurus v__VERSION__"
          releaseBody: "See the assets below for the installers."
          releaseDraft: true
          prerelease: false
```

### Build Artifacts

The build process generates the following platform-specific installers:

- **Windows**: `.msi` (installer) or `.exe` (bundle).
- **Linux**: `.deb` or `.AppImage`.
- **macOS**: `.dmg` or `.app`.

## Updates and Maintenance

In the future, we can implement the Tauri **Updater** plugin to allow users to update Gtaurus directly from the application. This requires:

1. A public key for signing bundles.
2. A server or public gist to host the update JSON metadata.
