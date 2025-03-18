import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import api, { basePathUrlApiV1 } from '@/services/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Carregar o arquivo de áudio
    audioRef.current = new Audio('/notification.mp3');

    // Buscar notificações iniciais
    fetchNotifications();

    // Configurar polling para novas notificações
    const interval = setInterval(fetchNotifications, 30000); // Verificar a cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching notifications...');
      const token = localStorage.getItem('token');
      const response = await api.get(`${basePathUrlApiV1}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Notifications response:', response.data);
      
      const newNotifications = response.data;
      
      // Verificar se há novas notificações não lidas
      const newUnreadCount = newNotifications.filter(n => !n.read).length;
      
      // Se houver novas notificações não lidas, tocar o som
      if (newUnreadCount > unreadCount && audioRef.current) {
        console.log('New notification! Playing sound...');
        audioRef.current.play().catch(error => {
          console.error('Error playing sound:', error);
        });
      }

      setNotifications(newNotifications);
      setUnreadCount(newUnreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Erro ao carregar notificações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      console.log('Marking notification as read:', notification.id);
      const token = localStorage.getItem('token');
      // Marcar como lida
      await api.put(`${basePathUrlApiV1}/notifications/${notification.id}/read`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Atualizar estado local
      setNotifications(notifications.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Navegar para a página de ocorrências
      navigate('/ocorrencias');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Erro ao marcar notificação como lida');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
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
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Carregando notificações...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Nenhuma notificação
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`flex flex-col items-start p-4 cursor-pointer ${
                !notification.read ? 'bg-muted' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="font-medium">{notification.title}</div>
              <div className="text-sm text-muted-foreground">{notification.message}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(notification.createdAt).toLocaleString()}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell; 