
import api, { basePathUrlApiV1 } from './api';
import { PoliceStation } from '../types';
import { toast } from "sonner";

const getAllPoliceStations = async (): Promise<PoliceStation[]> => {
  try {
    const response = await api.get(`${basePathUrlApiV1}/policeStation`);
    return response.data;
  } catch (error) {
    console.error('Get all police stations error:', error);
    toast.error("Erro ao buscar delegacias.");
    throw error;
  }
};

const getPoliceStationById = async (id: string): Promise<PoliceStation> => {
  try {
    const response = await api.get(`${basePathUrlApiV1}/policeStation/${id}`);
    return response.data;
  } catch (error) {
    console.error('Get police station by id error:', error);
    toast.error("Erro ao buscar detalhes da delegacia.");
    throw error;
  }
};

const createPoliceStation = async (station: Omit<PoliceStation, 'id'>): Promise<PoliceStation> => {
  try {
    const response = await api.post(`${basePathUrlApiV1}/policeStation/save`, station);
    toast.success("Delegacia criada com sucesso!");
    return response.data;
  } catch (error) {
    console.error('Create police station error:', error);
    toast.error("Erro ao criar delegacia.");
    throw error;
  }
};

const updatePoliceStation = async (id: string, station: Partial<PoliceStation>): Promise<PoliceStation> => {
  try {
    const response = await api.put(`${basePathUrlApiV1}/policeStation/${id}`, station);
    toast.success("Delegacia atualizada com sucesso!");
    return response.data;
  } catch (error) {
    console.error('Update police station error:', error);
    toast.error("Erro ao atualizar delegacia.");
    throw error;
  }
};

const deletePoliceStation = async (id: string): Promise<void> => {
  try {
    await api.delete(`${basePathUrlApiV1}/policeStation/${id}`);
    toast.success("Delegacia excluída com sucesso!");
  } catch (error) {
    console.error('Delete police station error:', error);
    toast.error("Erro ao excluir delegacia.");
    throw error;
  }
};

const policeStationService = {
  getAllPoliceStations,
  getPoliceStationById,
  createPoliceStation,
  updatePoliceStation,
  deletePoliceStation
};

export default policeStationService;
