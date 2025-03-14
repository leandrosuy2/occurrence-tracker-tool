
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";
import authService from '@/services/authService';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    cpf: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (
      !formData.name || 
      !formData.email || 
      !formData.password || 
      !formData.confirmPassword ||
      !formData.cpf
    ) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    
    if (formData.cpf.length !== 11) {
      toast.error("CPF deve ter 11 dígitos");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        cpf: formData.cpf,
      });
      
      navigate('/login');
    } catch (error) {
      console.error('Register error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    setFormData((prev) => ({ ...prev, cpf: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
      
      <Button
        type="submit"
        className="w-full bg-ocorrencia-azul-escuro hover:bg-ocorrencia-azul-medio"
        disabled={isLoading}
      >
        {isLoading ? "Registrando..." : "Registrar"}
      </Button>
      
      <div className="text-center text-sm">
        <p>
          Já tem uma conta?{" "}
          <Link to="/login" className="text-ocorrencia-azul-medio hover:underline">
            Faça login
          </Link>
        </p>
      </div>
    </form>
  );
};

export default Register;
