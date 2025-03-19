import api from './api';
import { toast } from 'sonner';
import { Occurrence, CreateOccurrenceDTO } from '@/types';
import { OccurrenceType } from '@/components/OccurrenceTypeModal';

const basePathUrlApiV1 = '/api/v1';

const occurrenceService = {
  createOccurrence: async (data: FormData | CreateOccurrenceDTO) => {
    try {
      const response = await api.post(`${basePathUrlApiV1}/ocurrences/save`, data, {
        headers: data instanceof FormData ? {
          'Content-Type': 'multipart/form-data'
        } : {
          'Content-Type': 'application/json'
        }
      });
      toast.success("Ocorrência registrada com sucesso!");
      return response.data;
    } catch (error) {
      console.error('Error creating occurrence:', error);
      toast.error('Erro ao criar ocorrência');
      throw error;
    }
  },

  createQuickOccurrence: async (latitude: number, longitude: number, type: OccurrenceType) => {
    try {
      const data: CreateOccurrenceDTO = {
        type,
        latitude,
        longitude,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        policeStation_id: 0, // Será definido pelo backend
      };

      const response = await api.post(`${basePathUrlApiV1}/ocurrences/quick`, data);
      toast.success("Ocorrência rápida registrada com sucesso!");
      return response.data;
    } catch (error) {
      console.error('Error creating quick occurrence:', error);
      toast.error('Erro ao registrar ocorrência rápida');
      throw error;
    }
  },

  getUserOccurrences: async () => {
    try {
      const response = await api.get(`${basePathUrlApiV1}/ocurrences/self`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user occurrences:', error);
      toast.error('Erro ao buscar suas ocorrências');
      throw error;
    }
  },

  getOccurrenceById: async (id: string) => {
    try {
      const response = await api.get(`${basePathUrlApiV1}/ocurrences/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching occurrence:', error);
      toast.error('Erro ao buscar ocorrência');
      throw error;
    }
  },

  updateOccurrence: async (id: string, data: FormData | Partial<CreateOccurrenceDTO>) => {
    try {
      const response = await api.put(`${basePathUrlApiV1}/ocurrences/${id}`, data, {
        headers: data instanceof FormData ? {
          'Content-Type': 'multipart/form-data'
        } : {
          'Content-Type': 'application/json'
        }
      });
      toast.success("Ocorrência atualizada com sucesso!");
      return response.data;
    } catch (error) {
      console.error('Error updating occurrence:', error);
      toast.error('Erro ao atualizar ocorrência');
      throw error;
    }
  },

  deleteOccurrence: async (id: string) => {
    try {
      const response = await api.delete(`${basePathUrlApiV1}/ocurrences/${id}`);
      toast.success("Ocorrência excluída com sucesso!");
      return response.data;
    } catch (error) {
      console.error('Error deleting occurrence:', error);
      toast.error('Erro ao excluir ocorrência');
      throw error;
    }
  },

  getAllOccurrences: async () => {
    try {
      const response = await api.get(`${basePathUrlApiV1}/ocurrences`);
      return response.data;
    } catch (error) {
      console.error('Get all occurrences error:', error);
      toast.error("Erro ao buscar todas as ocorrências.");
      throw error;
    }
  }
};

export default occurrenceService;
