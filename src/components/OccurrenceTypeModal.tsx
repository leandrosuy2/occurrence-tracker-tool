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

export const occurrenceTypes = [
  'Agressões ou brigas',
  'Apoio em acidentes de trânsito',
  'Depredação do patrimônio público',
  'Emergências ambientais',
  'Invasão de prédios ou terrenos públicos',
  'Maria da Penha',
  'Perturbação do sossego público',
  'Posse de armas brancas ou de fogo',
  'Pessoa suspeita',
  'Roubos e furtos',
  'Tentativa de suicídio',
  'Uso e tráfico de drogas',
  'Violência doméstica',
  'Outros'
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
                className="w-full justify-start text-left font-normal"
                onClick={() => {
                  onSelect(type);
                  onOpenChange(false);
                }}
              >
                {type}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default OccurrenceTypeModal; 