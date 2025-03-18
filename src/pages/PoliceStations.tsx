import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import api, { basePathUrlApiV1 } from '@/services/api';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// Corrigir o ícone do marcador do Leaflet
const icon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const policeStationSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  latitude: z.number(),
  longitude: z.number(),
});

type PoliceStationFormData = z.infer<typeof policeStationSchema>;

interface PoliceStation {
  id: string;
  name: string;
  email: string;
  phone: string;
}

const center = {
  lat: -23.550520,
  lng: -46.633308
};

// Componente para capturar cliques no mapa
const MapClickHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const PoliceStations = () => {
  const [stations, setStations] = useState<PoliceStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<PoliceStation | null>(null);
  const [selectedStation, setSelectedStation] = useState<PoliceStation | null>(null);
  const [markers, setMarkers] = useState<PoliceStation[]>([]);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [stationToDelete, setStationToDelete] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<PoliceStation | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PoliceStationFormData>({
    resolver: zodResolver(policeStationSchema),
    defaultValues: {
      latitude: center.lat,
      longitude: center.lng
    }
  });

  const fetchStations = async () => {
    try {
      const response = await api.get(`${basePathUrlApiV1}/policeStation`);
      setStations(response.data);
      setMarkers(response.data);
    } catch (error) {
      console.error('Error fetching stations:', error);
      toast.error('Erro ao carregar delegacias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const onSubmit = async (data: PoliceStationFormData) => {
    try {
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        latitude: data.latitude,
        longitude: data.longitude,
      };

      if (editingStation) {
        await api.put(`${basePathUrlApiV1}/policeStation/${editingStation.id}`, payload);
        toast.success('Delegacia atualizada com sucesso!');
      } else {
        await api.post(`${basePathUrlApiV1}/policeStation/save`, payload);
        toast.success('Delegacia criada com sucesso!');
      }
      
      setDialogOpen(false);
      reset();
      setEditingStation(null);
      fetchStations();
    } catch (error) {
      console.error('Error saving station:', error);
      toast.error('Erro ao salvar delegacia');
    }
  };

  const handleEdit = (station: PoliceStation) => {
    setEditingStation(station);
    setValue('name', station.name);
    setValue('email', station.email);
    setValue('phone', station.phone);
    setValue('latitude', station.latitude);
    setValue('longitude', station.longitude);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setStationToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!stationToDelete) return;
    
    try {
      await api.delete(`${basePathUrlApiV1}/policeStation/${stationToDelete}`);
      toast.success('Delegacia excluída com sucesso!');
      fetchStations();
    } catch (error) {
      console.error('Error deleting station:', error);
      toast.error('Erro ao excluir delegacia');
    }
    
    setIsDeleteDialogOpen(false);
    setStationToDelete(null);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setValue('latitude', lat);
    setValue('longitude', lng);
    toast.success('Localização selecionada no mapa!');
  };

  const handleMarkerClick = (station: PoliceStation) => {
    setSelectedStation(station);
    setIsMapOpen(true);
  };

  const handleShowAddress = (station: PoliceStation) => {
    setSelectedAddress(station);
    setIsAddressModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Delegacias</h1>
          <p className="text-muted-foreground">
            Gerencie as delegacias cadastradas no sistema
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              reset();
              setEditingStation(null);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Delegacia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] md:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingStation ? 'Editar Delegacia' : 'Nova Delegacia'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone.message}</p>
                  )}
                </div>
              </div>
              <div>
                <Label>Localização</Label>
                <div className="h-[400px] w-full rounded-md border">
                  <MapContainer
                    center={editingStation ? [editingStation.latitude, editingStation.longitude] : [center.lat, center.lng]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <MapClickHandler onMapClick={handleMapClick} />
                    {markers.map((station) => (
                      station.latitude && station.longitude ? (
                        <Marker
                          key={station.id}
                          position={[station.latitude, station.longitude]}
                          icon={icon}
                          eventHandlers={{
                            click: () => handleMarkerClick(station)
                          }}
                        >
                          <Popup>
                            <div>
                              <h3 className="font-bold">{station.name}</h3>
                              <p>{station.email}</p>
                              <p>{station.phone}</p>
                            </div>
                          </Popup>
                        </Marker>
                      ) : null
                    ))}
                  </MapContainer>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      {...register('latitude', { valueAsNumber: true })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      {...register('longitude', { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingStation ? 'Salvar alterações' : 'Criar delegacia'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delegacias Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center">
              <p>Carregando delegacias...</p>
            </div>
          ) : stations.length === 0 ? (
            <div className="py-10 text-center">
              <p>Nenhuma delegacia cadastrada</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stations.map((station) => (
                    <TableRow key={station.id}>
                      <TableCell>{station.name}</TableCell>
                      <TableCell>{station.email}</TableCell>
                      <TableCell>{station.phone}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShowAddress(station)}
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Ver endereço
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(station)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(station.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map Dialog/Sheet (responsive) */}
      {isMobile ? (
        <Sheet open={isMapOpen} onOpenChange={setIsMapOpen}>
          <SheetContent side="bottom" className="h-[80vh] pt-6 max-w-none">
            <div className="h-full flex flex-col">
              <h2 className="text-xl font-semibold mb-2">
                {selectedStation?.name}
              </h2>
              <div className="mb-2">
                <p className="text-muted-foreground text-sm">
                  {selectedStation?.email}
                </p>
                <p className="text-muted-foreground text-sm">
                  {selectedStation?.phone}
                </p>
              </div>
              {selectedStation && (
                <div className="flex-1 -mx-6 -mb-8">
                  <MapContainer
                    center={[selectedStation.latitude, selectedStation.longitude]}
                    zoom={14}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker
                      position={[selectedStation.latitude, selectedStation.longitude]}
                      icon={icon}
                    >
                      <Popup>
                        <div>
                          <h3 className="font-bold">{selectedStation.name}</h3>
                          <p>{selectedStation.email}</p>
                          <p>{selectedStation.phone}</p>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>
                Localização da Delegacia
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {selectedStation?.name}
                </h2>
                <div className="text-muted-foreground">
                  <p>{selectedStation?.email}</p>
                  <p>{selectedStation?.phone}</p>
                </div>
              </div>
              {selectedStation && selectedStation.latitude && selectedStation.longitude && (
                <div className="h-[500px] w-full">
                  <MapContainer
                    center={[selectedStation.latitude, selectedStation.longitude]}
                    zoom={14}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker
                      position={[selectedStation.latitude, selectedStation.longitude]}
                      icon={icon}
                    >
                      <Popup>
                        <div>
                          <h3 className="font-bold">{selectedStation.name}</h3>
                          <p>{selectedStation.email}</p>
                          <p>{selectedStation.phone}</p>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] md:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Delegacia</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir esta delegacia? Esta ação não pode ser desfeita.
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

      {/* Adicione o modal de endereço */}
      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Localização da Delegacia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">{selectedAddress?.name}</h3>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">E-mail:</span> {selectedAddress?.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Telefone:</span> {selectedAddress?.phone}
                </p>
              </div>
            </div>

            {/* Mapa */}
            {selectedAddress && (
              <div className="h-[400px] w-full rounded-md border">
                <MapContainer
                  center={[selectedAddress.latitude, selectedAddress.longitude]}
                  zoom={15}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker
                    position={[selectedAddress.latitude, selectedAddress.longitude]}
                    icon={icon}
                  >
                    <Popup>
                      <div>
                        <h3 className="font-bold">{selectedAddress.name}</h3>
                        <p>{selectedAddress.email}</p>
                        <p>{selectedAddress.phone}</p>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsAddressModalOpen(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PoliceStations;
