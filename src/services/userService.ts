
import api, { basePathUrlApiV1 } from './api';
import { User } from '../types';
import { toast } from 'sonner';

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

const updateUser = async (id: string, userData: Partial<User>): Promise<User> => {
  try {
    const response = await api.put(`${basePathUrlApiV1}/users/${id}`, userData);
    toast.success("Usuário atualizado com sucesso!");
    return response.data;
  } catch (error) {
    console.error('Update user error:', error);
    toast.error("Erro ao atualizar usuário.");
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

const userService = {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserRole,
  deleteUser
};

export default userService;
