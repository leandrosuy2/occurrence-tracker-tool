
import api, { basePathUrlApiV1 } from './api';
import { Occurrence, OccurrenceStats } from '../types';
import { toast } from "sonner";

const createOccurrence = async (occurrence: Omit<Occurrence, 'id'>) => {
  try {
    const response = await api.post(`${basePathUrlApiV1}/ocurrences/save`, occurrence);
    toast.success("Ocorrência registrada com sucesso!");
    return response.data;
  } catch (error) {
    console.error('Create occurrence error:', error);
    toast.error("Erro ao registrar ocorrência.");
    throw error;
  }
};

const getUserOccurrences = async () => {
  try {
    const response = await api.get(`${basePathUrlApiV1}/ocurrences/self`);
    return response.data;
  } catch (error) {
    console.error('Get user occurrences error:', error);
    toast.error("Erro ao buscar ocorrências.");
    throw error;
  }
};

const getOccurrenceById = async (id: string) => {
  try {
    const response = await api.get(`${basePathUrlApiV1}/ocurrences/${id}`);
    return response.data;
  } catch (error) {
    console.error('Get occurrence by id error:', error);
    toast.error("Erro ao buscar detalhes da ocorrência.");
    throw error;
  }
};

const updateOccurrence = async (id: string, occurrence: Partial<Occurrence>) => {
  try {
    const response = await api.put(`${basePathUrlApiV1}/ocurrences/${id}`, occurrence);
    toast.success("Ocorrência atualizada com sucesso!");
    return response.data;
  } catch (error) {
    console.error('Update occurrence error:', error);
    toast.error("Erro ao atualizar ocorrência.");
    throw error;
  }
};

const deleteOccurrence = async (id: string) => {
  try {
    await api.delete(`${basePathUrlApiV1}/ocurrences/${id}`);
    toast.success("Ocorrência excluída com sucesso!");
    return true;
  } catch (error) {
    console.error('Delete occurrence error:', error);
    toast.error("Erro ao excluir ocorrência.");
    throw error;
  }
};

const getOccurrenceStats = async (): Promise<OccurrenceStats> => {
  try {
    const all = await api.get(`${basePathUrlApiV1}/ocurrences/count/all`);
    const self = await api.get(`${basePathUrlApiV1}/ocurrences/count/self`);
    const murders = await api.get(`${basePathUrlApiV1}/ocurrences/count/murders`);
    const thefts = await api.get(`${basePathUrlApiV1}/ocurrences/count/thefts`);
    
    console.log('Stats responses:', { all: all.data, self: self.data, murders: murders.data, thefts: thefts.data });
    
    return {
      all: all.data.count || all.data,
      self: self.data.count || self.data,
      murders: murders.data.count || murders.data,
      thefts: thefts.data.count || thefts.data
    };
  } catch (error) {
    console.error('Get occurrence stats error:', error);
    toast.error("Erro ao buscar estatísticas.");
    throw error;
  }
};

const occurrenceService = {
  createOccurrence,
  getUserOccurrences,
  getOccurrenceById,
  updateOccurrence,
  deleteOccurrence,
  getOccurrenceStats
};

export default occurrenceService;
