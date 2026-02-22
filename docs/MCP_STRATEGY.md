# MCP Strategy for Gtaurus

This document outlines the Model Context Protocol (MCP) strategy for Gtaurus.

## Concept

MCP allows AI agents to interact with the Gtaurus application and its hardware context in a standardized way.

For more information, see the [Model Context Protocol documentation](https://modelcontextprotocol.io/).

## Proposed MCP Servers

### 1. Serial Port Supervisor

**Purpose**: Allow an AI to see what serial ports are available and inspect traffic logs.

- **Tools**: `list_ports`, `read_log(n_lines)`.
- **Resources**: `serial://logs/current`.

### 2. FluidNC Simulator (Planned)

**Purpose**: Simulate an MKS DLC32 board for testing without hardware.

- **Location**: `mcp-server/simulator.ts`.
- **Function**: Opens a virtual serial port (PTY on Linux/Mac, COM0COM on Windows) and responds to GRBL commands.

### 3. Documentation Search

**Purpose**: Semantic search over FluidNC Wiki and Gtaurus internal docs.

- **Tools**: `query_docs(text)`.

## Integration

To enable these MCPs in your AI IDE (e.g., Cursor, Windsurf):

1. Go to **MCP Settings**.
2. Add a command to run the server script for the simulator:

    ```json
    {
      "gtaurus-simulator": {
        "command": "node",
        "args": ["path/to/mcp-server/simulator.js"]
      }
    }
    ```

3. To add the Serial Port Supervisor (if implemented separately):

    ```json
    {
      "mcp-servers": {
        "gtaurus-serial": {
          "command": "node",
          "args": ["path/to/mcp-server/serial-port.js"]
        }
      }
    }
    ```
