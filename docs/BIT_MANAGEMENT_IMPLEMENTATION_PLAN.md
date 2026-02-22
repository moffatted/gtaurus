# Implementation Plan: Bit Management System

This plan outlines the staged development of the Bit Management system for Gtaurus, enabling tool lifecycle tracking, safety interlocks, and adaptive feed/speed management.

## Phase 1: Data Model and Store Integration

Establish the foundational data structures and persistence layer for the Tool Library.

- [ ] **Define Bit Interface**: Create a comprehensive TypeScript interface for CNC bits.
  - Fields: `id`, `name`, `type` (Endmill, V-bit, etc.), `diameter`, `fluteCount`, `usageTimeSec`, `usageDistanceMm`, `material`, `lastMaintenanceDate`.
- [ ] **Create Tool Store**: Implement `useToolStore` using Zustand and `tauri-plugin-store` for cross-session persistence.
- [ ] **Initial Catalog**: Populate the store with common default bits (e.g., 1/8" Downcut, 1/4" Upcut, 60-degree V-bit).

## Phase 2: Tool Library UI

Develop the user interface for managing the tool catalog.

- [ ] **Tool Management Panel**: Create a dockable `ToolLibraryPanel.tsx`.
- [ ] **CRUD Operations**: Implement forms for adding, editing, and retiring bits.
- [ ] **Bit Cards**: Design a premium UI for bit cards including metadata and (eventually) generated or uploaded icons.
- [ ] **Active Tool Selector**: A dedicated UI element to designate which bit is *currently* physically loaded in the spindle.

## Phase 3: G-code Parsing and Interlocks

Integrate the tool library with the job execution engine.

- [ ] **T-Command Parsing**: Update the G-code parser in `gcodeStore.ts` to identify tool change commands (e.g., `T1 M06`) and tool comments.
- [ ] **Pre-Job Validation**: Implement a "Safety Check" step before a job starts.
  - Verify that the called tool number matches the active tool in Gtaurus.
  - Trigger a visual confirmation dialog if a mismatch is detected.
- [ ] **Simulation Support**: Update the 3D Bed Visualizer to reflect the active tool's diameter in the toolpath rendering.

## Phase 4: Adaptive Overrides and Lifecycle Tracking

Enhance job execution with real-time tool data.

- [ ] **Adaptive Overrides**: Display recommended Feed/Speed overrides based on the active bit's profile and the current material.
- [ ] **Lifecycle Logging**:
  - Increment `usageTimeSec` during active cutting moves (`G1`, `G2`, `G3`).
  - Increment `usageDistanceMm` based on toolpath length.
- [ ] **Maintenance Alerts**: Implement a notification system that triggers when a bit reaches its predicted duty cycle limit.

## Phase 5: "Quick Cut" Macros

Enable direct machine operations based on tool geometry.

- [ ] **Surface Leveling Macro**: Generate automatic surfacing G-code based on bed dimensions and the selected surfacing bit diameter.
- [ ] **Simple Boring/Pocketing**: Direct UI for simple geometric cuts without requiring external CAM software.

## Verification Tasks

- [ ] Verify persistence of Tool Library after app restart.
- [ ] Test G-code interlock by loading a file with a tool mismatch.
- [ ] Validate accuracy of usage time tracking during a 5-minute air-cut test.
