import { toast } from 'sonner';
import { Occurrence, CreateOccurrenceDTO } from '@/types';
import { OccurrenceType } from '@/components/OccurrenceTypeModal';

const basePathUrlApiV1 = '/api/v1';
const API_URL = import.meta.env.PROD 
  ? 'https://api.belemsistemas.com'
  : import.meta.env.VITE_API_URL;

const occurrenceService = {
  createOccurrence: async (formData: FormData) => {
    try {
      const response = await fetch(`${API_URL}${basePathUrlApiV1}/ocurrences/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
          // IMPORTANTE: Não definir Content-Type aqui, deixe o navegador definir automaticamente
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to create occurrence');
      }

      const data = await response.json();
      toast.success("Ocorrência registrada com sucesso!");
      return data;
    } catch (error) {
      console.error('Error creating occurrence:', error);
      toast.error('Erro ao criar ocorrência');
      throw error;
    }
  },

  createQuickOccurrence: async (latitude: number, longitude: number, type: OccurrenceType) => {
    try {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const time = `${hours}:${minutes}:00`;

      const data: CreateOccurrenceDTO = {
        type,
        latitude,
        longitude,
        date: now.toISOString().split('T')[0],
        time,
        policeStation_id: 0, // Será definido pelo backend
      };

      const response = await fetch(`${API_URL}${basePathUrlApiV1}/ocurrences/quick`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to create quick occurrence');
      }

      const responseData = await response.json();
      toast.success("Ocorrência rápida registrada com sucesso!");
      return responseData;
    } catch (error) {
      console.error('Error creating quick occurrence:', error);
      toast.error('Erro ao registrar ocorrência rápida');
      throw error;
    }
  },

  getUserOccurrences: async () => {
    try {
      const response = await fetch(`${API_URL}${basePathUrlApiV1}/ocurrences/self`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user occurrences');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user occurrences:', error);
      toast.error('Erro ao buscar suas ocorrências');
      throw error;
    }
  },

  getOccurrenceById: async (id: number) => {
    try {
      const response = await fetch(`${API_URL}${basePathUrlApiV1}/ocurrences/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch occurrence');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching occurrence:', error);
      toast.error('Erro ao buscar ocorrência');
      throw error;
    }
  },

  updateOccurrence: async (id: number, formData: FormData) => {
    try {
      const response = await fetch(`${API_URL}${basePathUrlApiV1}/ocurrences/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
          // IMPORTANTE: Não definir Content-Type aqui, deixe o navegador definir automaticamente
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to update occurrence');
      }

      const data = await response.json();
      toast.success("Ocorrência atualizada com sucesso!");
      return data;
    } catch (error) {
      console.error('Error updating occurrence:', error);
      toast.error('Erro ao atualizar ocorrência');
      throw error;
    }
  },

  deleteOccurrence: async (id: number) => {
    try {
      const response = await fetch(`${API_URL}${basePathUrlApiV1}/ocurrences/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete occurrence');
      }

      const data = await response.json();
      toast.success("Ocorrência excluída com sucesso!");
      return data;
    } catch (error) {
      console.error('Error deleting occurrence:', error);
      toast.error('Erro ao excluir ocorrência');
      throw error;
    }
  },

  getAllOccurrences: async () => {
    try {
      const response = await fetch(`${API_URL}${basePathUrlApiV1}/ocurrences`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch all occurrences');
      }

      return await response.json();
    } catch (error) {
      console.error('Get all occurrences error:', error);
      toast.error("Erro ao buscar todas as ocorrências.");
      throw error;
    }
  },

  sendNotification: async (occurrenceId: string) => {
    try {
      const response = await fetch(`${API_URL}${basePathUrlApiV1}/notifications/occurrence/${occurrenceId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: "Nova atualização na ocorrência: A situação está sendo monitorada pela polícia"
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Erro ao enviar notificação');
      throw error;
    }
  },

  updateStatus: async (id: number, status: 'EM_ABERTO' | 'ACEITO' | 'ATENDIDO' | 'ENCERRADO' | 'REJEITADO') => {
    try {
      const response = await fetch(`${API_URL}/api/v1/ocurrences/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update occurrence status');
      }

      const data = await response.json();
      toast.success("Status da ocorrência atualizado com sucesso!");
      return data;
    } catch (error) {
      console.error('Error updating occurrence status:', error);
      toast.error('Erro ao atualizar status da ocorrência');
      throw error;
    }
  }
};

export default occurrenceService;
