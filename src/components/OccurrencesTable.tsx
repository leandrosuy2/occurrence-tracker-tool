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
import { Pencil, Trash2, MapPin, AlertTriangle, FileText, Eye, ChevronLeft, ChevronRight, Image, X, Download, MessageCircle, MoreVertical, Edit, Bell } from 'lucide-react';
import { Occurrence } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Map from '@/components/Map';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatOccurrenceType } from '@/utils/occurrenceUtils';
import authService from '@/services/authService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OccurrencesTableProps {
  occurrences: Occurrence[];
  onUpdate: () => void;
  onEdit: (occurrence: Occurrence) => void;
  onDelete: (id: number) => void;
  onChat: (occurrence: Occurrence) => void;
  onNotification: (occurrence: Occurrence) => void;
  isAdmin: boolean;
}

const ITEMS_PER_PAGE = 10;

const OccurrencesTable: React.FC<OccurrencesTableProps> = ({
  occurrences,
  onUpdate,
  onEdit,
  onDelete,
  onChat,
  onNotification,
  isAdmin = false
}): JSX.Element => {
  const [addresses, setAddresses] = useState<Record<number, string>>({});
  const [selectedOccurrence, setSelectedOccurrence] = useState<Occurrence | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);
  const [newMessages, setNewMessages] = useState<Record<string, boolean>>({});

  const userRole = authService.getUserRole();
  const canEditDelete = userRole === 'ADMIN' || userRole === 'SUPERADMIN';

  // console.log('User Role:', userRole);
  // console.log('Can Edit Delete:', canEditDelete);

  const totalPages = Math.ceil(occurrences.length / ITEMS_PER_PAGE);
  const paginatedOccurrences = occurrences.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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

  const handleViewDetails = (occurrence: Occurrence) => {
    setSelectedOccurrence(occurrence);
    setIsDetailsOpen(true);
  };

  const getOccurrenceTypeIcon = (type: string, title: string | null, description: string | null) => {
    if (!title && !description) {
      return <FileText className="h-4 w-4 text-green-500" />;
    }
    if (title && description) {
      return <FileText className="h-4 w-4 text-blue-500" />;
    }

    switch (type) {
      case 'ROUBOS_E_FURTOS':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'VIOLENCIA_DOMESTICA':
      case 'MARIA_DA_PENHA':
        return <FileText className="h-4 w-4 text-orange-500" />;
      case 'POSSE_DE_ARMAS_BRANCAS_OU_DE_FOGO':
        return <FileText className="h-4 w-4 text-yellow-500" />;
      case 'OUTROS':
        return <FileText className="h-4 w-4 text-gray-500" />;
      default:
        return <FileText className="h-4 w-4 text-blue-500" />;
    }
  };

  const getOccurrenceTypeBadge = (type: string, title: string | null, description: string | null) => {
    if (title === "Ocorrência Rápida") {
      return <Badge variant="outline" className="bg-green-100 text-green-700">Ocorrência rápida</Badge>;
    }
    if (title && description) {
      return <Badge variant="outline" className="bg-blue-100 text-blue-700">Ocorrência detalhada</Badge>;
    }

    switch (type) {
      case 'ROUBOS_E_FURTOS':
        return <Badge variant="destructive">Roubos e Furtos</Badge>;
      case 'VIOLENCIA_DOMESTICA':
      case 'MARIA_DA_PENHA':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-700">Violência Doméstica</Badge>;
      case 'POSSE_DE_ARMAS_BRANCAS_OU_DE_FOGO':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Posse de Armas</Badge>;
      case 'OUTROS':
        return <Badge variant="outline" className="bg-gray-100 text-gray-700">Outros</Badge>;
      default:
        return <Badge variant="default">{formatOccurrenceType(type)}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EM_ABERTO':
        return <Badge variant="secondary">Em aberto</Badge>;
      case 'ACEITO':
        return <Badge variant="default">Aceito</Badge>;
      case 'ATENDIDO':
        return <Badge variant="default">Atendido</Badge>;
      case 'ENCERRADO':
        return <Badge variant="default">Encerrado</Badge>;
      default:
        return <Badge variant="secondary">Em aberto</Badge>;
    }
  };

  const getDisplayTitle = (occurrence: Occurrence) => {
    return formatOccurrenceType(occurrence.type);
  };

  const adjustTime = (time: string) => {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, seconds);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const adjustDate = (dateString: string) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handlePhotoClick = (photo: string) => {
    if (selectedOccurrence?.photos) {
      const index = selectedOccurrence.photos.indexOf(photo);
      setCurrentPhotoIndex(index);
      setSelectedPhoto(photo);
      setIsPhotoModalOpen(true);
    }
  };

  const handlePreviousPhoto = () => {
    if (selectedOccurrence?.photos && currentPhotoIndex > 0) {
      const newIndex = currentPhotoIndex - 1;
      setCurrentPhotoIndex(newIndex);
      setSelectedPhoto(selectedOccurrence.photos[newIndex]);
    }
  };

  const handleNextPhoto = () => {
    if (selectedOccurrence?.photos && currentPhotoIndex < selectedOccurrence.photos.length - 1) {
      const newIndex = currentPhotoIndex + 1;
      setCurrentPhotoIndex(newIndex);
      setSelectedPhoto(selectedOccurrence.photos[newIndex]);
    }
  };

  const handleDownloadPhoto = async (photoUrl: string) => {
    try {
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `foto-${currentPhotoIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading photo:', error);
    }
  };

  const getFileUrl = (filename: string) => {
    return `${import.meta.env.VITE_API_URL}/uploads/${filename}`;
  };

  const loadImage = async (filename: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No access token available');
        return;
      }

      const response = await fetch(getFileUrl(filename), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load image: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setImageUrls(prev => ({ ...prev, [filename]: url }));
    } catch (error) {
      console.error('Error loading image:', error);
    }
  };

  useEffect(() => {
    // Load images for all occurrences
    occurrences.forEach(occurrence => {
      if (occurrence.photos) {
        occurrence.photos.forEach(photo => {
          if (!imageUrls[photo]) {
            loadImage(photo);
          }
        });
      }
    });

    // Cleanup function to revoke object URLs
    return () => {
      Object.values(imageUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [occurrences]);

  const ActionsCell = ({ occurrence, onEdit, onDelete, onChat, onNotification, isAdmin }: {
    occurrence: Occurrence;
    onEdit: (occurrence: Occurrence) => void;
    onDelete: (id: number) => void;
    onChat: (occurrence: Occurrence) => void;
    onNotification: (occurrence: Occurrence) => void;
    isAdmin: boolean;
  }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    return (
      <div className="flex items-center gap-2">
        {/* <Button
          variant="ghost"
          size="icon"
          onClick={() => onChat(occurrence)}
          title="Abrir chat"
        >
          <MessageCircle className="h-4 w-4" />
        </Button> */}
        {isAdmin && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(occurrence)}
            // title="Editar ocorrência"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(occurrence.id)}
              title="Excluir ocorrência"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    );
  };

  useEffect(() => {
    const lastMessagesRef: Record<string, string | null> = {};
  
    const initializeChat = async (occurrence: Occurrence) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('Token não encontrado');
          return;
        }

        const apiUrl = import.meta.env.VITE_API_URL;
        const url = `${apiUrl}/api/v1/chat/ocurrences/${occurrence.id}/chat`;
  
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
  
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Erro na resposta:', errorText);
          return;
        }
  
        const data = await response.json();
        const message = data?.chat?.messages?.[0]?.content;
  
        if (!message) {
          console.log('⚠️ Nenhuma mensagem encontrada.');
          return;
        }
  
        if (lastMessagesRef[occurrence.id] !== message) {
          console.log('🆕 Mensagem diferente para ocorrência:', occurrence.id);
          lastMessagesRef[occurrence.id] = message;
          setNewMessages(prev => ({
            ...prev,
            [occurrence.id]: true
          }));
        }
      } catch (error) {
        console.error('💥 Erro ao buscar chat:', error);
      }
    };
  
    // Inicializa o chat para cada ocorrência
    occurrences.forEach(occurrence => {
      initializeChat(occurrence);
    });
  
    const interval = setInterval(() => {
      occurrences.forEach(occurrence => {
        initializeChat(occurrence);
      });
    }, 5000);
  
    return () => clearInterval(interval);
  }, [occurrences]);

  // Função para resetar o estado de nova mensagem para uma ocorrência específica
  const handleChatClick = (occurrence: Occurrence) => {
    setNewMessages(prev => ({
      ...prev,
      [occurrence.id]: false
    }));
    onChat(occurrence);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[150px]">Tipo</TableHead>
              <TableHead className="w-[300px]">Título</TableHead>
              <TableHead className="w-[120px]">Data</TableHead>
              <TableHead className="w-[100px]">Hora</TableHead>
              <TableHead className="w-[100px]">Fotos</TableHead>
              <TableHead className="w-[180px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOccurrences.map((occurrence) => (
              <TableRow key={occurrence.id} className="hover:bg-muted/50">
                <TableCell>
                  {getOccurrenceTypeBadge(occurrence.type, occurrence.title, occurrence.description)}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {getOccurrenceTypeIcon(occurrence.type, occurrence.title, occurrence.description)}
                    <span className={cn(
                      (!occurrence.title && !occurrence.description) && "text-green-700"
                    )}>{getDisplayTitle(occurrence)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {adjustDate(occurrence.date)}
                </TableCell>
                <TableCell>{adjustTime(occurrence.time)}</TableCell>
                <TableCell>
                  {occurrence.photos && occurrence.photos.length > 0 && (
                    <Badge variant="outline" className="bg-purple-100 text-purple-700 cursor-pointer" onClick={() => handleViewDetails(occurrence)}>
                      <Image className="h-4 w-4 mr-1" />
                      {occurrence.photos.length}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewDetails(occurrence)}
                      className="hover:bg-purple-100 dark:hover:bg-purple-900"
                    >
                      <Eye className="h-4 w-4 text-purple-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewLocation(occurrence)}
                      className="hover:bg-blue-100 dark:hover:bg-blue-900"
                    >
                      <MapPin className="h-4 w-4 text-blue-500" />
                    </Button>
                    {onChat && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleChatClick(occurrence)}
                        className="hover:bg-green-100 dark:hover:bg-green-900"
                      >
                        <MessageCircle className="h-4 w-4 text-green-500" />
                        {newMessages[occurrence.id] && (
                          <span className="absolute inline-block h-2 w-2 rounded-full bg-red-500 animate-ping" />
                        )}
                      </Button>
                    )}
                    
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onNotification(occurrence)}
                        className="hover:bg-yellow-100 dark:hover:bg-yellow-900"
                      >
                        <Bell className="h-4 w-4 text-yellow-500" />
                      </Button>
                    )}
                    {canEditDelete && (
                      <ActionsCell occurrence={occurrence} onEdit={onEdit} onDelete={onDelete} onChat={onChat} onNotification={onNotification} isAdmin={isAdmin} />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2 py-4">
        <p className="text-sm text-muted-foreground">
          Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, occurrences.length)} de {occurrences.length} ocorrências
        </p>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getOccurrenceTypeIcon(selectedOccurrence?.type || '', selectedOccurrence?.title, selectedOccurrence?.description)}
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
                <span>Data: {adjustDate(selectedOccurrence?.date || '')}</span>
                <span>Hora: {selectedOccurrence?.time}</span>
                <span>Tipo: {getOccurrenceTypeBadge(selectedOccurrence?.type || '', selectedOccurrence?.title, selectedOccurrence?.description)}</span>
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

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] h-auto max-h-[90vh] overflow-y-auto bg-white p-6">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              {getOccurrenceTypeIcon(selectedOccurrence?.type || '', selectedOccurrence?.title, selectedOccurrence?.description)}
              <span>Detalhes da Ocorrência</span>
            </DialogTitle>
          </DialogHeader>

          {selectedOccurrence && (
            <div className="space-y-6 py-4">
              {/* Título e Tipo */}
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <FileText className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{selectedOccurrence.title || 'Sem título'}</h4>
                    <div className="mt-1">
                      {getOccurrenceTypeBadge(selectedOccurrence.type, selectedOccurrence.title, selectedOccurrence.description)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-base mb-2">Descrição</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {selectedOccurrence.description || 'Sem descrição'}
                  </p>
                </div>
              </div>

              {/* Localização */}
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <MapPin className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-base mb-2">Localização</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {addresses[selectedOccurrence.id] || 'Carregando endereço...'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => {
                      setIsDetailsOpen(false);
                      handleViewLocation(selectedOccurrence);
                    }}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Ver no Mapa
                  </Button>
                </div>
              </div>

              {/* Fotos */}
              {selectedOccurrence.photos && selectedOccurrence.photos.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Image className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-base mb-2">Fotos</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedOccurrence.photos.map((photo, index) => (
                        <div
                          key={index}
                          className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                          onClick={() => handlePhotoClick(photo)}
                        >
                          {imageUrls[photo] && (
                            <img
                              src={imageUrls[photo]}
                              alt={`Foto ${index + 1}`}
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                            <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Informações Adicionais */}
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <FileText className="h-5 w-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-base mb-2">Informações Adicionais</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Data:</span>
                      <span>{adjustDate(selectedOccurrence.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Hora:</span>
                      <span>{adjustTime(selectedOccurrence.time)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Registrado por:</span>
                      <span>{selectedOccurrence.User?.name || 'Usuário não identificado'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Status:</span>
                      {getStatusBadge(selectedOccurrence.status)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPhotoModalOpen} onOpenChange={setIsPhotoModalOpen}>
        <DialogContent className="max-w-[90vw] md:max-w-[80vw] lg:max-w-[1000px] h-[85vh] bg-black border-0 p-0">
          {/* Barra superior */}
          <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-6 py-4 bg-gradient-to-b from-black via-black/50 to-transparent">
            <div className="text-white">
              <h3 className="text-lg font-medium">
                {selectedOccurrence?.title || formatOccurrenceType(selectedOccurrence?.type || '')}
              </h3>
              <p className="text-sm opacity-75">
                Foto {currentPhotoIndex + 1} de {selectedOccurrence?.photos?.length || 0}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedPhoto && imageUrls[selectedPhoto] && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-white/20 text-white rounded-full transition-all duration-200"
                  onClick={() => handleDownloadPhoto(imageUrls[selectedPhoto])}
                >
                  <Download className="h-5 w-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-white/20 text-white rounded-full transition-all duration-200"
                onClick={() => setIsPhotoModalOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Container da imagem */}
          <div className="relative w-full h-full flex items-center justify-center px-12">
            {selectedPhoto && imageUrls[selectedPhoto] && (
              <img
                src={imageUrls[selectedPhoto]}
                alt="Visualização da foto"
                className="max-w-full max-h-[calc(85vh-160px)] object-contain"
              />
            )}

            {/* Botões de navegação */}
            {selectedOccurrence?.photos && selectedOccurrence.photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 hover:bg-white/20 text-white rounded-full w-10 h-10 transition-all duration-200"
                  onClick={handlePreviousPhoto}
                  disabled={currentPhotoIndex === 0}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-white/20 text-white rounded-full w-10 h-10 transition-all duration-200"
                  onClick={handleNextPhoto}
                  disabled={currentPhotoIndex === selectedOccurrence.photos.length - 1}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>

          {/* Miniaturas */}
          {selectedOccurrence?.photos && selectedOccurrence.photos.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black via-black/50 to-transparent">
              <div className="flex justify-center gap-2 overflow-x-auto py-2">
                {selectedOccurrence.photos.map((photo, index) => (
                  imageUrls[photo] && (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentPhotoIndex(index);
                        setSelectedPhoto(photo);
                      }}
                      className={cn(
                        "w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 transition-all duration-200 ring-offset-0",
                        "hover:ring-2 hover:ring-white hover:ring-offset-0",
                        currentPhotoIndex === index
                          ? "ring-2 ring-white opacity-100"
                          : "opacity-50 hover:opacity-75"
                      )}
                    >
                      <img
                        src={imageUrls[photo]}
                        alt={`Miniatura ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  )
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OccurrencesTable; 