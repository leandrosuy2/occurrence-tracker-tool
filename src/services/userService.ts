import api from './api';
import { User } from '@/types';
import { toast } from "sonner";

const basePathUrlApiV1 = "/api/v1";

const getAllUsers = async (): Promise<User[]> => {
  try {
    const response = await api.get(`${basePathUrlApiV1}/users`);
    return response.data;
  } catch (error) {
    console.error('Get all users error:', error);
    toast.error("Erro ao buscar usuários.");
    throw error;
  }
};

const getUserById = async (id: string): Promise<User> => {
  try {
    const response = await api.get(`${basePathUrlApiV1}/users/${id}`);
    return response.data;
  } catch (error) {
    console.error('Get user by id error:', error);
    toast.error("Erro ao buscar usuário.");
    throw error;
  }
};

const getUserProfile = async (): Promise<User> => {
  try {
    const response = await api.get(`${basePathUrlApiV1}/users/profile`);
    return response.data;
  } catch (error) {
    console.error('Get user profile error:', error);
    toast.error("Erro ao buscar perfil do usuário.");
    throw error;
  }
};

const updateUser = async (id: string, data: FormData): Promise<User> => {
  try {
    // Ensure required fields are present
    if (!data.get('name') || !data.get('email') || !data.get('cpf')) {
      throw new Error('Campos obrigatórios não preenchidos');
    }

    // If password is not provided, use a placeholder
    if (!data.get('password')) {
      data.append('password', 'placeholder');
    }

    const response = await api.put(`${basePathUrlApiV1}/users/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    toast.success("Usuário atualizado com sucesso!");
    return response.data;
  } catch (error) {
    console.error('Update user error:', error);
    toast.error("Erro ao atualizar usuário.");
    throw error;
  }
};

const updateSelf = async (data: FormData): Promise<User> => {
  try {
    const response = await api.put(`${basePathUrlApiV1}/users/self`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    toast.success("Perfil atualizado com sucesso!");
    return response.data;
  } catch (error) {
    console.error('Update self error:', error);
    toast.error("Erro ao atualizar perfil.");
    throw error;
  }
};

const updateUserRole = async (id: string, role: string): Promise<User> => {
  try {
    const response = await api.put(`${basePathUrlApiV1}/users/${id}/role`, { role });
    toast.success("Permissão do usuário atualizada com sucesso!");
    return response.data;
  } catch (error) {
    console.error('Update user role error:', error);
    toast.error("Erro ao atualizar permissão do usuário.");
    throw error;
  }
};

const createUser = async (data: FormData): Promise<User> => {
  try {
    const response = await api.post(`${basePathUrlApiV1}/users/save`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    toast.success("Usuário criado com sucesso!");
    return response.data;
  } catch (error: any) {
    console.error('Create user error:', error);
    
    if (error.response?.data?.message === 'CPF já cadastrado') {
      throw new Error('Este CPF já está cadastrado no sistema');
    }
    
    throw error;
  }
};

const createRiskGroupUser = async (formData: FormData): Promise<User> => {
  try {
    const response = await api.post(`${basePathUrlApiV1}/users/grupo-de-risco`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    toast.success("Grupo de risco criado com sucesso.");
    return response.data;
  } catch (error) {
    console.error('Create risk group user error:', error);
    toast.error("Erro ao criar grupo de risco.");
    throw error;
  }
};

const deleteUser = async (id: string): Promise<void> => {
  try {
    await api.delete(`${basePathUrlApiV1}/users/${id}`);
    toast.success("Usuário excluído com sucesso!");
  } catch (error) {
    console.error('Delete user error:', error);
    toast.error("Erro ao excluir usuário.");
    throw error;
  }
};

const deleteSelf = async (): Promise<void> => {
  try {
    await api.delete(`${basePathUrlApiV1}/users/self`);
    toast.success("Conta excluída com sucesso!");
  } catch (error) {
    console.error('Delete self error:', error);
    toast.error("Erro ao excluir conta.");
    throw error;
  }
};

const userService = {
  getAllUsers,
  getUserById,
  getUserProfile,
  updateUser,
  updateSelf,
  updateUserRole,
  createUser,
  createRiskGroupUser,
  deleteUser,
  deleteSelf
};

export default userService;
