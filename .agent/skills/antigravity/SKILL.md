<skill>
  <name>antigravity</name>
  <description>Automated UI and functional verification using Antigravity AI Assistant.</description>
</skill>

# Antigravity AI Assistant Integration

This skill provides integration with the Antigravity AI Assistant (powered by Auggie) for automated UI and functional verification of the Stock Prediction Simulator.

## Capabilities

- **Automated Browser Testing**: Launch controlled browser instances.
- **User Simulation**: Click, type, and interact with the UI.
- **Visual Regression**: Capture and analyze screenshots.
- **Health Checks**: Monitor console logs and API responses.

## Usage

To use Antigravity for verification, use the `agy` command (aliased to `auggie`).

### Common Tasks

#### 1. Full UI Verification

```bash
agy -i "Perform a full UI verification of the application running at http://localhost:3000. Check the Dashboard, Simulator, and Predictor views for layout issues and responsiveness."
```

#### 2. Functional Testing

```bash
agy -i "Go to the Simulator page, buy 10 shares of MSFT, and verify that the portfolio updates correctly."
```

#### 3. Visual Validation

```bash
agy -i "Take screenshots of all main navigation tabs in both light and dark modes and check for visual inconsistencies."
```

## Setup

Ensure the application is running locally before starting verification:

1. Start the app: `npm run dev` (in `app` directory)
2. In a separate terminal, run `agy` commands.

## Configuration

Antigravity uses the project's context. Ensure you are in the project root when running `agy`.
