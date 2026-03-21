/*
 * @file fluidnc.rs
 * @purpose Commands for interacting with FluidNC via HTTP (uploads, restarts, file fetching).
 * @author Ed Moffatt
 */
/// Downloads a text file from a FluidNC HTTP endpoint.
///
/// # Errors
/// Returns an error for network failures, non-success HTTP status codes, or
/// response body decoding failures.
#[tauri::command]
pub async fn fetch_fluidnc_file(url: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    let res = client.get(url).send().await.map_err(|e| e.to_string())?;
    if !res.status().is_success() {
        return Err(format!("HTTP Error: {}", res.status()));
    }
    res.text().await.map_err(|e| e.to_string())
}

/// Calls the FluidNC restart endpoint.
///
/// Treats connection-reset style errors as success because restart may close the
/// connection before a full response body is returned.
///
/// # Errors
/// Returns an error for request-construction failures and non-transient network
/// or HTTP failures.
#[tauri::command]
pub async fn restart_fluidnc(url: String) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| e.to_string())?;

    match client.get(url).send().await {
        Ok(res) => {
            if res.status().is_success() {
                res.text().await.map_err(|e| e.to_string())
            } else {
                Err(format!("HTTP Error: {}", res.status()))
            }
        }
        Err(e) => {
            let err_str = e.to_string();
            if err_str.contains("timeout")
                || err_str.contains("connection reset")
                || err_str.contains("channel closed")
            {
                Ok("Restart command sent (connection closed)".to_string())
            } else {
                Err(err_str)
            }
        }
    }
}

/// Uploads a file to a FluidNC HTTP endpoint using multipart form data.
///
/// # Errors
/// Returns an error for network failures or non-success HTTP status codes.
#[tauri::command]
pub async fn upload_fluidnc_file(
    url: String,
    target_path: String,
    filename: String,
    content: String,
) -> Result<(), String> {
    let client = reqwest::Client::new();
    let form = reqwest::multipart::Form::new()
        .text("path", target_path)
        .part(
            "myfile",
            reqwest::multipart::Part::text(content).file_name(filename),
        );

    let res = client
        .post(url)
        .multipart(form)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if !res.status().is_success() {
        return Err(format!("Upload failed: {}", res.status()));
    }
    Ok(())
}
