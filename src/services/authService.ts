import api, { basePathUrlApiV1 } from './api';
import { jwtDecode } from 'jwt-decode';
import { User, LoginRequest, RegisterRequest } from '../types';
import { toast } from "sonner";

interface JwtPayload {
  id: string;
  name: string;
  email: string;
  role: string;
  cpf: string;
}

interface UserResponse {
  id: string;
  name: string;
  email: string;
  cpf: string;
  Permission: {
    role: string;
  };
}

const login = async (data: LoginRequest) => {
  try {
    // Primeiro faz o login
    const response = await api.post('/auth/login', data);
    const { token } = response.data;
    
    // console.log('Token recebido:', token);
    
    // Salva o token
    localStorage.setItem('token', token);
    
    // Configura o token no header da API
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Decodifica o token para obter os dados básicos do usuário
    const decoded = jwtDecode<JwtPayload>(token);
    // console.log('Token decodificado:', decoded);
    
    // Cria o objeto user com os dados do token
    const user: User = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      cpf: decoded.cpf,
      role: decoded.role,
    };
    
    // Salva os dados do usuário
    localStorage.setItem('user', JSON.stringify(user));
    
    // Agora busca os dados completos do usuário para atualizar a role
    // console.log('Buscando perfil do usuário...');
    const userResponse = await api.get(`${basePathUrlApiV1}/users/profile`);
    console.log('Resposta do perfil:', userResponse.data);
    
    const userData: UserResponse = userResponse.data;
    
    // Atualiza a role do usuário com os dados do perfil
    user.role = userData.Permission.role;
    localStorage.setItem('user', JSON.stringify(user));
    
    console.log('User data after login:', user);
    return { token, user };
  } catch (error) {
    // console.error('Login error:', error);
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
    // console.error('Register error:', error);
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
    const user = JSON.parse(userStr);
    // console.log('Current user data:', user);
    return user;
  }
  return null;
};

const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  return !!token;
};

const isAdmin = (): boolean => {
  const user = getCurrentUser();
  console.log('AuthService - Verificando admin - User:', user);
  const isAdminUser = user?.role === 'ADMIN';
  console.log('AuthService - Verificando admin - Resultado:', isAdminUser);
  return isAdminUser;
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
