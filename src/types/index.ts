import { OccurrenceType } from '@/components/OccurrenceTypeModal';

export interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  avatar?: string;
  role?: string;
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
  id: string;
  title: string | null;
  description: string | null;
  type: OccurrenceType;
  latitude: number;
  longitude: number;
  date: string;
  time: string;
  resolved: boolean;
  user_id: string;
  policeStation_id: string | null;
  created_at: string;
  updated_at: string;
  User?: {
    id: string;
    name: string;
    avatar: string;
  };
  PoliceStation?: PoliceStation | null;
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
