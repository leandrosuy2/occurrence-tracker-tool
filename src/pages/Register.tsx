import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";
import authService from '@/services/authService';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    cpf: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const [files, setFiles] = useState({
    documentPhoto: null as File | null,
    documentSelfie: null as File | null,
    avatar: null as File | null,
  });

  // Prevenir qualquer submit do formulário
  useEffect(() => {
    const handleSubmit = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    document.addEventListener('submit', handleSubmit, true);
    return () => {
      document.removeEventListener('submit', handleSubmit, true);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    const file = e.target.files?.[0] || null;
    setFiles((prev) => ({ ...prev, [name]: file }));
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    setFormData((prev) => ({ ...prev, cpf: value }));
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
    setFormData((prev) => ({ ...prev, zipCode: value }));
  };

  const fetchAddressByCep = async (cep: string) => {
    if (cep.length !== 8) return;
    
    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }

      setFormData(prev => ({
        ...prev,
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
      }));
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error("Erro ao buscar CEP. Tente novamente.");
    } finally {
      setIsLoadingCep(false);
    }
  };

  useEffect(() => {
    if (formData.zipCode.length === 8) {
      fetchAddressByCep(formData.zipCode);
    }
  }, [formData.zipCode]);

  const validateStep1 = async () => {
    if (!formData.name || !formData.email || !formData.cpf) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return false;
    }
    if (formData.cpf.length !== 11) {
      toast.error("CPF deve ter 11 dígitos");
      return false;
    }

    try {
      const cpfExists = await authService.checkCpfExists(formData.cpf);
      if (cpfExists) {
        toast.error("CPF já cadastrado no sistema");
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking CPF:', error);
      return false;
    }
  };

  const validateStep2 = () => {
    if (!formData.password || !formData.confirmPassword) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.street || !formData.number || !formData.neighborhood || 
        !formData.city || !formData.state || !formData.zipCode) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (!files.documentPhoto || !files.documentSelfie || !files.avatar) {
      toast.error("Por favor, faça upload de todos os documentos necessários");
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    switch (currentStep) {
      case 1:
        if (await validateStep1()) {
          setCurrentStep(2);
          return true;
        }
        break;
      case 2:
        if (validateStep2()) {
          setCurrentStep(3);
          return true;
        }
        break;
      case 3:
        if (validateStep3()) {
          setCurrentStep(4);
          return true;
        }
        break;
      case 4:
        if (validateStep4()) {
          return true;
        }
        break;
    }
    return false;
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      const formDataToSend = new FormData();
      
      // Adiciona os campos do formulário, exceto confirmPassword
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'confirmPassword') {
          formDataToSend.append(key, value);
        }
      });
      
      // Adiciona os arquivos
      if (files.documentPhoto) formDataToSend.append('documentPhoto', files.documentPhoto);
      if (files.documentSelfie) formDataToSend.append('documentSelfie', files.documentSelfie);
      if (files.avatar) formDataToSend.append('avatar', files.avatar);
      
      await authService.register(formDataToSend);
      navigate('/login');
    } catch (error) {
      console.error('Register error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Informações Pessoais</h2>
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Seu nome completo"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="nome@exemplo.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF (apenas números)</Label>
              <Input
                id="cpf"
                name="cpf"
                type="text"
                placeholder="12345678901"
                value={formData.cpf}
                onChange={handleCpfChange}
                maxLength={11}
                required
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Senha</h2>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirme a senha</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Endereço</h2>
            
            <div className="space-y-2">
              <Label htmlFor="zipCode">CEP</Label>
              <div className="flex gap-2">
                <Input
                  id="zipCode"
                  name="zipCode"
                  type="text"
                  placeholder="00000000"
                  value={formData.zipCode}
                  onChange={handleCepChange}
                  maxLength={8}
                  required
                />
                {isLoadingCep && (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-ocorrencia-azul-escuro"></div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="street">Rua</Label>
              <Input
                id="street"
                name="street"
                type="text"
                placeholder="Nome da rua"
                value={formData.street}
                onChange={handleChange}
                required
                disabled={isLoadingCep}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  name="number"
                  type="text"
                  placeholder="Número"
                  value={formData.number}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  name="complement"
                  type="text"
                  placeholder="Complemento (opcional)"
                  value={formData.complement}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                name="neighborhood"
                type="text"
                placeholder="Bairro"
                value={formData.neighborhood}
                onChange={handleChange}
                required
                disabled={isLoadingCep}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  name="city"
                  type="text"
                  placeholder="Cidade"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  disabled={isLoadingCep}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  name="state"
                  type="text"
                  placeholder="Estado"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  disabled={isLoadingCep}
                />
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Documentos</h2>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="documentPhoto">Foto do Documento</Label>
                <Input
                  id="documentPhoto"
                  name="documentPhoto"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentSelfie">Selfie com Documento</Label>
                <Input
                  id="documentSelfie"
                  name="documentSelfie"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar">Foto de Perfil</Label>
                <Input
                  id="avatar"
                  name="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Cadastro de Usuário</h1>
      
      {/* Steps Indicator */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`flex items-center ${
              step < 4 ? 'flex-1' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= step
                  ? 'bg-ocorrencia-azul-escuro text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step}
            </div>
            {step < 4 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  currentStep > step ? 'bg-ocorrencia-azul-escuro' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {renderStep()}
        
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleBack();
            }}
            disabled={currentStep === 1}
          >
            Voltar
          </Button>
          
          <Button
            type="button"
            className="bg-ocorrencia-azul-escuro hover:bg-ocorrencia-azul-medio"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              
              if (currentStep === 4) {
                if (await validateStep4()) {
                  await handleSubmit();
                }
              } else {
                const success = await handleNext();
                if (!success) {
                  return;
                }
              }
            }}
            disabled={isLoading}
          >
            {currentStep === 4 ? (isLoading ? "Registrando..." : "Finalizar") : "Próximo"}
          </Button>
        </div>
      </div>
      
      <div className="text-center text-sm mt-4">
        <p>
          Já tem uma conta?{" "}
          <Link to="/login" className="text-ocorrencia-azul-medio hover:underline">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
