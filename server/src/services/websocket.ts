import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';

export type WsEventType =
  | 'LETTER_CREATED'
  | 'LETTER_UPDATED'
  | 'LETTER_DELETED'
  | 'LETTER_REORDERED';

export interface WsEvent {
  type: WsEventType;
  payload: unknown;
}

let wss: WebSocketServer | null = null;

export function initWebSocketServer(server: import('http').Server): void {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    console.log(`[WS] Client connected from ${req.socket.remoteAddress}`);

    ws.on('close', () => {
      console.log('[WS] Client disconnected');
    });

    ws.on('error', (err) => {
      console.error('[WS] Error:', err);
    });
  });

  console.log('[WS] WebSocket server initialized');
}

export function broadcast(event: WsEvent): void {
  if (!wss) return;

  const message = JSON.stringify(event);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
