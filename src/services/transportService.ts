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

  public setMode(mode: 'native' | 'websocket') {
    const nextUseWS = mode === 'websocket' || !isTauri;
    if (this.useWebSocket !== nextUseWS) {
      this.useWebSocket = nextUseWS;
      if (this.useWebSocket) {
        if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
          this.initWebSocket();
        }
      } else {
        if (this.socket) {
          this.socket.onclose = null;
          this.socket.close();
          this.socket = null;
          if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        }
      }
    }
  }

  private initWebSocket() {
    this.currentHost = window.location.hostname || "localhost";
    this.currentPort = 9001;
    this.createSocket(this.currentHost, this.currentPort);
  }

  private createSocket(host: string, port: number) {
    console.log(
      `[TransportService] Connecting to WebSocket bridge at ws://${host}:${port}`,
    );
    this.socket = new WebSocket(`ws://${host}:${port}`);
    this.setupHandlers();
  }

  public reconnect(host: string, port: number) {
    console.log(
      `[TransportService] Manually reconnecting to bridge at ws://${host}:${port}`,
    );
    this.currentHost = host;
    this.currentPort = port;
    if (this.socket) {
      this.socket.onclose = null; // Prevent the default reconnect logic
      this.socket.close();
    }
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);

    // Create new connection
    this.createSocket(host, port);
  }

  private setupHandlers() {
    if (!this.socket) return;
    this.socket.onopen = () => {
      console.log("[TransportService] WebSocket connected to Agent Bridge");
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
        reject(new Error(`[TransportService] Cannot invoke '${cmd}': WebSocket is not connected.`));
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
