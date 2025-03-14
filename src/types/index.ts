
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
}

export interface PoliceStation {
  id: string;
  name: string;
  email: string;
  phone: string;
  latitude: number;
  longitude: number;
}

export interface Permission {
  id: string;
  role: string;
}

export interface Occurrence {
  id: string;
  title: string;
  description: string;
  type: 'homicidio' | 'furto' | 'roubo' | 'outros';
  latitude: number;
  longitude: number;
  date: string;
  time: string;
  policeStation_id: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OccurrenceStats {
  all: number;
  self: number;
  murders: number;
  thefts: number;
}
