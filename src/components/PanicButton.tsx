import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle, Siren } from 'lucide-react';
import occurrenceService from '@/services/occurrenceService';
import { toast } from 'sonner';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";

const PanicButton: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePanicClick = () => {
    setIsDialogOpen(true);
  };

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      
      // Get user's current location
      if (!navigator.geolocation) {
        toast.error("Seu navegador não suporta geolocalização");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await occurrenceService.createQuickOccurrence(
              position.coords.latitude,
              position.coords.longitude
            );
            setIsDialogOpen(false);
          } catch (error) {
            console.error('Error creating quick occurrence:', error);
          } finally {
            setIsLoading(false);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error("Não foi possível obter sua localização");
          setIsLoading(false);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 0 
        }
      );
    } catch (error) {
      console.error('Error in panic button:', error);
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          {/* Pulsing background effect */}
          <div className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-75"></div>
          <div className="absolute inset-0 rounded-full bg-red-600 animate-pulse"></div>
          
          {/* Main button */}
          <Button
            onClick={handlePanicClick}
            className="relative h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 shadow-lg flex items-center justify-center group"
            aria-label="Botão de pânico"
          >
            <div className="flex flex-col items-center">
              <Siren className="h-8 w-8 text-white animate-bounce" />
              <span className="text-xs text-white mt-1 font-medium">SOS</span>
            </div>
            
            {/* Tooltip */}
            <div className="absolute right-full mr-4 hidden group-hover:block bg-white px-3 py-1 rounded-md shadow-lg text-sm text-gray-700 whitespace-nowrap">
              Registrar Ocorrência Rápida
            </div>
          </Button>
        </div>
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Registrar Ocorrência Rápida</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a registrar uma ocorrência rápida com sua localização atual.
              Esta ação não pode ser desfeita. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? "Registrando..." : "Registrar Ocorrência"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PanicButton; 