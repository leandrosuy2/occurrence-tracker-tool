
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PoliceStation } from '@/types';
import policeStationService from '@/services/policeStationService';
import Map from '@/components/Map';

const PoliceStations: React.FC = () => {
  const [policeStations, setPoliceStations] = useState<PoliceStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editStationId, setEditStationId] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<Omit<PoliceStation, 'id'>>();

  // Fetch all police stations
  const fetchPoliceStations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await policeStationService.getAllPoliceStations();
      setPoliceStations(data);
    } catch (error) {
      console.error('Error fetching police stations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPoliceStations();
  }, [fetchPoliceStations]);

  // Handle create/edit form submission
  const onSubmit = async (data: Omit<PoliceStation, 'id'>) => {
    try {
      if (editStationId) {
        await policeStationService.updatePoliceStation(editStationId, data);
      } else {
        await policeStationService.createPoliceStation(data);
      }
      
      fetchPoliceStations();
      setCreateDialogOpen(false);
      setEditStationId(null);
      reset();
    } catch (error) {
      console.error('Error saving police station:', error);
    }
  };

  // Handle edit police station
  const handleEdit = (station: PoliceStation) => {
    setEditStationId(station.id);
    setValue('name', station.name);
    setValue('email', station.email);
    setValue('phone', station.phone);
    setValue('latitude', station.latitude);
    setValue('longitude', station.longitude);
    setCurrentLocation([station.longitude, station.latitude]);
    setCreateDialogOpen(true);
  };

  // Handle delete police station
  const handleDelete = async (id: string) => {
    try {
      await policeStationService.deletePoliceStation(id);
      fetchPoliceStations();
    } catch (error) {
      console.error('Error deleting police station:', error);
    }
  };

  // Handle location selection from map
  const handleLocationSelect = (lat: number, lng: number) => {
    setValue('latitude', lat);
    setValue('longitude', lng);
  };

  // Reset form when dialog opens
  const handleDialogOpen = () => {
    setEditStationId(null);
    reset({
      name: '',
      email: '',
      phone: '',
      latitude: 0,
      longitude: 0
    });
    setCurrentLocation(null);
    setCreateDialogOpen(true);
  };

  // Filter police stations by search term
  const filteredStations = policeStations.filter(station =>
    station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    station.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    station.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Delegacias</h1>
          <p className="text-muted-foreground">
            Gerenciar delegacias cadastradas no sistema
          </p>
        </div>
        <Button onClick={handleDialogOpen} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Adicionar Delegacia
        </Button>
      </div>

      <div className="flex items-center mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar delegacias..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delegacias Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Carregando delegacias...</div>
          ) : filteredStations.length === 0 ? (
            <div className="text-center py-4">Nenhuma delegacia encontrada</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStations.map((station) => (
                    <TableRow key={station.id}>
                      <TableCell className="font-medium">{station.name}</TableCell>
                      <TableCell>{station.email}</TableCell>
                      <TableCell>{station.phone}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>
                            {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(station)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Confirmar exclusão
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir a delegacia "{station.name}"? 
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleDelete(station.id)}
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editStationId ? 'Editar Delegacia' : 'Adicionar Nova Delegacia'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Delegacia</Label>
                  <Input
                    id="name"
                    {...register('name', { required: 'Nome é obrigatório' })}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email', { required: 'Email é obrigatório' })}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    {...register('phone', { required: 'Telefone é obrigatório' })}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      {...register('latitude', { required: 'Latitude é obrigatória' })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      {...register('longitude', { required: 'Longitude é obrigatória' })}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Selecione a localização no mapa</Label>
                <div className="w-full h-64 border rounded-md overflow-hidden">
                  <Map
                    center={currentLocation || [-47.9292, -15.7801]}
                    zoom={10}
                    height="h-64"
                    selectionMode={true}
                    onLocationSelect={handleLocationSelect}
                    occurrences={[]}
                    policeStations={[]}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                {editStationId ? 'Salvar Alterações' : 'Adicionar Delegacia'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PoliceStations;
