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
    const wsUrl = import.meta.env.PROD 
      ? 'wss://l2m.tech/ws'
      : import.meta.env.VITE_WS_URL + '/ws';
      
    ws.current = new WebSocket(wsUrl);

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
      // Tenta reconectar após 3 segundos
      if (ws.current?.readyState === WebSocket.CLOSED) {
        console.log('Tentando reconectar WebSocket...');
        ws.current = new WebSocket(wsUrl);
      }
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