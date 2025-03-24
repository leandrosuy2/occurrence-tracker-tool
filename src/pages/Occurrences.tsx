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
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  AlertTriangle, 
  FileText, 
  MoreVertical, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin,
  List,
  Filter
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
import { formatOccurrenceType } from '@/utils/occurrenceUtils';

const Occurrences: React.FC = () => {
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [filteredOccurrences, setFilteredOccurrences] = useState<Occurrence[]>([]);
  const [policeStations, setPoliceStations] = useState<PoliceStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedOccurrence, setSelectedOccurrence] = useState<Occurrence | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [occurrenceToDelete, setOccurrenceToDelete] = useState<string | null>(null);
  const [isMobileListing, setIsMobileListing] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'accepted' | 'rejected'>('all');
  
  const isMobile = useIsMobile();
  const isAdmin = authService.isAdmin();

  // Lista de tipos de ocorrências disponíveis
  const occurrenceTypes = [
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
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = isAdmin 
        ? await occurrenceService.getAllOccurrences()
        : await occurrenceService.getUserOccurrences();
      const occurrencesData = response.data || [];
      // Sort by date and time
      const sortedOccurrences = occurrencesData.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateB.getTime() - dateA.getTime(); // Most recent first
      });
      setOccurrences(sortedOccurrences);
      setFilteredOccurrences(sortedOccurrences);
      
      const stationsData = await policeStationService.getAllPoliceStations();
      setPoliceStations(stationsData);
    } catch (error) {
      console.error('Error fetching occurrences:', error);
      toast.error('Erro ao carregar ocorrências');
      setOccurrences([]);
      setFilteredOccurrences([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Efeito para filtrar ocorrências quando os tipos ou status mudarem
  useEffect(() => {
    let filtered = [...occurrences];

    // Aplicar filtro de tipo
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(occ => 
        selectedTypes.includes(occ.type)
      );
    }

    // Aplicar filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(occ => {
        switch (statusFilter) {
          case 'open':
            return !occ.resolved;
          case 'accepted':
            return occ.status === 'accepted';
          case 'rejected':
            return occ.status === 'rejected';
          default:
            return true;
        }
      });
    }

    setFilteredOccurrences(filtered);
  }, [selectedTypes, statusFilter, occurrences]);

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
    return formatOccurrenceType(type);
  };

  const toggleTypeFilter = (type: string) => {
    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      }
      return [...prev, type];
    });
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
            Gerencie {isAdmin ? "todas" : "suas"} ocorrências registradas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">Status</p>
              </div>
              <DropdownMenuCheckboxItem
                checked={statusFilter === 'all'}
                onCheckedChange={() => setStatusFilter('all')}
              >
                Todas
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter === 'open'}
                onCheckedChange={() => setStatusFilter('open')}
              >
                Em aberto
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter === 'accepted'}
                onCheckedChange={() => setStatusFilter('accepted')}
              >
                Aceitas
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter === 'rejected'}
                onCheckedChange={() => setStatusFilter('rejected')}
              >
                Recusadas
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">Tipos</p>
              </div>
              {occurrenceTypes.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={selectedTypes.includes(type)}
                  onCheckedChange={() => toggleTypeFilter(type)}
                >
                  {formatOccurrenceType(type)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {!isAdmin && <Button onClick={handleCreateClick}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Ocorrência
          </Button>}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total de Ocorrências</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center">
              <p>Carregando ocorrências...</p>
            </div>
          ) : filteredOccurrences.length === 0 ? (
            <div className="py-10 text-center">
              <p>Nenhuma ocorrência encontrada</p>
            </div>
          ) : (
            <OccurrencesTable 
              occurrences={filteredOccurrences} 
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
