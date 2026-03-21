use walkdir::WalkDir;

/// Scans common Autodesk Fusion directories for tool library files.
#[tauri::command]
pub fn find_fusion_tools() -> Vec<String> {
    let mut found = Vec::new();

    if let Some(roaming) = dirs::config_dir() {
        let local_lib = roaming
            .join("Autodesk")
            .join("CAM360")
            .join("libraries")
            .join("Local")
            .join("Library.json");
        if local_lib.exists() {
            found.push(local_lib.to_string_lossy().to_string());
        }
    }

    if let Some(local) = dirs::data_local_dir() {
        let base = local.join("Autodesk").join("Autodesk Fusion 360");
        if base.exists() {
            for entry in WalkDir::new(base)
                .max_depth(10)
                .into_iter()
                .filter_entry(|e| {
                    let name = e.file_name().to_string_lossy();
                    name != "production" && name != "Qt" && name != "Web Services"
                })
                .filter_map(|e| e.ok())
            {
                if entry.file_type().is_file() {
                    let name = entry.file_name().to_string_lossy();
                    if name == "Library.json" || name.ends_with(".tools") {
                        found.push(entry.path().to_string_lossy().to_string());
                    }
                }
            }
        }
    }

    found.sort();
    found.dedup();
    found
}
