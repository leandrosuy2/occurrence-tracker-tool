import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, MapPin, AlertTriangle, FileText } from 'lucide-react';
import { Occurrence } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Map from '@/components/Map';
import { Badge } from "@/components/ui/badge";

interface OccurrencesTableProps {
  occurrences: Occurrence[];
  onUpdate: () => void;
  onEdit: (occurrence: Occurrence) => void;
  onDelete: (id: string) => void;
  isAdmin?: boolean;
}

const OccurrencesTable: React.FC<OccurrencesTableProps> = ({ 
  occurrences, 
  onUpdate,
  onEdit,
  onDelete,
  isAdmin = false
}) => {
  const [addresses, setAddresses] = useState<Record<number, string>>({});
  const [selectedOccurrence, setSelectedOccurrence] = useState<Occurrence | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const fetchAddress = async (occurrence: Occurrence) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${occurrence.latitude}&lon=${occurrence.longitude}&zoom=18&addressdetails=1&accept-language=pt-BR`
      );
      const data = await response.json();
      
      if (data.display_name) {
        setAddresses(prev => ({
          ...prev,
          [occurrence.id]: data.display_name
        }));
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      setAddresses(prev => ({
        ...prev,
        [occurrence.id]: `${occurrence.latitude.toFixed(6)}, ${occurrence.longitude.toFixed(6)}`
      }));
    }
  };

  useEffect(() => {
    occurrences.forEach(occurrence => {
      if (!addresses[occurrence.id]) {
        fetchAddress(occurrence);
      }
    });
  }, [occurrences]);

  const handleViewLocation = (occurrence: Occurrence) => {
    setSelectedOccurrence(occurrence);
    setIsMapOpen(true);
  };

  const getOccurrenceTypeIcon = (type: string) => {
    switch (type) {
      case 'homicidio': 
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'furto': 
        return <FileText className="h-4 w-4 text-yellow-500" />;
      case 'roubo': 
        return <FileText className="h-4 w-4 text-orange-500" />;
      default: 
        return <FileText className="h-4 w-4 text-blue-500" />;
    }
  };

  const getOccurrenceTypeBadge = (type: string) => {
    switch (type) {
      case 'homicidio': 
        return <Badge variant="destructive">Homicídio</Badge>;
      case 'furto': 
        return <Badge variant="secondary">Furto</Badge>;
      case 'roubo': 
        return <Badge variant="secondary">Roubo</Badge>;
      default: 
        return <Badge variant="default">Outros</Badge>;
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[300px]">Título</TableHead>
              <TableHead className="w-[150px]">Tipo</TableHead>
              <TableHead className="w-[120px]">Data</TableHead>
              <TableHead className="w-[100px]">Hora</TableHead>
              <TableHead className="w-[120px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {occurrences.map((occurrence) => (
              <TableRow key={occurrence.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {getOccurrenceTypeIcon(occurrence.type)}
                    <span>{occurrence.title || 'Sem título'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {getOccurrenceTypeBadge(occurrence.type)}
                </TableCell>
                <TableCell>
                  {new Date(occurrence.date).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </TableCell>
                <TableCell>{occurrence.time}</TableCell>
                <TableCell>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewLocation(occurrence)}
                      className="hover:bg-blue-100 dark:hover:bg-blue-900"
                    >
                      <MapPin className="h-4 w-4 text-blue-500" />
                    </Button>
                    {!isAdmin && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(occurrence)}
                          className="hover:bg-yellow-100 dark:hover:bg-yellow-900"
                        >
                          <Pencil className="h-4 w-4 text-yellow-500" />
                        </Button>
                        {/* <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(occurrence.id.toString())}
                          className="hover:bg-red-100 dark:hover:bg-red-900"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button> */}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getOccurrenceTypeIcon(selectedOccurrence?.type || '')}
              <span>{selectedOccurrence?.title || 'Localização da Ocorrência'}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-500" />
                <p className="text-sm text-muted-foreground">
                  {addresses[selectedOccurrence?.id || 0] || 'Carregando endereço...'}
                </p>
              </div>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                <span>Data: {new Date(selectedOccurrence?.date || '').toLocaleDateString('pt-BR')}</span>
                <span>Hora: {selectedOccurrence?.time}</span>
                <span>Tipo: {getOccurrenceTypeBadge(selectedOccurrence?.type || '')}</span>
              </div>
            </div>
            {selectedOccurrence && (
              <div className="h-[500px]">
                <Map 
                  occurrences={[selectedOccurrence]}
                  policeStations={[]}
                  center={[selectedOccurrence.longitude, selectedOccurrence.latitude]}
                  zoom={14}
                  height="h-full"
                  getUserLocation={true}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OccurrencesTable; 