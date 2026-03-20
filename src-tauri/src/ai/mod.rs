/*
 * @file mod.rs
 * @purpose AI module entry point, managing AI-related handlers and submodules.
 * @author Ed Moffatt
 */
use serde::{Deserialize, Serialize};
use std::env;
use std::process::Command;

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

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AnthropicMessage {
    pub role: String,
    pub content: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AnthropicRequest {
    pub model: String,
    pub system: String,
    pub max_tokens: u32,
    pub messages: Vec<AnthropicMessage>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AnthropicTextBlock {
    pub text: String,
    #[serde(rename = "type")]
    pub kind: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AnthropicResponse {
    pub content: Option<Vec<AnthropicTextBlock>>,
    pub error: Option<AnthropicError>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AnthropicError {
    pub message: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AiClientConfig {
    pub id: String,
    pub name: String,
    pub tier: String,
    pub provider: String,
    pub model: String,
    pub base_url: Option<String>,
    pub api_key: Option<String>,
    pub copilot_auth_mode: Option<String>,
    pub copilot_byok_provider: Option<String>,
    pub enabled: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CopilotRuntimeStatus {
    pub available: bool,
    pub version: Option<String>,
    pub message: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AiConnectivityResult {
    pub ok: bool,
    pub message: String,
}

#[tauri::command]
pub fn copilot_runtime_status() -> Result<CopilotRuntimeStatus, String> {
    let candidates = [
        ("copilot", vec!["--version"]),
        ("gh", vec!["copilot", "--version"]),
    ];

    for (cmd, args) in candidates {
        let output = Command::new(cmd).args(args).output();
        if let Ok(result) = output {
            if result.status.success() {
                let stdout = String::from_utf8_lossy(&result.stdout).trim().to_string();
                return Ok(CopilotRuntimeStatus {
                    available: true,
                    version: if stdout.is_empty() { None } else { Some(stdout) },
                    message: format!("Detected runtime via '{}'.", cmd),
                });
            }
        }
    }

    Ok(CopilotRuntimeStatus {
        available: false,
        version: None,
        message: "Copilot runtime CLI was not detected on PATH. Install and authenticate Copilot CLI before enabling this provider.".to_string(),
    })
}

#[tauri::command]
pub async fn test_ai_client_connectivity(
    selected_client: AiClientConfig,
    fallback_api_key: Option<String>,
    fallback_local_api_key: Option<String>,
) -> Result<AiConnectivityResult, String> {
    let mut provider = selected_client.provider.clone();
    let base_url = selected_client.base_url.clone().unwrap_or_default();
    let mut api_key = selected_client
        .api_key
        .clone()
        .unwrap_or_else(|| {
            if provider == "openai-compatible" {
                fallback_local_api_key.clone().unwrap_or_default()
            } else {
                fallback_api_key.clone().unwrap_or_default()
            }
        })
        .trim()
        .to_string();

    if provider == "copilot-sdk" {
        let auth_mode = selected_client
            .copilot_auth_mode
            .clone()
            .unwrap_or_else(|| "subscription".to_string());

        if auth_mode != "byok" {
            return Ok(AiConnectivityResult {
                ok: false,
                message: "Copilot subscription mode runtime dispatch is not wired yet. Use BYOK mode to test live API reachability.".to_string(),
            });
        }

        provider = selected_client
            .copilot_byok_provider
            .clone()
            .unwrap_or_else(|| "openai".to_string());

        if api_key.is_empty() {
            api_key = fallback_api_key.unwrap_or_default();
        }
    }

    if provider == "gemini" {
        let key = if !api_key.is_empty() {
            api_key
        } else {
            let bundled = option_env!("GEMINI_FREE_API_KEY").unwrap_or("").to_string();
            if !bundled.is_empty() {
                bundled
            } else {
                env::var("GEMINI_API_KEY").unwrap_or_default()
            }
        };

        if key.is_empty() {
            return Ok(AiConnectivityResult {
                ok: false,
                message: "Gemini API key is not configured.".to_string(),
            });
        }

        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models?key={}",
            key
        );
        let res = reqwest::Client::new()
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Gemini network error: {}", e))?;

        if res.status().is_success() {
            return Ok(AiConnectivityResult {
                ok: true,
                message: "Gemini models endpoint reachable.".to_string(),
            });
        }

        let status = res.status();
        let body = res.text().await.unwrap_or_default();
        return Ok(AiConnectivityResult {
            ok: false,
            message: format!("Gemini error ({}): {}", status, body),
        });
    }

    if provider == "anthropic" {
        if api_key.is_empty() {
            return Ok(AiConnectivityResult {
                ok: false,
                message: "Anthropic API key is not configured.".to_string(),
            });
        }

        let base = if base_url.trim().is_empty() {
            "https://api.anthropic.com/v1".to_string()
        } else {
            base_url.trim().to_string()
        };

        let url = if base.ends_with('/') {
            format!("{}models", base)
        } else {
            format!("{}/models", base)
        };

        let res = reqwest::Client::new()
            .get(&url)
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .send()
            .await
            .map_err(|e| format!("Anthropic network error: {}", e))?;

        if res.status().is_success() {
            return Ok(AiConnectivityResult {
                ok: true,
                message: "Anthropic models endpoint reachable.".to_string(),
            });
        }

        let status = res.status();
        let body = res.text().await.unwrap_or_default();
        return Ok(AiConnectivityResult {
            ok: false,
            message: format!("Anthropic error ({}): {}", status, body),
        });
    }

    let default_base_url = match provider.as_str() {
        "openai" => "https://api.openai.com/v1",
        "openrouter" => "https://openrouter.ai/api/v1",
        "groq" => "https://api.groq.com/openai/v1",
        "mistral" => "https://api.mistral.ai/v1",
        "xai" => "https://api.x.ai/v1",
        _ => "http://192.168.68.57:1473/v1",
    };

    let base = if base_url.trim().is_empty() {
        default_base_url.to_string()
    } else {
        base_url.trim().to_string()
    };
    let url = if base.ends_with('/') {
        format!("{}models", base)
    } else {
        format!("{}/models", base)
    };

    let mut request = reqwest::Client::new().get(&url);
    if !api_key.is_empty() {
        request = request.header("Authorization", format!("Bearer {}", api_key));
    }
    if provider == "openrouter" {
        request = request.header("HTTP-Referer", "https://gtaurus.local");
    }

    let res = request
        .send()
        .await
        .map_err(|e| format!("LLM network error: {}", e))?;

    if res.status().is_success() {
        Ok(AiConnectivityResult {
            ok: true,
            message: format!("{} models endpoint reachable.", provider),
        })
    } else {
        let status = res.status();
        let body = res.text().await.unwrap_or_default();
        Ok(AiConnectivityResult {
            ok: false,
            message: format!("{} error ({}): {}", provider, status, body),
        })
    }
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
    selected_client: Option<AiClientConfig>,
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

    let resolved_tier = selected_client
        .as_ref()
        .map(|c| c.tier.clone())
        .unwrap_or(ai_tier);
    let mut resolved_provider = selected_client
        .as_ref()
        .map(|c| c.provider.clone())
        .unwrap_or_else(|| if resolved_tier == "local" { "openai-compatible".to_string() } else { "gemini".to_string() });

    let resolved_model = selected_client
        .as_ref()
        .map(|c| c.model.clone())
        .unwrap_or_else(|| {
            if resolved_tier == "local" {
                local_model.clone()
            } else if resolved_tier == "free" {
                free_model.clone()
            } else {
                pro_model.clone()
            }
        });

    let resolved_base_url = selected_client
        .as_ref()
        .and_then(|c| c.base_url.clone())
        .unwrap_or(local_base_url);

    let resolved_api_key = selected_client
        .as_ref()
        .and_then(|c| c.api_key.clone())
        .unwrap_or_else(|| {
            if resolved_provider == "openai-compatible" {
                local_api_key.clone()
            } else {
                api_key.clone()
            }
        });

    if resolved_provider == "copilot-sdk" {
        let auth_mode = selected_client
            .as_ref()
            .and_then(|c| c.copilot_auth_mode.clone())
            .unwrap_or_else(|| "subscription".to_string());

        if auth_mode == "byok" {
            let byok_provider = selected_client
                .as_ref()
                .and_then(|c| c.copilot_byok_provider.clone())
                .unwrap_or_else(|| "openai".to_string());

            resolved_provider = byok_provider;
        } else {
            return Err("Copilot SDK subscription mode is configured, but runtime chat dispatch is not wired yet (C2). Set Auth Mode to BYOK to use OpenAI/Anthropic routing now, or continue with SDK adapter implementation.".to_string());
        }
    }

    if resolved_provider == "anthropic" {
        if resolved_api_key.trim().is_empty() {
            return Err("Anthropic API key is not configured.".to_string());
        }

        let anthropic_messages: Vec<AnthropicMessage> = messages
            .into_iter()
            .filter(|m| m.role != "system")
            .map(|m| AnthropicMessage {
                role: if m.role == "model" { "assistant".to_string() } else { m.role },
                content: m.parts.get(0).map(|p| p.text.clone()).unwrap_or_default(),
            })
            .collect();

        let req_body = AnthropicRequest {
            model: if resolved_model.trim().is_empty() {
                "claude-3-5-sonnet-latest".to_string()
            } else {
                resolved_model.clone()
            },
            system: system_prompt,
            max_tokens: 1024,
            messages: anthropic_messages,
        };

        let base = if resolved_base_url.trim().is_empty() {
            "https://api.anthropic.com/v1".to_string()
        } else {
            resolved_base_url.clone()
        };
        let url = if base.ends_with('/') {
            format!("{}messages", base)
        } else {
            format!("{}/messages", base)
        };

        let client = reqwest::Client::new();
        let res = client
            .post(&url)
            .header("x-api-key", resolved_api_key)
            .header("anthropic-version", "2023-06-01")
            .header("Content-Type", "application/json")
            .json(&req_body)
            .send()
            .await
            .map_err(|e| format!("Anthropic Connection Error: {}", e))?;

        if !res.status().is_success() {
            let status = res.status();
            let err_text = res.text().await.unwrap_or_default();
            return Err(format!("Anthropic API Error ({}): {}", status, err_text));
        }

        let parsed: AnthropicResponse = res
            .json()
            .await
            .map_err(|e| format!("Failed to parse Anthropic JSON: {}", e))?;

        if let Some(err) = parsed.error {
            return Err(format!("Anthropic API Error: {}", err.message));
        }

        if let Some(content) = parsed.content {
            if let Some(first_text) = content.into_iter().find(|p| p.kind == "text") {
                return Ok(first_text.text);
            }
        }

        return Err("Anthropic returned an empty response.".to_string());
    }

    if resolved_provider != "gemini" || resolved_tier == "local" {
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

        let local_model_trimmed = resolved_model.trim();
        let req_body = OpenAIRequest {
            model: if local_model_trimmed.is_empty() { "qwen/qwen2.5-coder-14b".to_string() } else { local_model_trimmed.to_string() },
            messages: openai_messages,
        };

        let default_base_url = match resolved_provider.as_str() {
            "openai" => "https://api.openai.com/v1",
            "openrouter" => "https://openrouter.ai/api/v1",
            "groq" => "https://api.groq.com/openai/v1",
            "mistral" => "https://api.mistral.ai/v1",
            "xai" => "https://api.x.ai/v1",
            _ => "http://192.168.68.57:1473/v1",
        };

        let base_url = if resolved_base_url.is_empty() {
            default_base_url.to_string()
        } else {
            resolved_base_url
        };
        let url = if base_url.ends_with('/') {
            format!("{}chat/completions", base_url)
        } else {
            format!("{}/chat/completions", base_url)
        };

        let client = reqwest::Client::new();
        let mut request = client.post(&url)
            .header("Content-Type", "application/json")
            .json(&req_body);

        if !resolved_api_key.is_empty() {
            request = request.header("Authorization", format!("Bearer {}", resolved_api_key));
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
    let (final_key, model) = if resolved_tier == "free" {
        let bundled = option_env!("GEMINI_FREE_API_KEY").unwrap_or("");
        let key = if !resolved_api_key.trim().is_empty() { resolved_api_key } else { bundled.to_string() };
        (key, if resolved_model.is_empty() { "gemini-1.5-flash".to_string() } else { resolved_model })
    } else {
        let key = if !resolved_api_key.trim().is_empty() { resolved_api_key } else { env::var("GEMINI_API_KEY").unwrap_or_else(|_| "".to_string()) };
        (key, if resolved_model.is_empty() { "gemini-1.5-pro".to_string() } else { resolved_model })
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

