import api, { basePathUrlApiV1 } from './api';
import { jwtDecode } from 'jwt-decode';
import { User, LoginRequest, RegisterRequest } from '../types';
import { toast } from "sonner";
import notificationService from './notificationService';

interface JwtPayload {
  id: string;
  name: string;
  email: string;
  role: string;
  cpf: string;
  exp: number;
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
    
    console.log('Token recebido:', token);
    
    // Salva o token
    localStorage.setItem('token', token);
    
    // Configura o token no header da API
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Decodifica o token para obter os dados básicos do usuário
    const decoded = jwtDecode<JwtPayload>(token);
    console.log('Token decodificado:', decoded);
    
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
    console.log('Buscando perfil do usuário...');
    const userResponse = await api.get(`${basePathUrlApiV1}/users/profile`);
    console.log('Resposta do perfil:', userResponse.data);
    
    const userData: UserResponse = userResponse.data;
    
    // Atualiza a role do usuário com os dados do perfil
    user.role = userData.Permission.role;
    localStorage.setItem('user', JSON.stringify(user));
    
    // Define o status de admin no serviço de notificações
    const isAdminUser = user.role === 'ADMIN' || user.role === 'SUPERADMIN';
    notificationService.setAdminStatus(isAdminUser);
    
    console.log('User data after login:', user);
    return { token, user };
  } catch (error) {
    console.error('Login error:', error);
    toast.error("Falha no login. Verifique suas credenciais.");
    throw error;
  }
};

const checkCpfExists = async (cpf: string) => {
  try {
    const response = await api.get(`/api/v1/users/check-cpf/${cpf}`);
    return response.data.exists;
  } catch (error) {
    console.error('Error checking CPF:', error);
    return false;
  }
};

const register = async (data: FormData) => {
  try {
    // Verifica se o CPF já existe
    const cpf = data.get('cpf') as string;
    const cpfExists = await checkCpfExists(cpf);
    
    if (cpfExists) {
      toast.error("CPF já cadastrado no sistema");
      throw new Error("CPF já cadastrado");
    }

    const response = await api.post('/api/v1/users/save', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    toast.success("Registro realizado com sucesso!");
    return response.data;
  } catch (error) {
    console.error('Register error:', error);
    if (error.message !== "CPF já cadastrado") {
      toast.error("Erro ao cadastrar usuário. Verifique os dados informados.");
    }
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
    console.log('Current user data:', user);
    return user;
  }
  return null;
};

const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const decoded = jwtDecode(token) as JwtPayload;
    const currentTime = Date.now() / 1000;
    return decoded.exp ? decoded.exp > currentTime : false;
  } catch (error) {
    return false;
  }
};

const isAdmin = (): boolean => {
  const user = getCurrentUser();
  console.log('AuthService - Verificando admin - User:', user);
  const isAdminUser = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
  console.log('AuthService - Verificando admin - Resultado:', isAdminUser);
  return isAdminUser;
};

const isSuperAdmin = (): boolean => {
  const user = getCurrentUser();
  console.log('AuthService - Verificando superadmin - User:', user);
  const isSuperAdminUser = user?.role === 'SUPERADMIN';
  console.log('AuthService - Verificando superadmin - Resultado:', isSuperAdminUser);
  return isSuperAdminUser;
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

const getUserRole = (): string | null => {
  const user = getCurrentUser();
  return user?.role || null;
};

const authService = {
  login,
  register,
  logout,
  getCurrentUser,
  isAuthenticated,
  isAdmin,
  isSuperAdmin,
  changePassword,
  changeEmail,
  checkCpfExists,
  getUserRole,
};

export default authService;
