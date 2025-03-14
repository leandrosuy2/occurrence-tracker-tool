
import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash } from 'lucide-react';
import { Occurrence, PoliceStation } from '@/types';
import occurrenceService from '@/services/occurrenceService';
import policeStationService from '@/services/policeStationService';

const Occurrences: React.FC = () => {
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [policeStations, setPoliceStations] = useState<PoliceStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Occurrence>>({
    title: '',
    description: '',
    type: 'outros',
    latitude: 0,
    longitude: 0,
    date: '',
    time: '',
    policeStation_id: '',
  });
  
  useEffect(() => {
    fetchOccurrences();
    fetchPoliceStations();
  }, []);
  
  const fetchOccurrences = async () => {
    try {
      const data = await occurrenceService.getUserOccurrences();
      setOccurrences(data);
    } catch (error) {
      console.error('Error fetching occurrences:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchPoliceStations = async () => {
    try {
      const data = await policeStationService.getAllPoliceStations();
      setPoliceStations(data);
    } catch (error) {
      console.error('Error fetching police stations:', error);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await occurrenceService.updateOccurrence(editingId, formData);
      } else {
        await occurrenceService.createOccurrence(formData as Omit<Occurrence, 'id'>);
      }
      
      resetForm();
      fetchOccurrences();
    } catch (error) {
      console.error('Error saving occurrence:', error);
    }
  };
  
  const handleDelete = async (id: string) => {
    try {
      await occurrenceService.deleteOccurrence(id);
      fetchOccurrences();
    } catch (error) {
      console.error('Error deleting occurrence:', error);
    }
  };
  
  const handleEdit = (occurrence: Occurrence) => {
    setFormData({
      title: occurrence.title,
      description: occurrence.description,
      type: occurrence.type,
      latitude: occurrence.latitude,
      longitude: occurrence.longitude,
      date: occurrence.date,
      time: occurrence.time,
      policeStation_id: occurrence.policeStation_id,
    });
    
    setEditingId(occurrence.id);
    setOpenDialog(true);
  };
  
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'outros',
      latitude: 0,
      longitude: 0,
      date: '',
      time: '',
      policeStation_id: '',
    });
    
    setEditingId(null);
    setOpenDialog(false);
  };
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR');
    } catch (e) {
      return dateStr;
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
        
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="bg-ocorrencia-azul-escuro hover:bg-ocorrencia-azul-medio">
              <Plus className="mr-2 h-4 w-4" />
              Nova Ocorrência
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Editar Ocorrência' : 'Registrar Nova Ocorrência'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleSelectChange('type', value)}
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      name="latitude"
                      type="number"
                      step="0.000001"
                      value={formData.latitude}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      name="longitude"
                      type="number"
                      step="0.000001"
                      value={formData.longitude}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="time">Hora</Label>
                    <Input
                      id="time"
                      name="time"
                      type="time"
                      value={formData.time}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="policeStation_id">Delegacia</Label>
                  <Select
                    value={formData.policeStation_id}
                    onValueChange={(value) => handleSelectChange('policeStation_id', value)}
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
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-ocorrencia-azul-escuro hover:bg-ocorrencia-azul-medio">
                  {editingId ? 'Atualizar' : 'Registrar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="border rounded-md">
        {loading ? (
          <div className="p-8 text-center">Carregando ocorrências...</div>
        ) : occurrences.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Nenhuma ocorrência encontrada</p>
            <Button
              onClick={() => setOpenDialog(true)}
              variant="link"
              className="mt-2"
            >
              Registrar sua primeira ocorrência
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Delegacia</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {occurrences.map((occurrence) => (
                <TableRow key={occurrence.id}>
                  <TableCell className="font-medium">{occurrence.title}</TableCell>
                  <TableCell>
                    {occurrence.type === 'homicidio' && 'Homicídio'}
                    {occurrence.type === 'furto' && 'Furto'}
                    {occurrence.type === 'roubo' && 'Roubo'}
                    {occurrence.type === 'outros' && 'Outros'}
                  </TableCell>
                  <TableCell>{formatDate(occurrence.date)}</TableCell>
                  <TableCell>
                    {policeStations.find(ps => ps.id === occurrence.policeStation_id)?.name || 
                     occurrence.policeStation_id}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(occurrence)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(occurrence.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default Occurrences;
