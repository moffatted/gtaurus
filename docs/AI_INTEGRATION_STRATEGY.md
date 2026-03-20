# AI INTEGRATION STRATEGY

Adding an AI assistant to a custom G-code sender is a significant enhancement that transforms the software from a basic interface into a comprehensive workshop companion. Given the operational risks associated with CNC hardware—where erroneous commands can lead to equipment damage or material loss—the integration architecture must enforce a rigorous separation between AI-driven reasoning and machine execution.
Here is the general outline for implementing this, tailored for a modern desktop application architecture like a Tauri-Rust stack interfacing with a GRBL-style controller.

## 1. The Architectural Outline

To give the AI context and skills, you need to use Function Calling (also known as Tool Use). This allows Gemini to request data from your software or ask your software to perform actions.

## The Context Gathering Phase

When the user asks a question, your Rust backend shouldn't just send the text. It needs to append a hidden payload containing the current machine state (Work Coordinate System, machine coordinates, active G-code modals, current alarms, and controller settings).

## The API Request

You send the System Prompt, the User Prompt, the Machine Context, and a JSON schema of available "Skills" (Tools) to the Gemini API.

## The Tool Loop

If Gemini decides it needs to calculate a feed rate or check a GRBL setting, it replies with a function call request instead of text. Your backend intercepts this, runs the local Rust function, and sends the result back to Gemini.

## The Final Output

Once Gemini has all the data, it generates a text response or a block of G-code.

## The Air Gap (Crucial)

The LLM must never stream commands directly to the serial port. Any G-code generated must be presented in the UI for the user to review and manually execute.

## 2. The System Prompt (The Persona)

This prompt establishes the LLM as a seasoned expert. It defines the tone, the boundaries, and the operational philosophy.

## System Message

```text
You are an expert CNC application engineer and master machinist with decades of experience in subtractive manufacturing, G-code programming, and machine setup. You are assisting a user operating a desktop CNC router/mill.

Your goal is to provide highly accurate, safety-conscious, and practical advice for milling, routing, and toolpath generation. You understand the nuances of speeds and feeds, chip load, tool deflection, and workholding.
```

## Core Directives

### Safety First

Subtractive manufacturing is inherently dangerous. Always assume the user might make a mistake. Remind them of clearance planes (e.g., `G53 Z0`), proper spindle startup, and verifying zero points before running any code.

### Precision and Clarity

When providing G-code snippets, comment every line to explain its purpose.

### Assume Desktop Controller Limitations

Assume the machine is running a GRBL-derivative firmware unless told otherwise. Avoid complex canned cycles (like `G71`/`G72`) or macro variables (`#100`) unless you have confirmed the specific controller supports them. Stick to standard Fanuc-style `G0`, `G1`, `G2`, `G3`, `G20`/`G21`, and `G90`/`G91`.

### No Direct Execution

You cannot move the machine yourself. You can only provide code and recommendations for the user to execute.

### Acknowledge State

Always consider the current machine coordinates and modal states provided in the system context before suggesting movements.

## 3. Agent Skills (Functions/Tools)

You will need to define these as JSON schemas in your API call. These are the "skills" the AI can use to interact with your application.

## `calculate_speeds_and_feeds`

- **Inputs:** Material type, tool diameter, number of flutes, operation type (slotting, profiling, surfacing).
- **Outputs:** Recommended RPM, cutting feed rate (IPM/mm/min), and plunge rate.

## `analyze_gcode_snippet`

- **Inputs:** A string of G-code.
- **Outputs:** Your backend parses the code to calculate bounding box dimensions and flags potential collisions (e.g., plunging without a spinning spindle). The LLM uses this output to explain what the code will do.

## `query_controller_settings`

- **Inputs:** None.
- **Outputs:** Returns the controller's EEPROM settings (e.g., `$0` to `$132` in GRBL), allowing the LLM to know the machine's maximum feed rates, acceleration limits, and soft limits.

## `generate_probing_macro`

- **Inputs:** Probe type (Z-touch plate, edge finder, corner finding).
- **Outputs:** Generates the specific `G38.2` or `G38.3` sequence based on the machine's current unit state (`G20`/`G21`).

## 4. Operational Rules and Guardrails

These should be enforced both by the system prompt and hardcoded into your software's logic.

## State Enforcement

If the user asks "move the spindle out of the way," the LLM must first check the context payload. If the machine is in an Alarm state or hasn't been homed, the LLM must refuse and instruct the user to home the machine first.

## Unit Lock

The LLM must explicitly check if the machine is in `G20` (inches) or `G21` (millimeters) via the `query_controller_settings` tool before outputting any dimensional G-code to avoid catastrophic scale errors.

## Sanity Checking

Your backend should have a hardcoded regex/parser that intercepts the LLM's output. If the LLM generates a feed rate (`F`) that exceeds the machine's maximum feed rate defined in the controller settings, your software should flag it before the user can even click "Run".

---

## 5. Multi-Client Model Strategy (Planned Rewrite)

The current AI Assistant settings support only one active model tier at a time (Free, Pro, or Local). The next evolution is to support a registry of multiple model clients per tier and runtime switching in the AI panel, similar to model switching behavior in Copilot-style interfaces.

### Phase 1: Multi-Client Foundation (Manual Selection)

#### Goals

- Support many configured clients, including multiple Free clients, one or more Pro clients, and one or more Local clients.
- Allow one active client at a time for request execution.
- Preserve backward compatibility with existing single-tier settings.

#### Settings Data Model

Replace tier-specific singleton fields with a client registry in application settings:

- `ai.clients`: array of client configs.
- `ai.activeClientId`: globally selected client.
- `ai.selectionMode`: `"manual" | "auto"` (manual used first).

Each client entry should include:

- `id`: stable unique identifier.
- `name`: user-facing display name.
- `tier`: `"free" | "pro" | "local"` for UX grouping.
- `provider`: e.g. `"gemini"` or `"openai-compatible"`.
- `model`: model identifier.
- `baseUrl` and `apiKey` where applicable.
- `enabled`: soft toggle for routing eligibility.

#### Migration Strategy

On settings initialization, migrate legacy fields into one or more seeded clients:

- `freeModel` + `apiKey` becomes a Free Gemini client.
- `proModel` + `apiKey` becomes a Pro Gemini client.
- `localModel` + `localBaseUrl` + `localApiKey` becomes a Local OpenAI-compatible client.
- Legacy `tier` maps to `activeClientId` selection.

The migration must be idempotent and preserve user data.

#### Settings Panel Rewrite

Rewrite AI settings panel to manage a list of clients instead of single input fields:

- Compact grouped sections for Free, Pro, and Local clients.
- Per-client actions: add, edit, duplicate, delete, activate.
- Per-client model discovery button where provider supports listing.

UI density should remain compact to keep critical actions visible on common laptop heights.

#### Runtime Dispatch Changes

Refactor request dispatch so frontend sends selected client configuration (or selected client id + resolved config) instead of tier-scoped flat arguments.

Backend should route through provider adapters:

- Gemini adapter (Free/Pro variants).
- OpenAI-compatible adapter (Local and future hosted providers).

### Phase 2: Auto Model Selection (Heuristic Routing)

After manual switching is stable, add optional automatic client selection.

#### Model Goals

- Let users choose `selectionMode = "auto"`.
- Pick model clients by deterministic heuristics and fallback order.

#### Candidate Heuristics

- Speed-first: prefer lower-latency clients.
- Quality-first: prefer higher-capability models.
- Local-first: prefer private on-device endpoint when available.

#### Routing Behavior

- Auto mode is disabled by default.
- Router only considers `enabled` clients.
- On client failure, fallback to next eligible client by configured order.
- UI indicates when model choice was auto-selected.

### Validation and Safety Requirements

- Validate required fields by provider before request dispatch.
- Keep strict air-gap rules: AI can suggest, never directly execute machine commands.
- Preserve concise-mode behavior independently of selected model.

### Testing and Verification

- Add store migration tests for legacy-to-registry conversion.
- Add runtime tests for manual and auto routing decisions.
- Add backend tests for provider payload formatting and error handling.
- Add UI tests for client CRUD and active model switching.

### Initial Implementation Scope

Phase 1 implementation starts with:

1. settings schema + migration.
2. backend dispatch contract refactor.
3. settings panel rewrite for multi-client configuration.
4. AI panel model switcher for active client selection.

Phase 2 (auto routing) remains feature-flagged until Phase 1 behavior is validated.

## 6. GitHub Copilot SDK Integration Track

GitHub Copilot can be integrated as a programmable agent platform through the Copilot SDK (Technical Preview). This is a distinct integration path from direct provider HTTP APIs because it uses a Copilot runtime and session orchestration model.

### Why It Is Different

- Standard providers in this document (Gemini, OpenAI-compatible, Anthropic) are called via direct HTTPS APIs.
- Copilot SDK uses a local/runtime Copilot service with session orchestration and tool execution via SDK contracts.
- Authentication and entitlement are tied to Copilot subscription or BYOK flow.

### Target Capabilities for Gtaurus

- Embed Copilot-style planning and multi-step tool usage for CNC troubleshooting workflows.
- Register CNC-specific tools (machine status inspection, settings lookup, G-code checks) for agentic runs.
- Support model selection within Copilot sessions where available (for example, GPT-family or Claude-family backends provided by the platform).

### Proposed Architecture

1. Add a new provider type in settings for Copilot SDK clients (separate from pure HTTP providers).
2. Create a backend adapter module responsible for SDK lifecycle:

- start runtime/session
- send prompt/context
- stream agent events
- map tool calls to internal Rust/Tauri commands

1. Keep existing air-gap enforcement unchanged: generated code is reviewed in UI and never auto-executed.
2. Keep fallback routing so failed Copilot session attempts can roll over to other enabled providers when selection mode allows it.

### Operational Constraints

- SDK is in Technical Preview and APIs may evolve.
- End-user authentication normally requires Copilot entitlement unless BYOK is configured.
- Runtime availability must be validated at startup and surfaced in settings diagnostics.

### Phase Plan for Copilot Track

- Phase C1: Add settings schema fields for Copilot SDK client profile and credentials mode.
- Phase C2: Implement backend adapter shim and session handling.
- Phase C3: Wire frontend selector and provider diagnostics (runtime ready, authenticated, session active).
- Phase C4: Add contract tests for tool invocation bridge and fallback behavior.

### Library/Framework Guidance

There is currently no single Rust crate that fully normalizes all major AI providers and Copilot SDK under one stable API without provider-specific adaptation. The recommended pattern is:

- keep adapter-per-provider modules,
- share common request/response envelope types where possible,
- keep provider-specific auth, endpoint, and payload handling isolated behind adapter traits.
