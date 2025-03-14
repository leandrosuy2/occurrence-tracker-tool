
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
  const [type, setType] = useState<'homicidio' | 'furto' | 'roubo' | 'outros'>(
    occurrence?.type || 'outros'
  );
  const [date, setDate] = useState(occurrence?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(occurrence?.time || new Date().toISOString().split('T')[1].substring(0, 5));
  const [latitude, setLatitude] = useState(occurrence?.latitude || 0);
  const [longitude, setLongitude] = useState(occurrence?.longitude || 0);
  const [policeStationId, setPoliceStationId] = useState(occurrence?.policeStation_id || '');
  const [policeStations, setPoliceStations] = useState<PoliceStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationSelected, setLocationSelected] = useState(Boolean(occurrence));

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
  }, [policeStationId]);

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
    
    if (!policeStationId) {
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
        policeStation_id: policeStationId,
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
    <Card className="w-full">
      <CardHeader>
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
                onValueChange={(value) => setType(value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="homicidio">Homicídio</SelectItem>
                  <SelectItem value="furto">Furto</SelectItem>
                  <SelectItem value="roubo">Roubo</SelectItem>
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
            
            <div className="space-y-2">
              <Label htmlFor="policeStation">Delegacia</Label>
              <Select
                value={policeStationId}
                onValueChange={setPoliceStationId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a delegacia" />
                </SelectTrigger>
                <SelectContent>
                  {policeStations.map((station) => (
                    <SelectItem key={station.id} value={station.id}>
                      {station.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Label>Localização (clique no mapa para selecionar)</Label>
            <div className="border rounded-md overflow-hidden">
              <Map
                center={longitude && latitude ? [longitude, latitude] : undefined}
                zoom={longitude && latitude ? 13 : 10}
                onLocationSelect={handleLocationSelect}
                selectionMode={true}
              />
            </div>
            {locationSelected && (
              <p className="text-xs text-muted-foreground">
                Latitude: {latitude.toFixed(6)}, Longitude: {longitude.toFixed(6)}
              </p>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={loading || !locationSelected}
          >
            {loading ? 'Salvando...' : occurrence ? 'Atualizar' : 'Registrar'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default OccurrenceForm;
