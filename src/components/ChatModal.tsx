import React, { useEffect, useRef, useState } from 'react';
import { X, Send, Paperclip, AlertCircle, Bell } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import occurrenceService from '@/services/occurrenceService';
import { toast } from 'sonner';

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

interface ChatMessageData {
  type: 'CHAT_MESSAGE' | 'JOIN_CHAT';
  chatId: string;
  content?: string;
  userId: string;
  userName: string;
  messageType?: 'image';
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  occurrenceId: string;
  userId: string;
  token: string;
  userName: string;
  onStatusChange?: (status: 'EM_ABERTO' | 'ACEITO' | 'ATENDIDO' | 'ENCERRADO') => void;
}

const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  occurrenceId,
  userId,
  token,
  userName,
  onStatusChange
}) => {
  const [isModalOpen, setIsModalOpen] = useState(isOpen);
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatStatus, setChatStatus] = useState<'EM_ABERTO' | 'ACEITO' | 'ATENDIDO' | 'ENCERRADO'>('EM_ABERTO');
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setIsModalOpen(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsModalOpen(false);
    // Limpar estados ao fechar o modal
    setMessages([]);
    setInputMessage('');
    setError(null);
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
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
      console.log('📚 Carregando histórico do chat:', chatId);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/chats/${chatId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar histórico');
      }

      const data = await response.json();
      console.log('📚 Histórico carregado:', data);
      
      // Converter o formato das mensagens do histórico
      const formattedMessages = data.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        userId: msg.user_id,
        userName: msg.user_name || 'Usuário',
        type: msg.message_type || 'text',
        created_at: msg.created_at,
        image_url: msg.image_url
      }));
      
      console.log('📚 Mensagens formatadas:', formattedMessages);
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      setError('Erro ao carregar histórico de mensagens');
    }
  };

  const establishSocketConnection = async (chatId: string) => {
    if (socketRef.current?.connected) return;

    try {
      // Então estabelece a conexão Socket.IO
      const socket = io(import.meta.env.VITE_API_URL, {
        transports: ['websocket']
      });

      console.log('🔌 Tentando conectar Socket.IO...');

      socket.on('connect', () => {
        console.log('✅ Socket.IO Conectado!');
        setIsConnected(true);
        setError(null);

        // Primeiro autenticar
        console.log('🔑 Autenticando socket...');
        socket.emit('authenticate', {
          userId,
          token
        });

        // Depois entrar no chat
        console.log('👋 Entrando no chat:', chatId);
        socket.emit('join_chat', {
          chatId
        });
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ Socket.IO Desconectado:', reason);
        setIsConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('🚨 Erro de conexão Socket.IO:', error);
        setError('Erro na conexão com o chat');
      });

      socket.on('error', (error) => {
        console.error('🚨 Erro Socket.IO:', error);
        setError('Erro na conexão com o chat');
      });

      socket.on('new_message', (message) => {
        console.log('📩 Nova mensagem recebida:', message);
        
        // Verificar se a mensagem é de outro usuário e o modal está fechado
        if (message.user_id !== userId && !isModalOpen) {
          setHasUnreadMessages(true);
          setLastMessageTime(Date.now());
        }

        setMessages(prev => {
          // Verifica se a mensagem já existe
          if (prev.some(m => m.id === message.id)) {
            console.log('📝 Mensagem já existe, ignorando...');
            return prev;
          }

          const newMessage = {
            id: message.id,
            content: message.content,
            userId: message.user_id,
            userName: message.user_name || 'Usuário',
            type: message.message_type || 'text',
            created_at: message.created_at,
            image_url: message.image_url
          };
          console.log('📝 Adicionando nova mensagem ao estado:', newMessage);
          return [...prev, newMessage];
        });
      });

      socket.on('chat_connected', (data) => {
        console.log('👤 Usuário conectou:', data);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          content: `${data.user_name || 'Usuário'} entrou na conversa`,
          type: 'system',
          created_at: new Date().toISOString()
        }]);
      });

      socket.on('chat_closed', () => {
        setChatStatus('ENCERRADO');
        setError('Este chat foi fechado');
        setIsConnected(false);
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      });

      socketRef.current = socket;
    } catch (error) {
      console.error('Erro ao estabelecer conexão:', error);
      setError('Erro ao conectar ao chat');
    }
  };

  const checkChatStatus = async (chatId: string) => {
    try {
      console.log('🔍 Verificando status do chat:', chatId);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/chat/chats/${chatId}/status`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao verificar status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Status do chat:', data);
      
      // Atualiza o status do chat com base no status da ocorrência
      if (data.chat?.ocurrence?.status) {
        setChatStatus(data.chat.ocurrence.status);
      }
      
      // Se o chat estiver encerrado, desconecta
      if (data.chat?.ocurrence?.status === 'ENCERRADO') {
        console.log('❌ Chat está encerrado, desconectando...');
        setIsConnected(false);
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status do chat:', error);
      setError('Erro ao verificar status do chat');
    }
  };

  const closeChat = async (chatId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/chats/${chatId}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao fechar o chat');
      }

      setChatStatus('ENCERRADO');
      setError('Chat fechado com sucesso');
      setIsConnected(false);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    } catch (error) {
      console.error('Erro ao fechar chat:', error);
      setError('Erro ao fechar o chat');
    }
  };

  // Update the initialization effect
  useEffect(() => {
    const initializeChat = async () => {
      try {
        console.log('🚀 Inicializando chat...');
        const apiUrl = import.meta.env.VITE_API_URL;
        const url = `${apiUrl}/api/v1/chat/ocurrences/${occurrenceId}/chat`;
        console.log('📡 Fazendo requisição para:', url);
        console.log('🔑 Token:', token ? 'Presente' : 'Ausente');
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        console.log('📥 Status da resposta:', response.status);
        console.log('📥 Headers da resposta:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Erro na resposta:', errorText);
          throw new Error(`Erro ao inicializar chat: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Dados recebidos:', data);
        
        let newChatId: string;
        
        if (data.id) {
          // Caso de criação de novo chat ou chat existente com ID direto
          newChatId = data.id;
        } else if (data.chat?.id) {
          // Caso de chat existente no formato { chat: { id: ... } }
          newChatId = data.chat.id;
        } else if (typeof data === 'string') {
          // Caso onde o ID é retornado diretamente como string
          newChatId = data;
        } else {
          console.error('Formato de resposta inesperado:', data);
          throw new Error('ID do chat não encontrado na resposta');
        }

        console.log('📝 Chat ID:', newChatId);
        
        setChatId(newChatId);
        
        // Primeiro verificar o status do chat
        if (newChatId) {
          await checkChatStatus(newChatId);
          // Carregar histórico antes de estabelecer a conexão
          await loadChatHistory(newChatId);
          // Estabelecer a conexão
          console.log('🔄 Estabelecendo conexão...');
          await establishSocketConnection(newChatId);
        } else {
          throw new Error('Chat ID inválido');
        }
      } catch (error) {
        console.error('💥 Erro ao inicializar chat:', error);
        setError('Erro ao inicializar o chat');
        setIsConnected(false);
      }
    };

    if (isOpen && token) {
      console.log('🔑 Token disponível, iniciando chat...');
      initializeChat();
    } else {
      console.log('❌ Token não disponível ou modal fechado');
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isOpen, occurrenceId, token]);

  const isChatActive = () => {
    return chatStatus === 'EM_ABERTO' || chatStatus === 'ACEITO';
  };

  const sendMessage = (content: string, type: 'text' | 'image' = 'text') => {
    if (!socketRef.current?.connected || !chatId || !isChatActive()) {
      console.log('❌ Socket.IO não está conectado ou chat não está ativo!');
      return;
    }

    if (!content.trim()) return;

    console.log('📤 Enviando mensagem...');
    const messageData = {
      chatId,
      content,
      type
    };

    console.log('📤 Dados da mensagem:', messageData);
    
    socketRef.current.emit('chat_message', messageData);
    setInputMessage('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !socketRef.current?.connected || !chatId || !isChatActive()) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const messageData = {
        chatId,
        content: e.target?.result as string,
        type: 'image'
      };
      console.log('📤 Dados da imagem:', messageData);
      socketRef.current?.emit('chat_message', messageData);
    };
    reader.readAsDataURL(file);
  };

  const handleStatusChange = async (newStatus: 'EM_ABERTO' | 'ACEITO' | 'ATENDIDO' | 'ENCERRADO') => {
    try {
      await occurrenceService.updateStatus(parseInt(occurrenceId), newStatus);
      setChatStatus(newStatus);
      if (onStatusChange) {
        onStatusChange(newStatus);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  useEffect(() => {
    if (!isModalOpen && hasUnreadMessages) {
      // Mostrar notificação quando houver mensagens não lidas e o modal estiver fechado
      toast('Nova mensagem no chat', {
        icon: <Bell className="w-5 h-5 text-blue-500" />,
        duration: 5000,
        position: 'bottom-right',
        action: {
          label: 'Abrir',
          onClick: () => {
            setIsModalOpen(true);
            setHasUnreadMessages(false);
          }
        }
      });
    }
  }, [hasUnreadMessages, isModalOpen]);

  // Resetar notificações quando o modal for aberto
  useEffect(() => {
    if (isModalOpen) {
      setHasUnreadMessages(false);
    }
  }, [isModalOpen]);

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
              <span className="text-sm text-gray-600">
                • Status: {chatStatus === 'EM_ABERTO' ? 'Aberto' : chatStatus === 'ACEITO' ? 'Aceito' : chatStatus === 'ATENDIDO' ? 'Atendido' : 'Encerrado'}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {/* {chatStatus === 'EM_ABERTO' && (
              <button
                onClick={() => chatId && closeChat(chatId)}
                className="p-2 hover:bg-red-50 rounded-full text-red-600"
                title="Fechar chat"
              >
                <X className="w-6 h-6" />
              </button>
            )} */}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
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
              disabled={!isConnected || !isChatActive()}
            />
            <input
              type="file"
              id="image-input"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageUpload(e)}
              disabled={!isConnected || !isChatActive()}
            />
            <button
              onClick={() => document.getElementById('image-input')?.click()}
              className="p-3 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
              disabled={!isConnected || !isChatActive()}
            >
              <Paperclip className="w-6 h-6 text-gray-600" />
            </button>
            <button
              onClick={() => sendMessage(inputMessage, 'text')}
              className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              disabled={!isConnected || !isChatActive()}
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