/*
 * @file main.rs
 * @purpose Entry point for the Tauri desktop application, launching the GUI framework and backend processes.
 */
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    gtaurus_lib::run()
}
