/*
 * @file fluidnc.rs
 * @purpose Commands for interacting with FluidNC via HTTP (uploads, restarts, file fetching).
 * @author Ed Moffatt
 */
#[tauri::command]
pub async fn fetch_fluidnc_file(url: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    let res = client.get(url).send().await.map_err(|e| e.to_string())?;
    if !res.status().is_success() {
        return Err(format!("HTTP Error: {}", res.status()));
    }
    res.text().await.map_err(|e| e.to_string())
}

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
