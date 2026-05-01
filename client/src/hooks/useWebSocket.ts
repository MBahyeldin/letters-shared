import { useEffect, useRef } from 'react';
import { useLettersStore } from '../store/lettersStore';
import type { WsEvent, Letter } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001'; 
const RECONNECT_DELAY = 3000;

export function useWebSocket(): void {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const store = useLettersStore.getState;

  useEffect(() => {
    let mounted = true;

    function connect() {
      if (!mounted) return;
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] Connected');
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data as string) as WsEvent;
          const s = store();

          switch (msg.type) {
            case 'LETTER_CREATED':
              s.applyLetterCreated(msg.payload as Letter);
              break;
            case 'LETTER_UPDATED':
              s.applyLetterUpdated(msg.payload as Letter);
              break;
            case 'LETTER_DELETED':
              s.applyLetterDeleted((msg.payload as { id: string }).id);
              break;
            case 'LETTER_REORDERED':
              s.applyLetterReordered(
                (msg.payload as { orders: { id: string; position: number }[] }).orders
              );
              break;
          }
        } catch (e) {
          console.error('[WS] Failed to parse message', e);
        }
      };

      ws.onclose = () => {
        console.log('[WS] Disconnected, reconnecting...');
        if (mounted) {
          reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      mounted = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [store]);
}
