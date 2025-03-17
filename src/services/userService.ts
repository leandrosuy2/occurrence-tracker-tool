
import api, { basePathUrlApiV1 } from './api';
import { User } from '../types';
import { toast } from "sonner";

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
    toast.error("Erro ao buscar detalhes do usuário.");
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

const createUser = async (formData: FormData): Promise<User> => {
  try {
    const response = await api.post(`${basePathUrlApiV1}/users/save`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    toast.success("Usuário criado com sucesso!");
    return response.data;
  } catch (error) {
    console.error('Create user error:', error);
    toast.error("Erro ao criar usuário.");
    throw error;
  }
};

const updateUser = async (id: string, formData: FormData): Promise<User> => {
  try {
    const response = await api.put(`${basePathUrlApiV1}/users/${id}`, formData, {
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

const updateSelf = async (formData: FormData): Promise<User> => {
  try {
    const response = await api.put(`${basePathUrlApiV1}/users/self`, formData, {
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
  createUser,
  updateUser,
  updateSelf,
  deleteUser,
  deleteSelf
};

export default userService;
