
import api from './api';
import jwtDecode from 'jwt-decode';
import { User, LoginRequest, RegisterRequest } from '../types';
import { toast } from "sonner";

interface JwtPayload {
  id: string;
  name: string;
  email: string;
  role: string;
  cpf: string;
}

const login = async (data: LoginRequest) => {
  try {
    const response = await api.post('/auth/login', data);
    const { token } = response.data;
    
    localStorage.setItem('token', token);
    
    const decoded = jwtDecode<JwtPayload>(token);
    const user: User = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      cpf: decoded.cpf,
      role: decoded.role,
    };
    
    localStorage.setItem('user', JSON.stringify(user));
    return { token, user };
  } catch (error) {
    console.error('Login error:', error);
    toast.error("Falha no login. Verifique suas credenciais.");
    throw error;
  }
};

const register = async (data: RegisterRequest) => {
  try {
    const response = await api.post('/auth/signup', data);
    toast.success("Registro realizado com sucesso!");
    return response.data;
  } catch (error) {
    console.error('Register error:', error);
    toast.error("Erro ao cadastrar usuário. Verifique os dados informados.");
    throw error;
  }
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
};

const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  return !!token;
};

const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'admin';
};

const changePassword = async (currentPassword: string, newPassword: string) => {
  try {
    await api.post('/auth/change-password', { currentPassword, newPassword });
    toast.success("Senha alterada com sucesso!");
    return true;
  } catch (error) {
    console.error('Change password error:', error);
    toast.error("Erro ao alterar senha. Verifique a senha atual.");
    throw error;
  }
};

const changeEmail = async (email: string, newEmail: string) => {
  try {
    await api.post('/auth/change-email', { email, newEmail });
    
    const user = getCurrentUser();
    if (user) {
      user.email = newEmail;
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    toast.success("E-mail alterado com sucesso!");
    return true;
  } catch (error) {
    console.error('Change email error:', error);
    toast.error("Erro ao alterar e-mail.");
    throw error;
  }
};

const authService = {
  login,
  register,
  logout,
  getCurrentUser,
  isAuthenticated,
  isAdmin,
  changePassword,
  changeEmail,
};

export default authService;
