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
import { AlertCircle, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import authService from "@/services/authService";

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
  const [type, setType] = useState<string>(occurrence?.type || 'outros');
  const [date, setDate] = useState(occurrence?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(occurrence?.time || new Date().toISOString().split('T')[1].substring(0, 5));
  const [latitude, setLatitude] = useState(occurrence?.latitude || 0);
  const [longitude, setLongitude] = useState(occurrence?.longitude || 0);
  const [policeStationId, setPoliceStationId] = useState(occurrence?.policeStation_id || '');
  const [policeStations, setPoliceStations] = useState<PoliceStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationSelected, setLocationSelected] = useState(Boolean(occurrence));
  const [gettingLocation, setGettingLocation] = useState(false);
  
  const isMobile = useIsMobile();
  const isAdmin = authService.isAdmin();

  useEffect(() => {
    const fetchPoliceStations = async () => {
      try {
        const stations = await policeStationService.getAllPoliceStations();
        setPoliceStations(stations);
        
        // If there's no pre-selected station and we have stations available, select the first one
        if (!policeStationId && stations.length > 0) {
          setPoliceStationId(stations[0].id);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!locationSelected) {
      toast.error('Por favor, selecione uma localização no mapa');
      return;
    }
    
    if (isAdmin && !policeStationId) {
      toast.error('Por favor, selecione uma delegacia');
      return;
    }
    
    try {
      setLoading(true);
      
      const occurrenceData: Omit<Occurrence, 'id'> = {
        title,
        description,
        type,
        latitude,
        longitude,
        date,
        time,
        policeStation_id: isAdmin ? policeStationId : undefined,
      };
      
      if (occurrence?.id) {
        await occurrenceService.updateOccurrence(occurrence.id, occurrenceData);
        toast.success('Ocorrência atualizada com sucesso!');
      } else {
        await occurrenceService.createOccurrence(occurrenceData);
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
                onValueChange={(value) => setType(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent position={isMobile ? "popper" : "item-aligned"}>
                  <SelectItem value="agressoes_brigas">Agressões ou brigas</SelectItem>
                  <SelectItem value="acidentes_transito">Apoio em acidentes de trânsito</SelectItem>
                  <SelectItem value="depredacao_patrimonio">Depredação do patrimônio público</SelectItem>
                  <SelectItem value="emergencias_ambientais">Emergências ambientais</SelectItem>
                  <SelectItem value="invasao_predios">Invasão de prédios ou terrenos públicos</SelectItem>
                  <SelectItem value="maria_penha">Maria da Penha</SelectItem>
                  <SelectItem value="perturbacao_sossego">Perturbação do sossego público</SelectItem>
                  <SelectItem value="posse_armas">Posse de armas brancas ou de fogo</SelectItem>
                  <SelectItem value="pessoa_suspeita">Pessoa suspeita</SelectItem>
                  <SelectItem value="roubos_furtos">Roubos e furtos</SelectItem>
                  <SelectItem value="tentativa_suicidio">Tentativa de suicídio</SelectItem>
                  <SelectItem value="drogas">Uso e tráfico de drogas</SelectItem>
                  <SelectItem value="violencia_domestica">Violência doméstica</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
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
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
            
            {isAdmin && (
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
            )}

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
    </Card>
  );
};

export default OccurrenceForm;
