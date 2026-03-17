/*
 * @file state.rs
 * @purpose Global application state management for the Tauri backend.
 * @author Ed Moffatt
 */
use std::sync::{Arc, Mutex};
use crate::driver::GCodeConnection;
use crate::autolevel;

pub struct AppState {
    pub driver: Arc<Mutex<Box<dyn GCodeConnection>>>,
    pub height_map: Arc<Mutex<Option<autolevel::height_map::HeightMap>>>,
}
