import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { Occurrence } from "@/types";
import { getAdminStatus } from './adminStatus';

const basePathUrlApiV1 = '/api/v1';
const API_URL = import.meta.env.PROD 
  ? 'https://api.belemsistemas.com'
  : import.meta.env.VITE_API_URL;

class NotificationService {
  private socket: Socket | null = null;
  private static instance: NotificationService;
  private audio: HTMLAudioElement;
  private lastOccurrenceCount: number = 0;
  private notificationSound: string = 'data:audio/wav;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7xA4Tvh9Rz/y8QADBwMWgQAZG/ILNAARQ4GLTcDeIIIhxGOBAuD7hOfBB3/94gcJ3w+o5/5eIAIAAAVwWgQAVQ2ORaIQwEMAJiDg95G4nQL7mQVWI6GwRcfsZAcsKkJvxgxEjzFUgfHoSQ9Qq7KNwqHwuB13MA4a1q/DmBrHgPcmjiGoh//EwC5nGPEmS4RcfkVKOhJf+WOgoxJclFz3kgn//dBA+ya1GhurNn8zb//9NNutNuhz31f////9vt///z+IdAEAAAK4LQIAKobHItEIYCGAExBwe8jcToF9zIKrEdDYIuP2MgOWFSE34wYiR5iqQPj0JIeoVdlG4VD4XA67mAcNa1fhzA1jwHuTRxDUQ//iYBczjHiTJcIuPyKlHQkv/LHQUYkuSi57yQT//uggfZNajQ3Vmz+Zt//+mm3Wm3Q576v////+32///5/EOgAAADVghQAAAAA//uQZAUAB1WI0PZugAAAAAoQwAAAEk3nRd2qAAAAACiDgAAAAAAABCqEEQRLCgwpBGMlJkIz8jKhGvj4k6jzRnqasNKIeoh5gI7BJaC1A1AoNBjJgbyApVS4IDlZgDU5WUAxEKDNmmALHzZp0Fkz1FMTmGFl1FMEyodIavcCAUHDWrKAIA4aa2oCgILEBupZgHvAhEBcZ6joQBxS76AgccrFlczBvKLC0QI2cBoCFvfTDAo7eoOQInqDPBtvrDEZBNYN5xwNwxQRfw8ZQ5wQVLvO8OYU+mHvFLlDh05Mdg7BT6YrRPpCBznMB2r//xKJjyyOh+cImr2/4doscwD6neZjuZR4AgAABYAAAABy1xcdQtxYBYYZdifkUDgzzXaXn98Z0oi9ILU5mBjFANmRwlVJ3/6jYDAmxaiDG3/6xjQQCCKkRb/6kg/wW+kSJ5//rLobkLSiKmqP/0ikJuDaSaSf/6JiLYLEYnW/+kXg1WRVJL/9EmQ1YZIsv/6Qzwy5qk7/+tEU0nkls3/zIUMPKNX/6yZLf+kFgAfgGyLFAUwY//uQZAUABcd5UiNPVXAAAApAAAAAE0VZQKw9ISAAACgAAAAAVQIygIElVrFkBS+Jhi+EAuu+lKAkYUEIsmEAEoMeDmCETMvfSHTGkF5RWH7kz/ESHWPAq/kcCRhqBtMdokPdM7vil7RG98A2sc7zO6ZvTdM7pmOUAZTnJW+NXxqmd41dqJ6mLTXxrPpnV8yreFKfmCKQ8waBnHMTTKn3Iae6xhRUx9PES7LQchy6vRW1g5Lbel//YvKcwdVzXBVdCXaS/3HaMhIYAOAWDIyUUO9JVV8xXlH7K+KrQ0IFP6QVBE2YubYQsB4DvsWG/gRzI9ucdPwFtMwdEKgmgG0A0AEAMDC78AB2AFQSjAAK4AZQBbwEYACCAE8ALIAZgBFACXAI4AV4BCgCXAHcAVYApIA2IB+gC6AIEAMkAbIAyIA9IDMgE8ARoAiw';
  private isAdmin: boolean = false;

  private constructor() {
    this.audio = new Audio(this.notificationSound);
    this.initializeSocket();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private initializeSocket() {
    this.socket = io(API_URL, {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    this.socket.on('connect', () => {
      // console.log('Conectado ao WebSocket de notificações');
    });

    this.socket.on('notification', (data) => {
      console.log('Nova notificação:', data);
      // Mostrar notificação apenas para usuários comuns
      if (!getAdminStatus()) {
        toast.info(data.message, {
          description: data.title,
          duration: 5000,
        });
      }
    });

    this.socket.on('error', (error) => {
      console.error('Erro no WebSocket:', error);
    });
  }

  public setAdminStatus(isAdmin: boolean) {
    // console.log('Definindo status de admin:', isAdmin);
    this.isAdmin = isAdmin;
  }

  public playNotificationSound() {
    if (!this.isAdmin) return;
    this.audio.play().catch(e => console.log("Error playing notification sound:", e));
  }

  public showNewOccurrenceNotification(occurrence: Occurrence) {
    if (!this.isAdmin) return;
    
    // Play sound
    this.playNotificationSound();
    
    // Using a function to render content instead of JSX
    // toast.info(`Nova Ocorrência: ${occurrence.title || 'Sem título'}`, {
    //   position: "top-right",
    //   duration: 5000,
    //   className: "bg-ocorrencia-azul-escuro text-white",
    //   description: `Tipo: ${this.formatOccurrenceType(occurrence.type)} - ${occurrence.date} às ${occurrence.time}`,
    //   closeButton: false
    // });
  }

  public checkForNewOccurrences(currentOccurrences: Occurrence[], onNewOccurrence?: (occurrence: Occurrence) => void) {
    if (!this.isAdmin) return;

    if (this.lastOccurrenceCount === 0) {
      // First load, just update the count without notifications
      this.lastOccurrenceCount = currentOccurrences.length;
      return;
    }

    // If we have more occurrences now than before
    if (currentOccurrences.length > this.lastOccurrenceCount) {
      // Get the new occurrences (assuming they're added to the beginning of the array)
      const newOccurrences = currentOccurrences.slice(0, currentOccurrences.length - this.lastOccurrenceCount);
      
      // Notify for each new occurrence
      newOccurrences.forEach(occurrence => {
        this.showNewOccurrenceNotification(occurrence);
        if (onNewOccurrence) {
          onNewOccurrence(occurrence);
        }
      });
      
      // Update the count
      this.lastOccurrenceCount = currentOccurrences.length;
    }
  }

  private formatOccurrenceType(type: string): string {
    switch (type) {
      case 'AGRESSOES_OU_BRIGAS': return 'Agressões ou brigas';
      case 'APOIO_EM_ACIDENTES_DE_TRANSITO': return 'Apoio em acidentes de trânsito';
      case 'DEPREDACAO_DO_PATRIMONIO_PUBLICO': return 'Depredação do patrimônio público';
      case 'EMERGENCIAS_AMBIENTAIS': return 'Emergências ambientais';
      case 'INVASAO_DE_PREDIOS_OU_TERRENOS_PUBLICOS': return 'Invasão de prédios ou terrenos públicos';
      case 'MARIA_DA_PENHA': return 'Maria da Penha';
      case 'PERTURBACAO_DO_SOSSEGO_PUBLICO': return 'Perturbação do sossego público';
      case 'POSSE_DE_ARMAS_BRANCAS_OU_DE_FOGO': return 'Posse de armas brancas ou de fogo';
      case 'PESSOA_SUSPEITA': return 'Pessoa suspeita';
      case 'ROUBOS_E_FURTOS': return 'Roubos e furtos';
      case 'TENTATIVA_DE_SUICIDIO': return 'Tentativa de suicídio';
      case 'USO_E_TRAFICO_DE_DROGAS': return 'Uso e tráfico de drogas';
      case 'VIOLENCIA_DOMESTICA': return 'Violência doméstica';
      case 'OUTROS': return 'Outros';
      default: return type;
    }
  }

  public sendOccurrenceNotification(occurrenceId: string, message: string) {
    return fetch(`http://localhost:3000/api/v1/notifications/ocurrence/${occurrenceId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default NotificationService.getInstance();
