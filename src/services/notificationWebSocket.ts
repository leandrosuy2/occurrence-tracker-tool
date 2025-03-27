import { io, Socket } from 'socket.io-client';
import notificationService from './notificationService';

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let isAdminUser = false;

// Evento customizado para novas ocorrências
const createNewOccurrenceEvent = (data: any) => {
  console.log('Socket.IO - Criando evento newOccurrence com dados:', data);
  return new CustomEvent('newOccurrence', {
    detail: data
  });
};

export const connectNotificationWebSocket = (isAdmin: boolean) => {
  if (socket?.connected) return;
  
  // Se não for admin, não conecta ao WebSocket
  if (!isAdmin) {
    return;
  }

  isAdminUser = isAdmin;
  const socketUrl = import.meta.env.PROD 
    ? 'wss://l2m.tech'
    : import.meta.env.VITE_WS_URL;
    
  socket = io(socketUrl);

  socket.on('connect', () => {
    console.log('Conectado ao servidor de notificações');
    reconnectAttempts = 0;
  });

  socket.on('newOcurrence', (occurrence) => {
    console.log('Nova ocorrência recebida:', occurrence);
    
    // Só mostra a notificação se for admin
    if (isAdminUser) {
      // Mostra a notificação
      notificationService.showNewOccurrenceNotification(occurrence);
      
      // Dispara evento customizado para o NotificationButton
      const event = new CustomEvent('newOccurrence', { detail: occurrence });
      window.dispatchEvent(event);
    }
  });

  socket.on('disconnect', () => {
    console.log('Desconectado do servidor de notificações');
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      setTimeout(() => {
        reconnectAttempts++;
        connectNotificationWebSocket(isAdminUser);
      }, 3000);
    }
  });

  socket.on('error', (error) => {
    console.error('Erro na conexão WebSocket:', error);
  });
};

export const disconnectNotificationWebSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}; 