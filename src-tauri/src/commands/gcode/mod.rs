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

#[tauri::command]
pub fn parse_gcode_file(path: String) -> Result<models::GCodeAnalysis, String> {
    parse_gcode_file_internal(path)
}
