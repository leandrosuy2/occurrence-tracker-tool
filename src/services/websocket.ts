let ws: WebSocket | null = null;
let messageHandlers: ((data: any) => void)[] = [];

// Evento customizado para novas ocorrências
const createNewOccurrenceEvent = (data: any) => {
  console.log('WebSocket - Criando evento newOccurrence com dados:', data);
  return new CustomEvent('newOccurrence', {
    detail: data
  });
};

export const addMessageHandler = (handler: (data: any) => void) => {
  messageHandlers.push(handler);
};

export const removeMessageHandler = (handler: (data: any) => void) => {
  messageHandlers = messageHandlers.filter(h => h !== handler);
};

export const connectWebSocket = (chatId: string, userId: string, token: string, userName: string) => {
    console.log('Conectando ao WebSocket...', { chatId, userId, userName });
    
    // Se já existe uma conexão, fechar
    if (ws) {
        ws.close();
    }

    try {
        ws = new WebSocket(`ws://localhost:3000?chatId=${chatId}&userId=${userId}&token=${token}`);

        ws.onopen = () => {
            console.log('WebSocket conectado');
            // Enviar mensagem de join
            ws?.send(JSON.stringify({
                type: 'JOIN_CHAT',
                chatId,
                userId,
                userName
            }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('Mensagem recebida:', data);
                messageHandlers.forEach(handler => handler(data));
            } catch (error) {
                console.error('Erro ao processar mensagem:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('Erro WebSocket:', error);
            messageHandlers.forEach(handler => handler({
                type: 'ERROR',
                message: 'Erro na conexão'
            }));
        };

        ws.onclose = () => {
            console.log('WebSocket desconectado');
            messageHandlers.forEach(handler => handler({
                type: 'ERROR',
                message: 'Conexão fechada'
            }));
            
            // Tenta reconectar após 3 segundos
            setTimeout(() => connectWebSocket(chatId, userId, token, userName), 3000);
        };
    } catch (error) {
        console.error('Erro ao criar WebSocket:', error);
        messageHandlers.forEach(handler => handler({
            type: 'ERROR',
            message: 'Erro ao criar conexão'
        }));
    }
};

export const sendMessage = (message: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    } else {
        console.error('WebSocket não está conectado');
        messageHandlers.forEach(handler => handler({
            type: 'ERROR',
            message: 'Não está conectado'
        }));
    }
};

export const disconnectWebSocket = () => {
    if (ws) {
        ws.close();
        ws = null;
    }
};

// Não conectar automaticamente ao carregar o módulo
// connectWebSocket(); 