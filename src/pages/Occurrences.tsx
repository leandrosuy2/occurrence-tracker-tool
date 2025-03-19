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
  MapPin,
  List 
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
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from '@/hooks/use-mobile';
import OccurrencesTable from '@/components/OccurrencesTable';
import authService from '@/services/authService';

const Occurrences: React.FC = () => {
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [policeStations, setPoliceStations] = useState<PoliceStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedOccurrence, setSelectedOccurrence] = useState<Occurrence | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [occurrenceToDelete, setOccurrenceToDelete] = useState<string | null>(null);
  const [isMobileListing, setIsMobileListing] = useState(false);
  
  const isMobile = useIsMobile();
  const isAdmin = authService.isAdmin();

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await occurrenceService.getUserOccurrences();
      const occurrencesData = response.data || [];
      setOccurrences(Array.isArray(occurrencesData) ? occurrencesData : []);
      
      const stationsData = await policeStationService.getAllPoliceStations();
      setPoliceStations(stationsData);
    } catch (error) {
      console.error('Error fetching occurrences:', error);
      toast.error('Erro ao carregar ocorrências');
      setOccurrences([]);
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
  
  // Mobile card list view for occurrences
  const OccurrenceCard = ({ occurrence }: { occurrence: Occurrence }) => (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {getOccurrenceTypeIcon(occurrence.type)}
              <span className="font-medium">{getOccurrenceTypeText(occurrence.type)}</span>
            </div>
            <h3 className="font-semibold text-lg">{occurrence.title}</h3>
            <div className="text-sm text-gray-500 mt-1">
              <p>{occurrence.date} às {occurrence.time}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleMapClick(occurrence)}>
                <MapPin className="h-4 w-4 mr-2" />
                Ver no mapa
              </DropdownMenuItem>
              {!isAdmin && (
                <>
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
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <p className="text-sm mt-2 line-clamp-2">{occurrence.description}</p>
        
        <div className="mt-4">
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-1 p-0" 
            onClick={() => handleMapClick(occurrence)}
          >
            <MapPin className="h-4 w-4" />
            <span>Ver no mapa</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ocorrências</h1>
          <p className="text-muted-foreground">
            Gerencie suas ocorrências registradas
          </p>
        </div>
        <div className="flex gap-2">
          {isMobile && (
            <Button 
              onClick={() => setIsMobileListing(!isMobileListing)} 
              variant="outline"
              size="icon"
            >
              {isMobileListing ? <List className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </Button>
          )}
          {!isAdmin && (
            <Button 
              onClick={handleCreateClick} 
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {!isMobile && "Nova Ocorrência"}
            </Button>
          )}
        </div>
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
            </div>
          ) : (
            <OccurrencesTable 
              occurrences={occurrences} 
              onUpdate={fetchData}
              onEdit={handleEditClick}
              onDelete={(id) => handleDeleteClick(id.toString())}
              isAdmin={isAdmin}
            />
          )}
        </CardContent>
      </Card>

      {/* Form Dialog/Sheet (responsive) */}
      {isMobile ? (
        <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto pt-6 max-w-none">
            <OccurrenceForm 
              occurrence={selectedOccurrence || undefined}
              onSuccess={() => {
                setIsFormOpen(false);
                fetchData();
              }}
              onCancel={() => setIsFormOpen(false)}
            />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
      )}

      {/* Map Dialog/Sheet (responsive) */}
      {isMobile ? (
        <Sheet open={isMapOpen} onOpenChange={setIsMapOpen}>
          <SheetContent side="bottom" className="h-[80vh] pt-6 max-w-none">
            <div className="h-full flex flex-col">
              <h2 className="text-xl font-semibold mb-2">
                {selectedOccurrence?.title}
              </h2>
              <div className="mb-2">
                <p className="text-muted-foreground text-sm">
                  {selectedOccurrence?.description}
                </p>
                <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                  <span>Data: {selectedOccurrence?.date}</span>
                  <span>Hora: {selectedOccurrence?.time}</span>
                  <span>Tipo: {getOccurrenceTypeText(selectedOccurrence?.type || '')}</span>
                </div>
              </div>
              {selectedOccurrence && (
                <div className="flex-1 -mx-6 -mb-8">
                  <Map 
                    occurrences={[selectedOccurrence]}
                    policeStations={policeStations}
                    center={[selectedOccurrence.longitude, selectedOccurrence.latitude]}
                    zoom={14}
                    height="h-full"
                    getUserLocation={true}
                  />
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
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
              <div className="h-[500px]">
                <Map 
                  occurrences={[selectedOccurrence]}
                  policeStations={policeStations}
                  center={[selectedOccurrence.longitude, selectedOccurrence.latitude]}
                  zoom={14}
                  height="h-full"
                  getUserLocation={true}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] md:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Ocorrência</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir esta ocorrência? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col space-y-2 sm:space-y-0 sm:flex-row">
            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
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
