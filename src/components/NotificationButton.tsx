import React, { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { formatOccurrenceType } from '@/utils/occurrenceUtils';
import { connectNotificationWebSocket, disconnectNotificationWebSocket } from '@/services/notificationWebSocket';
import notificationService from '@/services/notificationService';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string;
  read: boolean;
  isQuick?: boolean;
}

interface NotificationButtonProps {
  isAdmin: boolean;
}

const NotificationButton: React.FC<NotificationButtonProps> = ({ isAdmin }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();

  // Inicializa o elemento de áudio
  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.load();
  }, []);

  // Função para tocar o som de alerta
  const playAlertSound = async () => {
    if (!audioRef.current) return;

    try {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (error) {
      console.log('Erro ao tocar som:', error);
    }
  };

  // Marca interação do usuário quando o dropdown é aberto
  const handleDropdownOpen = () => {
    setHasUserInteracted(true);
  };

  // Efeito para conectar ao Socket.IO e processar eventos
  useEffect(() => {
    // Define o status de admin no serviço de notificação
    notificationService.setAdminStatus(isAdmin);

    // Conecta ao Socket.IO apenas se for admin
    if (isAdmin) {
      connectNotificationWebSocket(isAdmin);
    }

    // Função para processar novas ocorrências
    const handleNewOccurrence = (event: CustomEvent) => {
      const occurrence = event.detail;
      console.log('Nova ocorrência recebida via Socket.IO:', occurrence);
      
      const isQuickOccurrence = occurrence.type === 'OUTROS';

      // Se não for admin, ignora a notificação
      if (!isAdmin) {
        return;
      }

      const newNotification: Notification = {
        id: occurrence.id,
        title: occurrence.title || 'Nova Ocorrência',
        type: occurrence.type,
        date: new Date(occurrence.timestamp).toLocaleDateString(),
        time: new Date(occurrence.timestamp).toLocaleTimeString(),
        read: false,
        isQuick: isQuickOccurrence
      };

      setNotifications(prev => {
        // Evita duplicatas
        if (prev.some(n => n.id === newNotification.id)) {
          return prev;
        }
        return [newNotification, ...prev];
      });

      setUnreadCount(prev => prev + 1);
      
      // Toca o som de alerta
      playAlertSound();
      
      // Mostra toast
      toast.info('Nova ocorrência registrada!', {
        description: `${newNotification.title} - ${formatOccurrenceType(newNotification.type)}`,
        duration: 5000,
        closeButton: false
      });
    };

    // Adiciona listener para o evento customizado
    window.addEventListener('newOccurrence', handleNewOccurrence as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('newOccurrence', handleNewOccurrence as EventListener);
      disconnectNotificationWebSocket();
    };
  }, [isAdmin]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId);
    navigate('/ocorrencias');
  };

  return (
    <DropdownMenu onOpenChange={handleDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2 border-b">
          <h4 className="font-medium">Notificações</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma notificação
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-4 ${
                  !notification.read ? 'bg-muted/50' : ''
                }`}
                onClick={() => handleNotificationClick(notification.id)}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">{notification.title}</span>
                  {!notification.read && (
                    <Badge variant="secondary" className="ml-2">
                      Nova
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatOccurrenceType(notification.type)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date().toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })} às {new Date().toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => setNotifications([])}
            >
              Limpar todas
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationButton; 