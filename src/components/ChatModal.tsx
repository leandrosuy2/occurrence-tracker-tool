import React, { useEffect, useRef, useState } from 'react';
import { X, Send, Paperclip, AlertCircle } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  userId?: string;
  user_id?: string;
  userName?: string;
  created_at: string;
  type?: 'text' | 'image' | 'system';
  image_url?: string | null;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  occurrenceId: string;
  userId: string;
  token: string;
  userName: string;
}

const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  occurrenceId,
  userId,
  token,
  userName
}) => {
  const [isModalOpen, setIsModalOpen] = useState(isOpen);
  const wsRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsModalOpen(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsModalOpen(false);
    onClose();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Carrega o histórico de mensagens
  const loadChatHistory = async (chatId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/chats/${chatId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar histórico');
      }

      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      setError('Erro ao carregar histórico de mensagens');
    }
  };

  const establishWebSocketConnection = async (chatId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      // Primeiro carrega o histórico
      await loadChatHistory(chatId);

      // Então estabelece a conexão WebSocket
      const wsUrl = import.meta.env.PROD 
        ? 'wss://l2m.tech'
        : import.meta.env.VITE_WS_URL;
      
      const ws = new WebSocket(`${wsUrl}?chatId=${chatId}&userId=${userId}&token=${token}`);

      ws.onopen = () => {
        console.log('✅ WebSocket Conectado!');
        setIsConnected(true);
        setError(null);

        // Envia mensagem de join
        ws.send(JSON.stringify({
          type: 'JOIN_CHAT',
          chatId,
          userId,
          userName
        }));
      };

      ws.onclose = () => {
        console.log('❌ WebSocket Desconectado');
        setIsConnected(false);
        wsRef.current = null;

        // Reconexão após 3 segundos
        setTimeout(() => {
          if (isOpen && chatId) {
            establishWebSocketConnection(chatId);
          }
        }, 3000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📩 Mensagem recebida:', data);
          
          switch (data.type) {
            case 'WELCOME':
              console.log('👋 Bem-vindo ao chat!');
              break;

            case 'CHAT_CONNECTED':
              console.log(`👤 ${data.userName} conectou`);
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                content: `${data.userName} entrou na conversa`,
                type: 'system',
                created_at: new Date().toISOString()
              }]);
              break;

            case 'NEW_MESSAGE':
              const message = data.message;
              if (!messages.some(m => m.id === message.id)) {
                setMessages(prev => [...prev, {
                  id: message.id,
                  content: message.content,
                  userId: message.userId,
                  userName: message.userName,
                  type: message.type || 'text',
                  created_at: message.created_at || new Date().toISOString()
                }]);
              }
              break;

            case 'ERROR':
              setError(data.message);
              break;
          }
        } catch (error) {
          console.error('Erro ao processar mensagem:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('🚨 Erro WebSocket:', error);
        setError('Erro na conexão com o chat');
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Erro ao estabelecer conexão:', error);
      setError('Erro ao conectar ao chat');
    }
  };

  // Efeito para inicializar o chat
  useEffect(() => {
    const initializeChat = async () => {
      try {
        console.log('🚀 Inicializando chat...');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/ocurrences/${occurrenceId}/chat`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });
        const data = await response.json();
        const newChatId = data.chat.id;
        console.log('📝 Chat ID:', newChatId);
        
        setChatId(newChatId);
        establishWebSocketConnection(newChatId);
      } catch (error) {
        console.error('💥 Erro ao inicializar chat:', error);
        setError('Erro ao inicializar o chat');
      }
    };

    if (isOpen) {
      initializeChat();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isOpen, occurrenceId, token]);

  const sendMessage = (content: string, type: 'text' | 'image' = 'text') => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !chatId) {
      console.log('❌ WebSocket não está conectado!');
      return;
    }

    if (!content.trim()) return;

    console.log('📤 Enviando mensagem...');
    const messageData = {
      type: 'CHAT_MESSAGE',
      chatId,
      content,
      userId,
      userName,
      messageType: type
    };

    wsRef.current.send(JSON.stringify(messageData));
    setInputMessage('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !wsRef.current || !chatId || wsRef.current.readyState !== WebSocket.OPEN) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const messageData = {
        type: 'CHAT_MESSAGE',
        chatId,
        content: e.target?.result,
        userId,
        userName,
        messageType: 'image'
      };

      wsRef.current?.send(JSON.stringify(messageData));
    };
    reader.readAsDataURL(file);
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl h-[600px] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold">Chat da Ocorrência</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-4 mt-4 rounded">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.userId === userId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.type === 'system'
                    ? 'bg-gray-100 text-gray-600 text-center w-full text-sm italic'
                    : message.userId === userId
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border border-gray-200'
                }`}
              >
                {message.type !== 'system' && (
                  <div className={`text-sm mb-1 ${
                    message.userId === userId
                      ? 'text-blue-100'
                      : 'text-gray-500'
                  }`}>
                    {message.userName}
                  </div>
                )}
                {(message.type === 'image' || message.content?.startsWith('data:image')) ? (
                  <img
                    src={message.content}
                    alt="Imagem compartilhada"
                    className="mt-2 max-w-full rounded-lg shadow-sm"
                    style={{ maxHeight: '200px', objectFit: 'contain' }}
                  />
                ) : (
                  <p className="break-words leading-relaxed">{message.content}</p>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputMessage)}
              placeholder="Digite sua mensagem..."
              className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              disabled={!isConnected || !chatId}
            />
            <input
              type="file"
              id="image-input"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageUpload(e)}
              disabled={!isConnected || !chatId}
            />
            <button
              onClick={() => document.getElementById('image-input')?.click()}
              className="p-3 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
              disabled={!isConnected || !chatId}
            >
              <Paperclip className="w-6 h-6 text-gray-600" />
            </button>
            <button
              onClick={() => sendMessage(inputMessage, 'text')}
              className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              disabled={!isConnected || !chatId}
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal; 