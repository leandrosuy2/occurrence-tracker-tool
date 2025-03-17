
import { toast } from "sonner";
import { Occurrence } from "@/types";

class NotificationService {
  private audio: HTMLAudioElement;
  private lastOccurrenceCount: number = 0;
  private notificationSound: string = 'data:audio/wav;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7xA4Tvh9Rz/y8QADBwMWgQAZG/ILNAARQ4GLTcDeIIIhxGOBAuD7hOfBB3/94gcJ3w+o5/5eIAIAAAVwWgQAVQ2ORaIQwEMAJiDg95G4nQL7mQVWI6GwRcfsZAcsKkJvxgxEjzFUgfHoSQ9Qq7KNwqHwuB13MA4a1q/DmBrHgPcmjiGoh//EwC5nGPEmS4RcfkVKOhJf+WOgoxJclFz3kgn//dBA+ya1GhurNn8zb//9NNutNuhz31f////9vt///z+IdAEAAAK4LQIAKobHItEIYCGAExBwe8jcToF9zIKrEdDYIuP2MgOWFSE34wYiR5iqQPj0JIeoVdlG4VD4XA67mAcNa1fhzA1jwHuTRxDUQ//iYBczjHiTJcIuPyKlHQkv/LHQUYkuSi57yQT//uggfZNajQ3Vmz+Zt//+mm3Wm3Q576v////+32///5/EOgAAADVghQAAAAA//uQZAUAB1WI0PZugAAAAAoQwAAAEk3nRd2qAAAAACiDgAAAAAAABCqEEQRLCgwpBGMlJkIz8jKhGvj4k6jzRnqasNKIeoh5gI7BJaC1A1AoNBjJgbyApVS4IDlZgDU5WUAxEKDNmmALHzZp0Fkz1FMTmGFl1FMEyodIavcCAUHDWrKAIA4aa2oCgILEBupZgHvAhEBcZ6joQBxS76AgccrFlczBvKLC0QI2cBoCFvfTDAo7eoOQInqDPBtvrDEZBNYN5xwNwxQRfw8ZQ5wQVLvO8OYU+mHvFLlDh05Mdg7BT6YrRPpCBznMB2r//xKJjyyOh+cImr2/4doscwD6neZjuZR4AgAABYAAAABy1xcdQtxYBYYZdifkUDgzzXaXn98Z0oi9ILU5mBjFANmRwlVJ3/6jYDAmxaiDG3/6xjQQCCKkRb/6kg/wW+kSJ5//rLobkLSiKmqP/0ikJuDaSaSf/6JiLYLEYnW/+kXg1WRVJL/9EmQ1YZIsv/6Qzwy5qk7/+tEU0nkls3/zIUMPKNX/6yZLf+kFgAfgGyLFAUwY//uQZAUABcd5UiNPVXAAAApAAAAAE0VZQKw9ISAAACgAAAAAVQIygIElVrFkBS+Jhi+EAuu+lKAkYUEIsmEAEoMeDmCETMvfSHTGkF5RWH7kz/ESHWPAq/kcCRhqBtMdokPdM7vil7RG98A2sc7zO6ZvTdM7pmOUAZTnJW+NXxqmd41dqJ6mLTXxrPpnV8yreFKfmCKQ8waBnHMTTKn3Iae6xhRUx9PES7LQchy6vRW1g5Lbel//YvKcwdVzXBVdCXaS/3HaMhIYAOAWDIyUUO9JVV8xXlH7K+KrQ0IFP6QVBE2YubYQsB4DvsWG/gRzI9ucdPwFtMwdEKgmgG0A0AEAMDC78AB2AFQSjAAK4AZQBbwEYACCAE8ALIAZgBFACXAI4AV4BCgCXAHcAVYApIA2IB+gC6AIEAMkAbIAyIA9IDMgE8ARoAiw';

  constructor() {
    this.audio = new Audio(this.notificationSound);
  }

  public playNotificationSound() {
    this.audio.play().catch(e => console.log("Error playing notification sound:", e));
  }

  public showNewOccurrenceNotification(occurrence: Occurrence) {
    // Play sound
    this.playNotificationSound();
    
    // Corrigido: Vamos usar uma string formatada em vez de JSX 
    // para evitar problemas com o arquivo .ts (não .tsx)
    toast.info(
      () => (
        <div className="flex flex-col gap-1">
          <div className="font-medium">Nova Ocorrência: {occurrence.title}</div>
          <div className="text-sm">Tipo: {this.formatOccurrenceType(occurrence.type)}</div>
          <div className="text-xs">{occurrence.date} às {occurrence.time}</div>
        </div>
      ),
      {
        position: "top-right",
        duration: 5000,
        className: "bg-ocorrencia-azul-escuro text-white",
      }
    );
  }

  public checkForNewOccurrences(currentOccurrences: Occurrence[], onNewOccurrence?: (occurrence: Occurrence) => void) {
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
      case 'homicidio': return 'Homicídio';
      case 'furto': return 'Furto';
      case 'roubo': return 'Roubo';
      default: return 'Outros';
    }
  }
}

// Singleton instance
const notificationService = new NotificationService();
export default notificationService;
