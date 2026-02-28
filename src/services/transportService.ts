/**
 * @file transportService.ts
 * @purpose Unified communication layer for interacting with the machine via either Tauri native commands or WebSocket bridge.
 */
import { invoke as tauriInvoke } from "@tauri-apps/api/core";
import {
  listen as tauriListen,
  EventCallback,
  UnlistenFn,
} from "@tauri-apps/api/event";

export const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

class TransportService {
  private socket: WebSocket | null = null;
  private messageQueue: string[] = [];
  private pendingRequests: Map<
    string,
    { resolve: (val: any) => void; reject: (err: any) => void }
  > = new Map();
  private eventListeners: Map<string, Array<EventCallback<any>>> = new Map();
  private requestCounter = 0;
  private reconnectTimeout: number | null = null;

  private currentHost: string | null = null;
  private currentPort: number | null = null;
  private useWebSocket: boolean = false;

  constructor() {
    this.useWebSocket = !isTauri;
    if (this.useWebSocket) {
      this.initWebSocket();
    }
  }

  public isWebSocketMode() {
    return this.useWebSocket;
  }

  public setMode(mode: 'native' | 'websocket') {
    const nextUseWS = mode === 'websocket' || !isTauri;
    if (this.useWebSocket !== nextUseWS) {
      console.log(`[TransportService] Switching transport mode to: ${nextUseWS ? 'WebSocket' : 'Native'}`);
      this.useWebSocket = nextUseWS;
      if (!this.useWebSocket) {
        if (this.socket) {
          console.log("[TransportService] Disconnecting WebSocket as we switched to Native mode.");
          this.socket.onclose = null;
          this.socket.close();
          this.socket = null;
        }
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
      }
    }
  }

  private initWebSocket() {
    this.currentHost = import.meta.env.VITE_BACKEND_HOST || window.location.hostname || "localhost";
    const envPort = import.meta.env.VITE_BACKEND_PORT;
    this.currentPort = envPort ? Number(envPort) : 9001;
    this.createSocket(this.currentHost as string, this.currentPort);
  }

  private createSocket(host: string, port: number) {
    console.log(
      `[TransportService] Connecting to WebSocket bridge at ws://${host}:${port}`,
    );
    this.socket = new WebSocket(`ws://${host}:${port}`);
    this.setupHandlers();
  }

  public async waitForConnection(timeoutMs = 5000): Promise<boolean> {
    if (this.socket?.readyState === WebSocket.OPEN) return true;
    if (!this.socket || this.socket.readyState === WebSocket.CLOSED) return false;
    
    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        if (!this.socket || this.socket.readyState === WebSocket.OPEN) {
          const isOpen = this.socket?.readyState === WebSocket.OPEN;
          if (isOpen) console.log("[TransportService] WebSocket connection established successfully.");
          resolve(isOpen);
        } else if (this.socket.readyState === WebSocket.CLOSED) {
          console.warn("[TransportService] WebSocket connection failed (CLOSED state).");
          resolve(false);
        } else if (Date.now() - start > timeoutMs) {
          console.warn("[TransportService] WebSocket connection timed out.");
          resolve(false);
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  public async reconnect(host: string, port: number) {
    this.useWebSocket = true;
    console.log(
      `[TransportService] Manually reconnecting to bridge at ws://${host}:${port}`,
    );
    this.currentHost = host;
    this.currentPort = port;
    
    if (this.socket) {
      console.log("[TransportService] Closing existing socket for reconnection...");
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onerror = null;
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Clear and reject stale state
    const staleCount = this.pendingRequests.size;
    this.pendingRequests.forEach(req => req.reject(new Error("Connection reset due to manual reconnection.")));
    this.pendingRequests.clear();
    this.messageQueue = [];
    if (staleCount > 0) {
        console.log(`[TransportService] Rejected ${staleCount} stale pending requests.`);
    }

    // Create new connection
    this.createSocket(host, port);
    return this.waitForConnection();
  }

  private setupHandlers() {
    if (!this.socket) return;
    this.socket.onopen = () => {
      console.log("[TransportService] WebSocket connected to Agent Bridge");
      this.useWebSocket = true; // Auto-switch to bridge mode on success
      while (this.messageQueue.length > 0) {
        this.socket?.send(this.messageQueue.shift()!);
      }
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "response") {
          const handler = this.pendingRequests.get(data.id);
          if (handler) {
            if (data.error) {
              handler.reject(data.error);
            } else {
              handler.resolve(data.payload);
            }
            this.pendingRequests.delete(data.id);
          }
        } else if (data.type === "event") {
          const listeners = this.eventListeners.get(data.event);
          if (listeners) {
            listeners.forEach((callback) => {
              callback({
                event: data.event,
                payload: data.payload,
                id: 0,
              });
            });
          }
        }
      } catch (e) {
        console.error(
          "[TransportService] Failed to parse WebSocket message:",
          e,
        );
      }
    };

    this.socket.onclose = (event) => {
      console.log(
        `[TransportService] WebSocket closed. Code: ${event.code}, Reason: ${event.reason}. Reconnecting in 3s...`,
      );
      if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = window.setTimeout(() => {
        if (this.currentHost && this.currentPort) {
          this.createSocket(this.currentHost, this.currentPort);
        } else {
          this.initWebSocket();
        }
      }, 3000);
    };

    this.socket.onerror = (err) => {
      console.error("[TransportService] WebSocket error:", err);
    };
  }

  async invoke<T>(cmd: string, args?: any): Promise<T> {
    if (!this.useWebSocket && isTauri) {
      return tauriInvoke<T>(cmd, args);
    }

    return new Promise((resolve, reject) => {
      const id = `req_${++this.requestCounter}`;
      
      const message = JSON.stringify({ type: "invoke", id, cmd, args });

      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.pendingRequests.set(id, { resolve, reject });
        this.socket.send(message);
      } else if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
        this.pendingRequests.set(id, { resolve, reject });
        this.messageQueue.push(message);
      } else {
        if (cmd === "get_connection_status" || cmd === "get_status") {
          return resolve("Disconnected" as any);
        }
        reject(new Error(`[TransportService] Cannot invoke '${cmd}': WebSocket is not connected (State: ${this.socket?.readyState}).`));
      }
    });
  }

  async listen<T>(
    event: string,
    handler: EventCallback<T>,
  ): Promise<UnlistenFn> {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(handler);
    const websocketUnsub = () => {
      const arr = this.eventListeners.get(event);
      if (arr) {
        this.eventListeners.set(
          event,
          arr.filter((cb) => cb !== handler),
        );
      }
    };

    let tauriUnsub: UnlistenFn | null = null;
    if (isTauri) {
      tauriUnsub = await tauriListen<T>(event, handler);
    }

    return () => {
      websocketUnsub();
      if (tauriUnsub) tauriUnsub();
    };
  }
}

export const transport = new TransportService();
