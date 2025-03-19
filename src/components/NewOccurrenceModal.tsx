import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Occurrence } from '@/types';
import { MapPin, AlertCircle, Clock, Info, Navigation, Calendar, Timer, ArrowRight, Map, AlertTriangle } from 'lucide-react';
import authService from '@/services/authService';

interface NewOccurrenceModalProps {
  occurrence: Occurrence | null;
  onClose: () => void;
  onAccept: (occurrence: Occurrence) => void;
  onReject: () => void;
}

// Função para calcular a distância entre dois pontos
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Função para formatar a data
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Função para estimar o tempo de chegada (baseado na distância)
const estimateArrivalTime = (distance: number): string => {
  // Assumindo velocidade média de 40km/h em cidade
  const timeInMinutes = Math.round((distance / 40) * 60);
  if (timeInMinutes < 60) {
    return `${timeInMinutes} minutos`;
  }
  const hours = Math.floor(timeInMinutes / 60);
  const minutes = timeInMinutes % 60;
  return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
};

// Tempo máximo para resposta (em segundos)
const MAX_RESPONSE_TIME = 30;

export const NewOccurrenceModal: React.FC<NewOccurrenceModalProps> = ({
  occurrence,
  onClose,
  onAccept,
  onReject,
}) => {
  const [distance, setDistance] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(MAX_RESPONSE_TIME);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Verifica se o usuário é admin quando o componente é montado
  useEffect(() => {
    const checkAdmin = () => {
      const user = authService.getCurrentUser();
      console.log('Modal - Current user:', user);
      const adminStatus = authService.isAdmin();
      console.log('Modal - Is admin:', adminStatus);
      setIsAdmin(adminStatus);
    };

    checkAdmin();
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
          setLoadingLocation(false);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          setLoadingLocation(false);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (userLocation && occurrence) {
      const dist = calculateDistance(
        userLocation.lat,
        userLocation.lon,
        occurrence.latitude,
        occurrence.longitude
      );
      setDistance(dist);
      setEstimatedTime(estimateArrivalTime(dist));
    }
  }, [userLocation, occurrence]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onReject();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onReject]);

  // Efeito para controlar a abertura do modal quando uma nova ocorrência chegar
  useEffect(() => {
    console.log('Modal - Efeito de ocorrência:', { occurrence, isAdmin });
    if (occurrence && isAdmin) {
      console.log('Modal - Abrindo modal');
      setIsOpen(true);
      setTimeLeft(MAX_RESPONSE_TIME);
    }
  }, [occurrence, isAdmin]);

  console.log('Modal render - occurrence:', occurrence);
  console.log('Modal render - isAdmin:', isAdmin);
  console.log('Modal render - isOpen:', isOpen);

  const handleClose = () => {
    console.log('Modal - Fechando modal');
    setIsOpen(false);
    onClose();
  };

  const handleAccept = () => {
    if (occurrence) {
      console.log('Modal - Aceitando ocorrência');
      onAccept(occurrence);
      handleClose();
    }
  };

  const handleReject = () => {
    console.log('Modal - Rejeitando ocorrência');
    onReject();
    handleClose();
  };

  // Não renderiza o modal se não houver ocorrência ou se o usuário não for admin
  if (!occurrence || !isAdmin) {
    console.log('Modal não renderizado - Razão:', !occurrence ? 'Sem ocorrência' : 'Usuário não é admin');
    return null;
  }

  // Calcula a porcentagem do tempo restante para a barra de progresso
  const progressPercentage = (timeLeft / MAX_RESPONSE_TIME) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] bg-white rounded-lg shadow-xl">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="h-6 w-6 text-red-500" />
              Nova Ocorrência
            </DialogTitle>
            <div className="flex items-center gap-2 text-orange-500">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">{timeLeft}s</span>
            </div>
          </div>
          {/* Barra de progresso */}
          <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <Info className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h4 className="font-semibold text-lg">{occurrence.title}</h4>
              <p className="text-sm text-gray-600">{occurrence.type}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1">
              <Calendar className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h4 className="font-medium">Data e Hora</h4>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(occurrence.date).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })} às {occurrence.time}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1">
              <Clock className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h4 className="font-medium">Descrição</h4>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Criado em {new Date(occurrence.created_at).toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1">
              <MapPin className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h4 className="font-medium">Localização</h4>
              <p className="text-sm text-gray-600">
                {occurrence.latitude.toFixed(6)}, {occurrence.longitude.toFixed(6)}
              </p>
              {loadingLocation ? (
                <p className="text-sm text-gray-500 mt-1">Calculando distância...</p>
              ) : distance !== null ? (
                <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-blue-500" />
                    <p className="text-sm text-blue-600">
                      {distance.toFixed(2)} km de você
                    </p>
                  </div>
                  {estimatedTime && (
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-purple-500" />
                      <p className="text-sm text-purple-600">
                        Tempo estimado de chegada: {estimatedTime}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-red-500 mt-1">Não foi possível calcular a distância</p>
              )}
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            onClick={() => window.open(`https://www.google.com/maps?q=${occurrence.latitude},${occurrence.longitude}`, '_blank')}
          >
            <Map className="h-4 w-4" />
            Abrir no Google Maps
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={handleReject}
            className="bg-red-50 text-red-600 hover:bg-red-100"
          >
            Rejeitar
          </Button>
          <Button 
            onClick={handleAccept}
            className="bg-green-600 hover:bg-green-700"
          >
            Aceitar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 