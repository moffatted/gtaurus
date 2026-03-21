/*
 * @file state.rs
 * @purpose Global application state management for the Tauri backend.
 * @author Ed Moffatt
 */
use std::sync::{Arc, Mutex};
use crate::driver::GCodeConnection;
use crate::autolevel;

/// Shared backend state managed by the Tauri runtime.
///
/// Holds the active machine connection and optional autolevel height map.
pub struct AppState {
    pub driver: Arc<Mutex<Box<dyn GCodeConnection>>>,
    pub height_map: Arc<Mutex<Option<autolevel::height_map::HeightMap>>>,
}
