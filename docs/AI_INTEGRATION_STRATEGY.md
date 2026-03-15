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
Would you like me to draft an example of the Rust structs and JSON schema required to pass one of these tool definitions (like the speeds and feeds calculator) to the Gemini API?
