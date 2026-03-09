use serde::{Deserialize, Serialize};
use std::env;

// --- Gemini API Schema structs ---

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Part {
    pub text: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Content {
    pub role: String,
    pub parts: Vec<Part>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GeminiRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub system_instruction: Option<Content>,
    pub contents: Vec<Content>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GeminiResponse {
    pub candidates: Option<Vec<Candidate>>,
    pub error: Option<GeminiError>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Candidate {
    pub content: Content,
    pub finish_reason: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GeminiError {
    pub code: i32,
    pub message: String,
    pub status: String,
}

// --- OpenAI API Schema structs (for Local LLMs like LM Studio) ---

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OpenAIMessage {
    pub role: String,
    pub content: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OpenAIRequest {
    pub model: String,
    pub messages: Vec<OpenAIMessage>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OpenAIResponse {
    pub choices: Option<Vec<OpenAIChoice>>,
    pub error: Option<OpenAIError>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OpenAIChoice {
    pub message: OpenAIMessage,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OpenAIError {
    pub message: String,
    pub r#type: String,
}

// --- Inference Command ---

#[tauri::command]
pub async fn ask_ai(
    messages: Vec<Content>,
    machine_context: String,
    ai_tier: String,
    api_key: String,
    free_model: String,
    pro_model: String,
    local_model: String,
    local_base_url: String,
    local_api_key: String,
    concise_mode: bool,
) -> Result<String, String> {
    let concise_instruction = if concise_mode {
        "6. CONCISENESS: Be very brief and direct. Avoid conversational filler or long intros. Use bullet points for steps. If providing G-code, just provide the block with a one-sentence explanation."
    } else {
        "6. DETAIL: Provide thorough explanations and context for your technical advice."
    };

    let system_prompt = format!(
        "You are an expert CNC application engineer and master machinist specializing in GRBL and FluidNC controllers. You are the digital assistant for 'Gtaurus', a high-performance CNC sender.\n\n\
        CORE CAPABILITIES:\n\
        - You can interpret real-time machine status (Position, Feed, Spindle, State).\n\
        - You are an expert in GRBL '$' settings and FluidNC-specific extensions (e.g., $Config/List, $System/Stats).\n\
        - You can generate safety-conscious G-code snippets for probing, surfacing, and complex toolpaths.\n\n\
        OPERATIONAL GUIDELINES:\n\
        1. SAFETY FIRST: Always mention safety clearances (e.g., G53 Z0) and ensure the user's spindle is on before cutting. Assume the user is a novice unless proven otherwise.\n\
        2. NO DIRECT EXECUTION: Clearly state you cannot move the machine. You provide the G-code or command strings for the user to copy/paste into the console.\n\
        3. CONTROLLER AWARENESS: Use the provided context to identify the firmware (e.g., FluidNC, GRBL v1.1). If the context contains 'FluidNC', suggest FluidNC-specific commands: '$I' (build info), '$A' or '$Alarms/List' (list alarm codes), '$Alarm/Send=[num]' (manually trigger alarm for testing), '$SD/List' (files), and '$X' to clear/unlock. Mention hardware safety pins like 'fault_pin' or 'estop_pin' in the YAML config if the user is asking about external safety sensors.\n\
        4. PRECISION: Comment every line of G-code you generate. Use the current units (G20/G21) and coordinates (WCS vs Machine) from the context.\n\
        5. DEBUGGING: If the machine state is 'Alarm', prioritize explaining how to clear it ($X) and the risks of doing so without homing ($H).\n\
        {}\n\n\
        === CURRENT MACHINE & APP CONTEXT (JSON) ===\n\
        {}\n\
        ===============================",
        concise_instruction,
        machine_context
    );

    if ai_tier == "local" {
        // --- Local LLM (OpenAI Compatible) ---
        let mut openai_messages = vec![
            OpenAIMessage {
                role: "system".to_string(),
                content: system_prompt,
            }
        ];

        for m in messages {
            let role = if m.role == "model" { "assistant" } else { &m.role };
            let content = m.parts.get(0).map(|p| p.text.clone()).unwrap_or_default();
            openai_messages.push(OpenAIMessage {
                role: role.to_string(),
                content,
            });
        }

        let local_model_trimmed = local_model.trim();
        let req_body = OpenAIRequest {
            model: if local_model_trimmed.is_empty() { "qwen/qwen2.5-coder-14b".to_string() } else { local_model_trimmed.to_string() },
            messages: openai_messages,
        };

        let base_url = if local_base_url.is_empty() { "http://192.168.68.57:1473/v1".to_string() } else { local_base_url };
        let url = if base_url.ends_with('/') {
            format!("{}chat/completions", base_url)
        } else {
            format!("{}/chat/completions", base_url)
        };

        let client = reqwest::Client::new();
        let mut request = client.post(&url)
            .header("Content-Type", "application/json")
            .json(&req_body);

        if !local_api_key.is_empty() {
            request = request.header("Authorization", format!("Bearer {}", local_api_key));
        }

        let res = request.send()
            .await
            .map_err(|e| format!("Local LLM Connection Error: {}. Is your model server running?", e))?;

        if !res.status().is_success() {
            let status = res.status();
            let err_text = res.text().await.unwrap_or_default();
            return Err(format!("Local LLM Error ({}): {}", status, err_text));
        }

        let parsed: OpenAIResponse = res.json().await
            .map_err(|e| format!("Failed to parse OpenAI JSON: {}", e))?;

        if let Some(err) = parsed.error {
            return Err(format!("LLM Error: {}", err.message));
        }

        if let Some(choices) = parsed.choices {
            if !choices.is_empty() {
                return Ok(choices[0].message.content.clone());
            }
        }

        return Err("Local LLM returned an empty response.".to_string());
    }

    // --- Gemini API ---
    let (final_key, model) = if ai_tier == "free" {
        let bundled = option_env!("GEMINI_FREE_API_KEY").unwrap_or("");
        let key = if !api_key.trim().is_empty() { api_key } else { bundled.to_string() };
        (key, if free_model.is_empty() { "gemini-1.5-flash".to_string() } else { free_model })
    } else {
        let key = if !api_key.trim().is_empty() { api_key } else { env::var("GEMINI_API_KEY").unwrap_or_else(|_| "".to_string()) };
        (key, if pro_model.is_empty() { "gemini-1.5-pro".to_string() } else { pro_model })
    };

    if final_key.is_empty() {
        return Err("Gemini API Key is not configured.".to_string());
    }

    let system_instruction = Content {
        role: "system".to_string(),
        parts: vec![Part { text: system_prompt }],
    };

    let req_body = GeminiRequest {
        system_instruction: Some(system_instruction),
        contents: messages,
    };

    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        model, final_key
    );

    let client = reqwest::Client::new();
    let res = client.post(&url)
        .header("Content-Type", "application/json")
        .json(&req_body)
        .send()
        .await
        .map_err(|e| format!("Network Error: {}", e))?;

    if !res.status().is_success() {
        let status = res.status();
        let err_text = res.text().await.unwrap_or_default();
        return Err(format!("Gemini API Error ({}): {}", status, err_text));
    }

    let parsed: GeminiResponse = res.json().await
        .map_err(|e| format!("Failed to parse Gemini response: {}", e))?;

    if let Some(err) = parsed.error {
        return Err(format!("Gemini API Error: {}", err.message));
    }

    if let Some(mut candidates) = parsed.candidates {
        if !candidates.is_empty() {
            let candidate = candidates.remove(0);
            if !candidate.content.parts.is_empty() {
                return Ok(candidate.content.parts[0].text.clone());
            }
        }
    }

    Err("Gemini returned an empty response.".to_string())
}

#[tauri::command]
pub async fn list_gemini_models(api_key: String) -> Result<String, String> {
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models?key={}",
        api_key
    );

    let client = reqwest::Client::new();
    let res = client.get(&url)
        .send()
        .await
        .map_err(|e| format!("Network Error: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("API Error: {}", res.status()));
    }

    let text = res.text().await.map_err(|e| format!("Failed to read response: {}", e))?;
    Ok(text)
}

