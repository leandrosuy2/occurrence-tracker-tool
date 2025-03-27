// src/services/socket.ts
import { io } from "socket.io-client";

// Altere a URL conforme necessário (ex.: em produção, use a URL do servidor)
export const socket = io(import.meta.env.VITE_API_URL, {
// export const socket = io("http://localhost:3000", {
  withCredentials: true,
  autoConnect: true,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  forceNew: true,
  path: '/socket.io/',
  query: {
    timestamp: Date.now()
  }
});

// Add global socket event listeners for debugging
socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

socket.on('connect_timeout', (timeout) => {
  console.error('Socket connection timeout:', timeout);
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('Socket disconnected:', reason);
});

// Log all events
socket.onAny((event, ...args) => {
  console.log('📡 Socket event received:', event, args);
});

// Test connection
socket.on('connect', () => {
  console.log('🔌 Socket connected successfully');
  console.log('Socket ID:', socket.id);
  
  // Test emit with acknowledgment
  socket.emit('ping', (response) => {
    console.log('Ping response:', response);
  });
  console.log('Ping event emitted');
});

// Listen for pong response
socket.on('pong', (data) => {
  console.log('Pong received:', data);
});
