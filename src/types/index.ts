import { OccurrenceType } from '@/components/OccurrenceTypeModal';

export interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  avatar?: string;
  role?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  isAdmin?: boolean;
  created_at?: string;
  updated_at?: string;
  Permission?: {
    role: string;
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isAdmin: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  cpf: string;
  avatar?: File;
}

export interface PoliceStation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  role: string;
}

export interface Occurrence {
  id: number;
  type: string;
  title: string | null;
  description: string | null;
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  photos: string[];
  status: 'EM_ABERTO' | 'ACEITO' | 'ATENDIDO' | 'ENCERRADO';
  User?: {
    id: string;
    name: string;
    email: string;
    cpf: string;
    Permission: {
      role: string;
    };
  };
}

export interface OccurrenceStats {
  all: number;
  self: number;
  murders: number;
  thefts: number;
}

export interface CreateOccurrenceDTO {
  title?: string;
  description?: string;
  type: OccurrenceType;
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  policeStation_id?: number;
}
