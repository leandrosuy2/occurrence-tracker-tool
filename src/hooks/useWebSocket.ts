import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export const useWebSocket = () => {
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Conecta ao WebSocket
    // ws.current = new WebSocket('wss://l2m.tech/ws');
    ws.current = new WebSocket('ws://localhost:3000/ws');

    // Configura os event listeners
    ws.current.onopen = () => {
      console.log('WebSocket conectado');
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WebSocket - 📩 Mensagem recebida:', message);
        
        if (message.type === 'NEW_OCURRENCE') {
          console.log('WebSocket - Nova ocorrência recebida:', message.data);
          setLastMessage(message);
        }
      } catch (error) {
        console.error('Erro ao processar mensagem WebSocket:', error);
      }
    };

    ws.current.onerror = (error) => {
      console.error('Erro na conexão WebSocket:', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket desconectado');
      // Tenta reconectar após 5 segundos
      setTimeout(() => {
        if (ws.current?.readyState === WebSocket.CLOSED) {
          console.log('Tentando reconectar WebSocket...');
          // ws.current = new WebSocket('wss://l2m.tech/ws');
          ws.current = new WebSocket('ws://localhost:3000/ws');
        }
      }, 5000);
    };

    // Cleanup
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return { lastMessage };
}; 