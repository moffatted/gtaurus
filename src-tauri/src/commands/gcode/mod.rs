/*
 * @file mod.rs
 * @purpose G-code processing and analysis module entry point.
 * @author Ed Moffatt
 */
pub mod models;
pub mod utils;
pub mod parser;

pub use models::*;
pub use parser::parse_gcode_file_impl as parse_gcode_file_internal;

/// Parses and analyzes a local G-code file for visualization and stats.
///
/// # Errors
/// Returns an error if the file cannot be read or parsed.
#[tauri::command]
pub fn parse_gcode_file(path: String) -> Result<models::GCodeAnalysis, String> {
    parse_gcode_file_internal(path)
}
