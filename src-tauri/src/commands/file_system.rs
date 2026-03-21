/*
 * @file file_system.rs
 * @purpose Commands for local file system operations and G-code file validation.
 * @author Ed Moffatt
 */
use serde::Serialize;
use std::path::PathBuf;
use std::fs;

#[derive(Serialize)]
/// File metadata returned to the frontend file browser.
pub struct LocalFile {
    pub name: String,
    pub size: u64,
    pub modified: u64, // timestamp in seconds
}

/// Returns the current user's home directory as a string path.
///
/// # Errors
/// Returns an error if the home directory cannot be determined.
#[tauri::command]
pub fn get_home_dir() -> Result<String, String> {
    dirs::home_dir()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| "Could not find home directory".to_string())
}

/// Creates the target directory and any missing parent directories.
///
/// # Errors
/// Returns an error if directory creation fails.
#[tauri::command]
pub fn ensure_dir_exists(path: String) -> Result<(), String> {
    fs::create_dir_all(path).map_err(|e| e.to_string())
}

/// Lists regular files in a local directory, creating it if needed.
///
/// # Errors
/// Returns an error if directory creation, read, or metadata access fails.
#[tauri::command]
pub fn list_local_files(path: String) -> Result<Vec<LocalFile>, String> {
    let dir = PathBuf::from(&path);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let mut files = Vec::new();
    let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let metadata = entry.metadata().map_err(|e| e.to_string())?;
        if metadata.is_file() {
            files.push(LocalFile {
                name: entry.file_name().to_string_lossy().to_string(),
                size: metadata.len(),
                modified: metadata
                    .modified()
                    .map_err(|e| e.to_string())?
                    .duration_since(std::time::UNIX_EPOCH)
                    .map_err(|e| e.to_string())?
                    .as_secs(),
            });
        }
    }
    Ok(files)
}

/// Reads a UTF-8 text file from the provided directory and filename.
///
/// # Errors
/// Returns an error if the file cannot be read.
#[tauri::command]
pub fn read_local_file(path: String, filename: String) -> Result<String, String> {
    let mut full_path = PathBuf::from(&path);
    full_path.push(&filename);
    fs::read_to_string(&full_path).map_err(|e| e.to_string())
}

/// Writes UTF-8 content to a file, creating the directory when needed.
///
/// # Errors
/// Returns an error if directory creation or file write fails.
#[tauri::command]
pub fn save_local_file(path: String, filename: String, content: String) -> Result<(), String> {
    let dir = PathBuf::from(&path);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let mut full_path = dir;
    full_path.push(filename);
    fs::write(&full_path, content).map_err(|e| e.to_string())
}

/// Deletes a local file from the provided directory and filename.
///
/// # Errors
/// Returns an error if file deletion fails.
#[tauri::command]
pub fn delete_local_file(path: String, filename: String) -> Result<(), String> {
    let mut full_path = PathBuf::from(path);
    full_path.push(filename);
    fs::remove_file(full_path).map_err(|e| e.to_string())
}

/// Copies a source file into the destination storage directory.
///
/// # Errors
/// Returns an error if the source does not exist, destination creation fails,
/// or the copy operation fails.
#[tauri::command]
pub fn copy_to_storage(source_path: String, dest_dir: String) -> Result<(), String> {
    let source = PathBuf::from(&source_path);
    if !source.exists() {
        return Err(format!("Source file does not exist: {}", source_path));
    }
    let filename = source.file_name().ok_or("Invalid filename")?;
    let dest_path = PathBuf::from(&dest_dir);
    fs::create_dir_all(&dest_path).map_err(|e| format!("Failed to create dest dir: {}", e))?;
    let mut dest = dest_path;
    dest.push(filename);
    fs::copy(&source, &dest).map(|_| ()).map_err(|e| e.to_string())
}

/// Performs a lightweight heuristic check for G-code-looking content.
///
/// # Errors
/// Returns an error if the file cannot be read.
#[tauri::command]
pub fn validate_gcode_file(path: String) -> Result<bool, String> {
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;

    let is_gcode = content.lines().any(|line| {
        let l = line.trim();
        if l.is_empty() || l.starts_with(';') || l.starts_with('(') {
            return false;
        }
        l.starts_with('G')
            || l.starts_with('M')
            || l.starts_with('X')
            || l.starts_with('Y')
            || l.starts_with('Z')
            || l.starts_with('$')
            || l.starts_with('F')
            || l.starts_with('S')
            || l.starts_with('T')
    });

    Ok(is_gcode)
}
