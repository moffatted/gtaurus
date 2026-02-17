---
description: Implement a new feature in Gtaurus
---

# Feature Implementation Workflow

This workflow guides you through implementing a new feature in Gtaurus, ensuring consistent architecture and quality.

## 1. Planning
-   [ ] **Understand Requirement**: Read the user request carefully.
-   [ ] **Plan Architecture**: Decide if this needs Backend (Rust) + Frontend (React) or just one.
    -   *Does it need a new Tauri Command?* -> Update `lib.rs` and `driver.rs`.
    -   *Does it need UI?* -> Create a component in `src/components`.
-   [ ] **Update Docs**: Add the task to `docs/TASK.md`.

## 2. Backend Implementation (if applicable)
-   [ ] **Driver Logic**: Implement core logic in `src-tauri/src/driver.rs`.
-   [ ] **Tauri Command**: Create a `#[tauri::command]` in `src-tauri/src/lib.rs`.
-   [ ] **Register Command**: Add to `tauri::generate_handler![]` in `lib.rs`.
-   [ ] **Verify**: Run `cargo check` in `src-tauri`.

## 3. Frontend Implementation
-   [ ] **API Wrapper**: Ensure strict typing for the command invoke.
-   [ ] **UI Component**: Build the UI using Tailwind CSS.
-   [ ] **State**: Use `useQuery` or `zustand` as appropriate.
-   [ ] **Verify**: Run `tsc` to check types.

## 4. Verification
-   [ ] **Run App**: `npm run tauri dev`.
-   [ ] **Test Feature**: Manually verify functionality.
-   [ ] **Update Status**: Mark task as completed in `docs/TASK.md`.
