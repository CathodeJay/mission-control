// Gateway WebSocket client — runs server-side, broadcasts to clients via SSE
import { EventEmitter } from "events";

export type GatewayEvent = {
  type: string;
  [key: string]: unknown;
};

class GatewayClient extends EventEmitter {
  private ws: import("ws").WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connected = false;
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    super();
    this.url = url;
    this.token = token;
  }

  connect() {
    if (this.ws) return;
    this._connect();
  }

  private async _connect() {
    try {
      const { WebSocket } = await import("ws");
      const ws = new WebSocket(this.url);

      ws.on("open", () => {
        console.log("[Gateway] Socket open, waiting for challenge...");
        this.ws = ws;
      });

      ws.on("message", (data: Buffer) => {
        try {
          const msg = JSON.parse(data.toString()) as GatewayEvent;

          // Handle connect.challenge — respond with proper handshake
          if (msg.type === "event" && (msg as any).event === "connect.challenge") {
            const reqId = `mc-${Date.now()}`;
            ws.send(JSON.stringify({
              type: "req",
              id: reqId,
              method: "connect",
              params: {
                minProtocol: 3,
                maxProtocol: 3,
                client: {
                  id: "cli",
                  version: "1.0.0",
                  platform: "macos",
                  mode: "cli",
                },
                role: "operator",
                scopes: ["operator.read", "operator.write"],
                caps: [],
                commands: [],
                permissions: {},
                auth: { token: this.token },
                locale: "en-US",
                userAgent: "mission-control/1.0.0",
              },
            }));
            return;
          }

          // Handle hello-ok response
          if (msg.type === "res" && (msg as any).ok === true && (msg as any).payload?.type === "hello-ok") {
            this.connected = true;
            this.emit("connected");
            console.log("[Gateway] Connected and authenticated");
            // Subscribe to session events for real-time agent status
            ws.send(JSON.stringify({
              type: "req",
              id: `sub-${Date.now()}`,
              method: "sessions.subscribe",
              params: { scope: "all" },
            }));
            return;
          }

          // Forward all other events
          this.emit("event", msg);
          if (msg.type === "event" && (msg as any).event) {
            this.emit((msg as any).event, msg);
          }
        } catch {
          // ignore parse errors
        }
      });

      ws.on("close", () => {
        this.connected = false;
        this.ws = null;
        this.emit("disconnected");
        console.log("[Gateway] Disconnected, reconnecting in 5s...");
        this.reconnectTimer = setTimeout(() => this._connect(), 5000);
      });

      ws.on("error", (err: Error) => {
        console.error("[Gateway] WS error:", err.message);
        ws.terminate();
      });

    } catch (err) {
      console.error("[Gateway] Failed to connect:", err);
      this.reconnectTimer = setTimeout(() => this._connect(), 5000);
    }
  }

  send(msg: GatewayEvent) {
    if (this.ws && this.connected) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  isConnected() {
    return this.connected;
  }

  resolve(requestId: string, approved: boolean, note?: string) {
    this.send({
      type: "exec.approval.resolve",
      requestId,
      approved,
      note: note || "",
    });
  }
}

// Singleton — one connection per server process
let _client: GatewayClient | null = null;

export function getGatewayClient(): GatewayClient {
  if (!_client) {
    const url = process.env.OPENCLAW_GATEWAY_URL || "ws://127.0.0.1:18789";
    const token = process.env.OPENCLAW_GATEWAY_TOKEN || "";
    _client = new GatewayClient(url, token);
    _client.connect();
  }
  return _client;
}
