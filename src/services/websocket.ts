let ws: WebSocket | null = null;

// Evento customizado para novas ocorrências
const createNewOccurrenceEvent = (data: any) => {
  console.log('WebSocket - Criando evento newOccurrence com dados:', data);
  return new CustomEvent('newOccurrence', {
    detail: data
  });
};

export const connectWebSocket = () => {
    console.log('WebSocket - Tentando conectar...');
    try {
        ws = new WebSocket('ws://147.79.87.185:3000');

        ws.onopen = () => {
            console.log('WebSocket - 🔌 Conectado');
            // Enviar mensagem de teste
            ws?.send(JSON.stringify({
                type: 'CONNECT',
                data: { clientId: 'frontend' }
            }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('WebSocket - 📩 Mensagem recebida:', data);

                if (data.type === 'NEW_OCURRENCE') {
                    console.log('WebSocket - Nova ocorrência recebida:', data.data);
                    // Disparar evento customizado com os dados da ocorrência
                    const event = createNewOccurrenceEvent(data.data);
                    window.dispatchEvent(event);
                    console.log('WebSocket - Evento newOccurrence disparado');
                }
            } catch (error) {
                console.error('WebSocket - ❌ Erro ao processar mensagem:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket - ❌ Erro:', error);
            console.log('WebSocket - Detalhes do erro:', {
                readyState: ws?.readyState,
                url: ws?.url,
                protocol: ws?.protocol,
                bufferedAmount: ws?.bufferedAmount
            });
        };

        ws.onclose = (event) => {
            console.log('WebSocket - ❌ Desconectado');
            console.log('WebSocket - Código de fechamento:', event.code);
            console.log('WebSocket - Razão:', event.reason);
            console.log('WebSocket - Estado final:', ws?.readyState);
            // Tentar reconectar após 5 segundos
            setTimeout(connectWebSocket, 5000);
        };
    } catch (error) {
        console.error('WebSocket - ❌ Erro ao criar conexão:', error);
        setTimeout(connectWebSocket, 5000);
    }
};

// Conectar ao WebSocket quando o módulo for carregado
connectWebSocket(); 