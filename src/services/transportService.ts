import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import { listen as tauriListen, EventCallback, UnlistenFn } from '@tauri-apps/api/event';

export const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

class TransportService {
  private socket: WebSocket | null = null;
  private messageQueue: string[] = [];
  private pendingRequests: Map<string, { resolve: (val: any) => void; reject: (err: any) => void }> = new Map();
  private eventListeners: Map<string, Array<EventCallback<any>>> = new Map();
  private requestCounter = 0;
  private reconnectTimeout: number | null = null;

  constructor() {
    if (!isTauri) {
      this.initWebSocket();
    }
  }

  private initWebSocket() {
    const host = window.location.hostname || 'localhost';
    console.log(`[TransportService] Connecting to WebSocket bridge at ws://${host}:9001`);
    this.socket = new WebSocket(`ws://${host}:9001`);
    this.setupHandlers();
  }

  public reconnect(host: string, port: number) {
    console.log(`[TransportService] Manually reconnecting to bridge at ws://${host}:${port}`);
    if (this.socket) {
      this.socket.onclose = null; // Prevent the default reconnect logic
      this.socket.close();
    }
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    
    // Create new connection
    this.socket = new WebSocket(`ws://${host}:${port}`);
    // re-setup all handlers... (re-using the logic from initWebSocket but for the new instance)
    this.setupHandlers();
  }

  private setupHandlers() {
    if (!this.socket) return;
    this.socket.onopen = () => {
      console.log('[TransportService] WebSocket connected to Agent Bridge');
      while (this.messageQueue.length > 0) {
        this.socket?.send(this.messageQueue.shift()!);
      }
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'response') {
          const handler = this.pendingRequests.get(data.id);
          if (handler) {
            if (data.error) {
              handler.reject(data.error);
            } else {
              handler.resolve(data.payload);
            }
            this.pendingRequests.delete(data.id);
          }
        } else if (data.type === 'event') {
          const listeners = this.eventListeners.get(data.event);
          if (listeners) {
            listeners.forEach(callback => {
              callback({
                event: data.event,
                payload: data.payload,
                id: 0,
              });
            });
          }
        }
      } catch (e) {
        console.error('[TransportService] Failed to parse WebSocket message:', e);
      }
    };

    this.socket.onclose = (event) => {
      console.log(`[TransportService] WebSocket closed. Code: ${event.code}, Reason: ${event.reason}. Reconnecting in 3s...`);
      if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = window.setTimeout(() => this.setupHandlers(), 3000);
    };

    this.socket.onerror = (err) => {
      console.error('[TransportService] WebSocket error:', err);
    };
  }

  async invoke<T>(cmd: string, args?: any): Promise<T> {
    if (isTauri) {
      return tauriInvoke<T>(cmd, args);
    }

    return new Promise((resolve, reject) => {
      const id = `req_${++this.requestCounter}`;
      this.pendingRequests.set(id, { resolve, reject });

      const message = JSON.stringify({ type: 'invoke', id, cmd, args });
      
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(message);
      } else {
        this.messageQueue.push(message);
      }
    });
  }

  async listen<T>(event: string, handler: EventCallback<T>): Promise<UnlistenFn> {
    if (isTauri) {
      return tauriListen<T>(event, handler);
    }

    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(handler);

    return Promise.resolve(() => {
      const arr = this.eventListeners.get(event);
      if (arr) {
        this.eventListeners.set(event, arr.filter(cb => cb !== handler));
      }
    });
  }
}

export const transport = new TransportService();
