use std::sync::{Arc, Mutex};


pub mod ai;
pub mod autolevel;
pub mod commands;
pub mod driver;
pub mod state;

mod driver_tests;

use driver::FluidNCDriver;
use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            driver: Arc::new(Mutex::new(FluidNCDriver::new_boxed())),
            height_map: Arc::new(Mutex::new(None)),
        })
        .setup(|_app| Ok(()))
        .invoke_handler(tauri::generate_handler![
            commands::connection::list_serial_ports,
            commands::connection::connect_serial,
            commands::connection::connect_telnet,
            commands::connection::disconnect,
            commands::connection::send_gcode,
            commands::connection::send_realtime,
            commands::connection::get_connection_status,
            commands::probing::start_probing,
            commands::fluidnc::fetch_fluidnc_file,
            commands::fluidnc::upload_fluidnc_file,
            commands::fluidnc::restart_fluidnc,
            commands::file_system::get_home_dir,
            commands::file_system::ensure_dir_exists,
            commands::file_system::list_local_files,
            commands::file_system::read_local_file,
            commands::file_system::save_local_file,
            commands::file_system::delete_local_file,
            commands::file_system::copy_to_storage,
            commands::file_system::validate_gcode_file,
            commands::streaming::warp_gcode,
            commands::streaming::send_gcode_stream,
            commands::camera::get_camera_settings,
            commands::camera::set_camera_settings,
            ai::ask_ai,
            ai::list_gemini_models,
            ai::copilot_runtime_status,
            ai::test_ai_client_connectivity,
            commands::tooling::find_fusion_tools,
            commands::gcode::parse_gcode_file,
            commands::surfacing::generate_surfacing_toolpath,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
