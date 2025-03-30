import axios from 'axios';
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL;
// const API_URL = 'http://localhost:3000';
export const basePathUrlApiV1 = "/api/v1";

const api = axios.create({
  baseURL: API_URL,
});

// Inicializa o token no header da API se existir
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Interceptor para adicionar o token em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Se for FormData, remove o Content-Type para deixar o navegador definir automaticamente
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
    // Garante que o FormData seja enviado corretamente
    config.headers['Accept'] = 'application/json';
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
