import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Map from "./Map";
import occurrenceService from "@/services/occurrenceService";
import policeStationService from "@/services/policeStationService";
import { Occurrence, PoliceStation } from "@/types";
import { AlertCircle, Loader2, ImagePlus, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import authService from "@/services/authService";
import { OccurrenceTypeModal, OccurrenceType } from '@/components/OccurrenceTypeModal';

interface ImageWithAuthProps {
  src: string;
  alt: string;
  className?: string;
}

const ImageWithAuth: React.FC<ImageWithAuthProps> = ({ src, alt, className }) => {
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    const loadImage = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(src, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to load image');
        
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
        
        return () => URL.revokeObjectURL(objectUrl);
      } catch (error) {
        console.error('Error loading image:', error);
        setImageUrl(''); // Fallback to empty or a placeholder image
      }
    };

    loadImage();
  }, [src]);

  return <img src={imageUrl} alt={alt} className={className} />;
};

interface OccurrenceFormProps {
  occurrence?: Occurrence;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const OccurrenceForm: React.FC<OccurrenceFormProps> = ({
  occurrence,
  onSuccess,
  onCancel
}) => {
  const [title, setTitle] = useState(occurrence?.title || '');
  const [description, setDescription] = useState(occurrence?.description || '');
  const [type, setType] = useState<string>(occurrence?.type || 'Outros');
  const [date, setDate] = useState(occurrence?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(occurrence?.time || new Date().toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  }));
  const [latitude, setLatitude] = useState(occurrence?.latitude || 0);
  const [longitude, setLongitude] = useState(occurrence?.longitude || 0);
  const [policeStationId, setPoliceStationId] = useState(occurrence?.policeStation_id || '');
  const [policeStations, setPoliceStations] = useState<PoliceStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationSelected, setLocationSelected] = useState(Boolean(occurrence));
  const [gettingLocation, setGettingLocation] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photosPreviews, setPhotosPreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>(occurrence?.photos || []);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  
  const isMobile = useIsMobile();
  const isAdmin = authService.isAdmin();

  useEffect(() => {
    const fetchPoliceStations = async () => {
      try {
        const stations = await policeStationService.getAllPoliceStations();
        setPoliceStations(stations);
        
        // If there's no pre-selected station and we have stations available, select the first one
        if (!policeStationId && stations.length > 0) {
          setPoliceStationId(String(stations[0].id));
        }
      } catch (error) {
        console.error('Error fetching police stations:', error);
        toast.error('Erro ao carregar delegacias');
      }
    };
    
    fetchPoliceStations();
    
    // If not editing, try to get current location
    if (!occurrence) {
      getCurrentLocation();
    }
  }, [policeStationId, occurrence]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setLocationSelected(true);
          setGettingLocation(false);
          toast.success("Localização atual obtida com sucesso");
        },
        (error) => {
          console.error("Erro ao obter localização:", error);
          setGettingLocation(false);
          toast.error("Não foi possível obter sua localização atual. Selecione manualmente no mapa.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      toast.error("Seu navegador não suporta geolocalização. Selecione manualmente no mapa.");
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setLocationSelected(true);
  };

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const validPreviews: string[] = [];
    
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(`A foto ${file.name} excede o limite de 5MB`);
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error(`O arquivo ${file.name} não é uma imagem válida`);
        return;
      }
      
      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    });

    setPhotos(prevPhotos => [...prevPhotos, ...validFiles]);
    setPhotosPreviews(prevPreviews => [...prevPreviews, ...validPreviews]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prevPhotos => {
      const newPhotos = [...prevPhotos];
      newPhotos.splice(index, 1);
      return newPhotos;
    });
    
    setPhotosPreviews(prevPreviews => {
      const newPreviews = [...prevPreviews];
      URL.revokeObjectURL(newPreviews[index]);
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  const handleTypeSelect = (type: OccurrenceType) => {
    setType(type);
    if (type === 'OUTROS') {
      setTitle('Ocorrência rápida' as string);
      setDescription('Ocorrência rápida' as string);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!locationSelected) {
      toast.error('Por favor, selecione uma localização no mapa');
      return;
    }
    
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('type', type);
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
      formData.append('date', date);
      formData.append('time', time);
      if (isAdmin && policeStationId) {
        formData.append('policeStation_id', policeStationId);
      }
      
      // Append existing photos
      existingPhotos.forEach(photo => {
        formData.append('photos', photo);
      });
      
      // Append new photos
      photos.forEach(photo => {
        formData.append('photos', photo);
      });
      
      if (occurrence?.id) {
        await occurrenceService.updateOccurrence(occurrence.id, formData);
        toast.success('Ocorrência atualizada com sucesso!');
      } else {
        await occurrenceService.createOccurrence(formData);
        toast.success('Ocorrência registrada com sucesso!');
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving occurrence:', error);
      toast.error('Erro ao salvar ocorrência');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full mx-auto max-h-[80vh] overflow-y-auto">
      <CardHeader className="sticky top-0 z-10 bg-card">
        <CardTitle>{occurrence ? 'Editar Ocorrência' : 'Nova Ocorrência'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder="Título da ocorrência"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Ocorrência</Label>
              <Select
                value={type}
                onValueChange={(value) => handleTypeSelect(value as OccurrenceType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent position={isMobile ? "popper" : "item-aligned"}>
                  <SelectItem value="AGRESSOES_OU_BRIGAS">Agressões ou brigas</SelectItem>
                  <SelectItem value="APOIO_EM_ACIDENTES_DE_TRANSITO">Apoio em acidentes de trânsito</SelectItem>
                  <SelectItem value="DEPREDACAO_DO_PATRIMONIO_PUBLICO">Depredação do patrimônio público</SelectItem>
                  <SelectItem value="EMERGENCIAS_AMBIENTAIS">Emergências ambientais</SelectItem>
                  <SelectItem value="INVASAO_DE_PREDIOS_OU_TERRENOS_PUBLICOS">Invasão de prédios ou terrenos públicos</SelectItem>
                  <SelectItem value="MARIA_DA_PENHA">Maria da Penha</SelectItem>
                  <SelectItem value="PERTURBACAO_DO_SOSSEGO_PUBLICO">Perturbação do sossego público</SelectItem>
                  <SelectItem value="POSSE_DE_ARMAS_BRANCAS_OU_DE_FOGO">Posse de armas brancas ou de fogo</SelectItem>
                  <SelectItem value="PESSOA_SUSPEITA">Pessoa suspeita</SelectItem>
                  <SelectItem value="ROUBOS_E_FURTOS">Roubos e furtos</SelectItem>
                  <SelectItem value="TENTATIVA_DE_SUICIDIO">Tentativa de suicídio</SelectItem>
                  <SelectItem value="USO_E_TRAFICO_DE_DROGAS">Uso e tráfico de drogas</SelectItem>
                  <SelectItem value="VIOLENCIA_DOMESTICA">Violência doméstica</SelectItem>
                  <SelectItem value="OUTROS">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">Hora</Label>
              <Input
                id="time"
                type="time"
                step="1"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
            
            {/* {isAdmin && (
              <div className="space-y-2">
                <Label htmlFor="policeStation">Delegacia</Label>
                <Select
                  value={policeStationId}
                  onValueChange={setPoliceStationId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a delegacia" />
                  </SelectTrigger>
                  <SelectContent position={isMobile ? "popper" : "item-aligned"} className="max-h-[200px]">
                    {policeStations.map((station) => (
                      <SelectItem key={station.id} value={station.id}>
                        {station.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )} */}

            <div className="space-y-2 flex items-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="w-full"
              >
                {gettingLocation ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Obtendo localização...
                  </>
                ) : (
                  "Usar minha localização atual"
                )}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva detalhes da ocorrência"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Localização
              {!locationSelected && (
                <span className="text-xs text-red-500 font-normal flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Clique no mapa para selecionar
                </span>
              )}
            </Label>
            <div className="border rounded-md overflow-hidden h-[250px] sm:h-[300px] md:h-[350px]">
              <Map
                center={longitude && latitude ? [longitude, latitude] : undefined}
                zoom={longitude && latitude ? 13 : 10}
                onLocationSelect={handleLocationSelect}
                selectionMode={true}
                getUserLocation={!locationSelected}
              />
            </div>
            {locationSelected && (
              <p className="text-xs text-muted-foreground">
                Latitude: {latitude.toFixed(6)}, Longitude: {longitude.toFixed(6)}
              </p>
            )}
          </div>

          {!isAdmin && (
            <div className="space-y-2 col-span-full">
              <Label htmlFor="photos" className="flex items-center gap-2">
                Fotos
                <span className="text-xs text-muted-foreground font-normal">
                  (Máximo 5MB por foto)
                </span>
              </Label>
              <div className="flex flex-col items-center space-y-4">
                {(existingPhotos.length > 0 || photosPreviews.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
                    {existingPhotos.map((photo, index) => (
                      <div key={`existing-${index}`} className="relative">
                        <ImageWithAuth
                          src={`https://l2m.tech/api/v1/images/${photo}`}
                          alt={`Existing ${index + 1}`}
                          className="w-full h-[200px] object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setExistingPhotos(prev => prev.filter((_, i) => i !== index));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {photosPreviews.map((preview, index) => (
                      <div key={`new-${index}`} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-[200px] object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => handleRemovePhoto(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="photos"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImagePlus className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Clique para adicionar fotos
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Você pode selecionar várias fotos
                      </p>
                    </div>
                    <Input
                      id="photos"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotosChange}
                      className="hidden"
                      multiple
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-4 justify-between sticky bottom-0 bg-card pt-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={loading || !locationSelected}
            className="w-full sm:w-auto"
          >
            {loading ? 'Salvando...' : occurrence ? 'Atualizar' : 'Registrar'}
          </Button>
        </CardFooter>
      </form>
      <OccurrenceTypeModal
        open={isTypeModalOpen}
        onOpenChange={setIsTypeModalOpen}
        onSelect={handleTypeSelect}
      />
    </Card>
  );
};

export default OccurrenceForm;
