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
import OccurrenceTypeModal, { OccurrenceType } from './OccurrenceTypeModal';
import { formatOccurrenceType } from '@/utils/occurrenceUtils';

const PanicButton: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<OccurrenceType | null>(null);

  const handlePanicClick = () => {
    setIsDialogOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedType) {
      toast.error("Por favor, selecione o tipo da ocorrência");
      return;
    }

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
              position.coords.longitude,
              selectedType
            );
            setIsDialogOpen(false);
            setSelectedType(null);
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
            <AlertDialogDescription className="space-y-4">
              <p>Você está prestes a registrar uma ocorrência rápida com sua localização atual.
              Esta ação não pode ser desfeita.</p>
              
              <div className="flex flex-col gap-2">
                <Button
                  variant={selectedType ? "outline" : "secondary"}
                  onClick={() => setIsTypeModalOpen(true)}
                  className="w-full flex items-center gap-2"
                >
                  {selectedType ? (
                    <span>{formatOccurrenceType(selectedType)}</span>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4" />
                      <span>Selecione o tipo da ocorrência</span>
                    </>
                  )}
                </Button>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading || !selectedType}
            >
              {isLoading ? "Registrando..." : "Registrar Ocorrência"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <OccurrenceTypeModal
        open={isTypeModalOpen}
        onOpenChange={setIsTypeModalOpen}
        onSelect={setSelectedType}
      />
    </>
  );
};

export default PanicButton; 