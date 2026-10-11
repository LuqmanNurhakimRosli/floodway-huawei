import type { ServerMessage } from '../../types/vision';
import { VISION_WS } from './config';

interface Handlers {
  onMessage: (msg: ServerMessage) => void;
  onOpen: () => void;
  onClose: () => void;
}

/** WebSocket with exponential backoff reconnect. Returns a function that closes it for good. */
export function openVisionSocket({ onMessage, onOpen, onClose }: Handlers): () => void {
  let socket: WebSocket | null = null;
  let stopped = false;
  let attempt = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const connect = () => {
    if (stopped) return;
    socket = new WebSocket(VISION_WS);
    socket.onopen = () => {
      attempt = 0;
      onOpen();
    };
    socket.onmessage = (event) => {
      try {
        onMessage(JSON.parse(event.data) as ServerMessage);
      } catch {
        /* ignore malformed frames */
      }
    };
    socket.onclose = () => {
      onClose();
      if (stopped) return;
      attempt += 1;
      timer = setTimeout(connect, Math.min(15000, 1000 * 2 ** Math.min(attempt, 4)));
    };
    socket.onerror = () => socket?.close();
  };

  connect();
  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    socket?.close();
  };
}
