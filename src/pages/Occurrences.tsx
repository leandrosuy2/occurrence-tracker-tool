
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertTriangle, 
  FileText, 
  MoreVertical, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin 
} from 'lucide-react';
import OccurrenceForm from '@/components/OccurrenceForm';
import Map from '@/components/Map';
import occurrenceService from '@/services/occurrenceService';
import policeStationService from '@/services/policeStationService';
import { Occurrence, PoliceStation } from '@/types';
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

const Occurrences: React.FC = () => {
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [policeStations, setPoliceStations] = useState<PoliceStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedOccurrence, setSelectedOccurrence] = useState<Occurrence | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [occurrenceToDelete, setOccurrenceToDelete] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const occurrencesData = await occurrenceService.getUserOccurrences();
      setOccurrences(occurrencesData);
      
      const stationsData = await policeStationService.getAllPoliceStations();
      setPoliceStations(stationsData);
    } catch (error) {
      console.error('Error fetching occurrences:', error);
      toast.error('Erro ao carregar ocorrências');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateClick = () => {
    setSelectedOccurrence(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (occurrence: Occurrence) => {
    setSelectedOccurrence(occurrence);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (occurrenceId: string) => {
    setOccurrenceToDelete(occurrenceId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!occurrenceToDelete) return;
    
    try {
      await occurrenceService.deleteOccurrence(occurrenceToDelete);
      toast.success('Ocorrência excluída com sucesso!');
      fetchData();
    } catch (error) {
      console.error('Error deleting occurrence:', error);
      toast.error('Erro ao excluir ocorrência');
    }
    
    setIsDeleteDialogOpen(false);
    setOccurrenceToDelete(null);
  };

  const handleMapClick = (occurrence: Occurrence) => {
    setSelectedOccurrence(occurrence);
    setIsMapOpen(true);
  };

  const getOccurrenceTypeIcon = (type: string) => {
    switch (type) {
      case 'homicidio': 
        return <AlertTriangle className="h-4 w-4 text-ocorrencia-vermelho" />;
      case 'furto': 
        return <FileText className="h-4 w-4 text-yellow-500" />;
      case 'roubo': 
        return <FileText className="h-4 w-4 text-orange-500" />;
      default: 
        return <FileText className="h-4 w-4 text-ocorrencia-azul-medio" />;
    }
  };

  const getOccurrenceTypeText = (type: string) => {
    switch (type) {
      case 'homicidio': return 'Homicídio';
      case 'furto': return 'Furto';
      case 'roubo': return 'Roubo';
      default: return 'Outros';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ocorrências</h1>
          <p className="text-muted-foreground">
            Gerencie suas ocorrências registradas
          </p>
        </div>
        <Button 
          onClick={handleCreateClick} 
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Ocorrência
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Minhas Ocorrências</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center">
              <p>Carregando ocorrências...</p>
            </div>
          ) : occurrences.length === 0 ? (
            <div className="py-10 text-center">
              <p>Nenhuma ocorrência encontrada</p>
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={handleCreateClick}
              >
                Registrar nova ocorrência
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {occurrences.map((occurrence) => (
                  <TableRow key={occurrence.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getOccurrenceTypeIcon(occurrence.type)}
                        <span>{getOccurrenceTypeText(occurrence.type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{occurrence.title}</TableCell>
                    <TableCell>{occurrence.date}</TableCell>
                    <TableCell>{occurrence.time}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="flex items-center gap-1" 
                        onClick={() => handleMapClick(occurrence)}
                      >
                        <MapPin className="h-4 w-4" />
                        <span>Ver no mapa</span>
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditClick(occurrence)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(occurrence.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl">
          <OccurrenceForm 
            occurrence={selectedOccurrence || undefined}
            onSuccess={() => {
              setIsFormOpen(false);
              fetchData();
            }}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Map Dialog */}
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="max-w-4xl">
          <h2 className="text-xl font-semibold mb-4">
            {selectedOccurrence?.title}
          </h2>
          <div className="mb-4">
            <p className="text-muted-foreground">
              {selectedOccurrence?.description}
            </p>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
              <span>Data: {selectedOccurrence?.date}</span>
              <span>Hora: {selectedOccurrence?.time}</span>
              <span>Tipo: {getOccurrenceTypeText(selectedOccurrence?.type || '')}</span>
            </div>
          </div>
          {selectedOccurrence && (
            <Map 
              occurrences={[selectedOccurrence]}
              policeStations={policeStations}
              center={[selectedOccurrence.longitude, selectedOccurrence.latitude]}
              zoom={14}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Ocorrência</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir esta ocorrência? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Occurrences;
