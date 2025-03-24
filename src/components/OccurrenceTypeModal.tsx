import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatOccurrenceType } from '@/utils/occurrenceUtils';

export const occurrenceTypes = [
  'AGRESSOES_OU_BRIGAS',
  'APOIO_EM_ACIDENTES_DE_TRANSITO',
  'DEPREDACAO_DO_PATRIMONIO_PUBLICO',
  'EMERGENCIAS_AMBIENTAIS',
  'INVASAO_DE_PREDIOS_OU_TERRENOS_PUBLICOS',
  'MARIA_DA_PENHA',
  'PERTURBACAO_DO_SOSSEGO_PUBLICO',
  'POSSE_DE_ARMAS_BRANCAS_OU_DE_FOGO',
  'PESSOA_SUSPEITA',
  'ROUBOS_E_FURTOS',
  'TENTATIVA_DE_SUICIDIO',
  'USO_E_TRAFICO_DE_DROGAS',
  'VIOLENCIA_DOMESTICA',
  'HOMICIDIO',
  'VANDALISMO',
  'ACIDENTES_DE_TRANSITO',
  'ASSALTO_A_MAO_ARMADA',
  'ASSEDIO',
  'BULLYING',
  'ESTUPRO',
  'EXTORSAO',
  'FRAUDE',
  'INCENDIO',
  'INVASAO_DE_DOMICILIO',
  'LATROCINIO',
  'MOTIM',
  'OUTROS'
] as const;

export type OccurrenceType = typeof occurrenceTypes[number];

interface OccurrenceTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: OccurrenceType) => void;
}

export const OccurrenceTypeModal: React.FC<OccurrenceTypeModalProps> = ({
  open,
  onOpenChange,
  onSelect,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Selecione o tipo da ocorrência</DialogTitle>
          <DialogDescription>
            Escolha o tipo que melhor descreve a situação
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="grid gap-2">
            {occurrenceTypes.map((type) => (
              <Button
                key={type}
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  type === 'OUTROS' && "border-green-500 text-green-700 hover:bg-green-50 hover:text-green-800"
                )}
                onClick={() => {
                  onSelect(type);
                  onOpenChange(false);
                }}
              >
                {formatOccurrenceType(type)}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default OccurrenceTypeModal; 