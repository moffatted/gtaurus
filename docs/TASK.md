# Gtaurus Development Tasks

## Phase 1: Project Setup & Core Structure

- [x] Initialize Tauri Project (React + TS + Tailwind)
- [x] Install dependencies (lucide-react, zustand, tanstack-query, serialport (Rust))
- [x] Set up Tailwind CSS configuration

## Phase 2: Rust Backend (Driver Layer)

- [x] Implement `CNCController` trait
- [x] Implement `FluidNCDriver` struct (basic)
- [x] Implement Serial Port Scanner (`list_serial_ports`)
- [x] Create Tauri command bridges (`connect_to_board`, `stream_gcode_file`)

## Phase 3: Frontend Implementation

- [x] Create layout structure (Sidebar + specific areas for Terminal/DRO)
- [x] Implement Connection Manager Sidebar
- [x] Connect frontend to `list_serial_ports` command

## Phase 4: Advanced Features (Later)

- [x] Implement Streaming Logic (Character Counting Protocol)
- [ ] Implement YAML Configurator
- [ ] Implement 3D G-code Viewer
