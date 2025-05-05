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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from '@/types';
import userService from '@/services/userService';
import { Edit, Trash, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    cpfUnformatted: '',
    password: '',
    role: 'USER',
    avatar: null as File | null,
    documentPhoto: null as File | null,
    documentSelfie: null as File | null,
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    zipCodeUnformatted: '',
  });
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    
    if (name === 'avatar' && files && files.length > 0) {
      setFormData((prev) => ({ ...prev, avatar: files[0] }));
    } else if (name === 'documentPhoto' && files && files.length > 0) {
      setFormData((prev) => ({ ...prev, documentPhoto: files[0] }));
    } else if (name === 'documentSelfie' && files && files.length > 0) {
      setFormData((prev) => ({ ...prev, documentSelfie: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      cpf: '',
      cpfUnformatted: '',
      password: '',
      role: 'USER',
      avatar: null,
      documentPhoto: null,
      documentSelfie: null,
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      zipCodeUnformatted: '',
    });
    setEditingId(null);
    setOpenDialog(false);
    setCurrentStep(1);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formDataObj = new FormData();
    formDataObj.append('name', formData.name);
    formDataObj.append('email', formData.email);
    formDataObj.append('cpf', formData.cpfUnformatted);
    formDataObj.append('role', formData.role);
    
    if (formData.avatar) {
      formDataObj.append('avatar', formData.avatar);
    }
    
    if (formData.documentPhoto) {
      formDataObj.append('documentPhoto', formData.documentPhoto);
    }
    
    if (formData.documentSelfie) {
      formDataObj.append('documentSelfie', formData.documentSelfie);
    }
    
    formDataObj.append('password', formData.password || 'placeholder');
    formDataObj.append('street', formData.street);
    formDataObj.append('number', formData.number);
    formDataObj.append('complement', formData.complement);
    formDataObj.append('neighborhood', formData.neighborhood);
    formDataObj.append('city', formData.city);
    formDataObj.append('state', formData.state);
    formDataObj.append('zipCode', formData.zipCodeUnformatted);
    
    try {
      if (editingId) {
        await userService.updateUser(editingId, formDataObj);
      } else {
        await userService.createUser(formDataObj);
      }
      
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Erro ao salvar usuário');
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) {
      return;
    }
    
    try {
      await userService.deleteUser(id);
      fetchUsers();
      toast.success('Usuário excluído com sucesso');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erro ao excluir usuário');
    }
  };
  
  const handleEdit = async (id: string) => {
    try {
      const user = await userService.getUserById(id);
      
      setFormData({
        name: user.name,
        email: user.email,
        cpf: formatCPF(user.cpf),
        cpfUnformatted: user.cpf,
        password: 'placeholder',
        role: user.Permission?.role || 'USER',
        avatar: null,
        documentPhoto: null,
        documentSelfie: null,
        street: user.street || '',
        number: user.number || '',
        complement: user.complement || '',
        neighborhood: user.neighborhood || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: formatCEP(user.zipCode || ''),
        zipCodeUnformatted: user.zipCode || '',
      });
      
      setEditingId(id);
      setOpenDialog(true);
    } catch (error) {
      console.error('Error getting user details:', error);
      toast.error('Erro ao carregar detalhes do usuário');
    }
  };
  
  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
    if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
  };

  const formatCEP = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 5) return cleaned;
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '');
    const formatted = formatCPF(cleaned);
    setFormData(prev => ({ 
      ...prev, 
      cpf: formatted,
      cpfUnformatted: cleaned
    }));
  };

  const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '');
    const formatted = formatCEP(cleaned);
    setFormData(prev => ({ 
      ...prev, 
      zipCode: formatted,
      zipCodeUnformatted: cleaned
    }));

    // Se o CEP tiver 8 dígitos (sem formatação), busca o endereço
    if (cleaned.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-4">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`w-2 h-2 rounded-full mx-1 ${
            index + 1 === currentStep ? 'bg-ocorrencia-azul-escuro' : 'bg-gray-300'
          }`}
        />
      ))}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Digite o nome completo"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="exemplo@email.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={handleCPFChange}
                maxLength={14}
                placeholder="000.000.000-00"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Select 
                value={formData.role}
                onValueChange={handleRoleChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPERADMIN">Super Administrador</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="USER">Usuário</SelectItem>
                  <SelectItem value="GRUPO_DE_RISCO">Grupo de Risco</SelectItem>
                  <SelectItem value="GUARDINHA_DA_RUA">Guardinha da Rua</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {!editingId && (
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Digite uma senha forte"
                  required
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar</Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, avatar: e.target.files?.[0] || null })}
                placeholder="Selecione uma imagem"
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="documentPhoto">Foto do Documento</Label>
              <Input
                id="documentPhoto"
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, documentPhoto: e.target.files?.[0] || null })}
                placeholder="Selecione a foto do documento"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentSelfie">Selfie com Documento</Label>
              <Input
                id="documentSelfie"
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, documentSelfie: e.target.files?.[0] || null })}
                placeholder="Selecione a selfie com documento"
                required
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street">Rua</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                placeholder="Digite o nome da rua"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="Número da residência"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={formData.complement}
                  onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                  placeholder="Apto, Bloco, etc. (opcional)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                placeholder="Digite o nome do bairro"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Digite o nome da cidade"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Digite a sigla do estado"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">CEP</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={handleCEPChange}
                maxLength={9}
                placeholder="00000-000"
                required
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getRoleName = (role?: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return 'Super Administrador';
      case 'ADMIN':
        return 'Administrador';
      case 'USER':
        return 'Usuário';
      case 'GRUPO_DE_RISCO':
        return 'Grupo de Risco';
      case 'GUARDINHA_DA_RUA':
        return 'Guardinha da Rua';
      default:
        return 'Usuário';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie os usuários do sistema
          </p>
        </div>
        
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="bg-ocorrencia-azul-escuro hover:bg-ocorrencia-azul-medio">
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Editar Usuário' : 'Criar Novo Usuário'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit}>
              {renderStepIndicator()}
              {renderStepContent()}
              
              <DialogFooter className="mt-4">
                <div className="flex justify-between w-full">
                  {currentStep > 1 && (
                    <Button type="button" variant="outline" onClick={handlePrevious}>
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Voltar
                    </Button>
                  )}
                  {currentStep < totalSteps ? (
                    <Button type="button" onClick={handleNext}>
                      Próximo
                      <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                  ) : (
                <Button type="submit">
                  {editingId ? 'Salvar' : 'Criar'}
                </Button>
                  )}
                </div>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="border rounded-md">
        {loading ? (
          <div className="p-8 text-center">Carregando usuários...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Nenhum usuário encontrado</p>
            <Button
              onClick={() => setOpenDialog(true)}
              variant="link"
              className="mt-2"
            >
              Criar o primeiro usuário
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Função</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.cpf}</TableCell>
                  <TableCell>{getRoleName(user.Permission?.role)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(user.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(user.id)}
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

export default Users;
