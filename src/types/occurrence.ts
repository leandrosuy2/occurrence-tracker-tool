export interface Occurrence {
  id: string;
  title: string;
  type: string;
  description?: string;
  latitude: number;
  longitude: number;
  date: string;
  time: string;
  created_at: string;
  updated_at: string;
  policeStation_id?: number;
} 