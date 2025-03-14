
import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatCard from '@/components/StatCard';
import Map from '@/components/Map';
import { FileText, AlertTriangle, ShieldAlert, MapPin } from 'lucide-react';
import occurrenceService from '@/services/occurrenceService';
import policeStationService from '@/services/policeStationService';
import authService from '@/services/authService';
import notificationService from '@/services/notificationService';
import { OccurrenceStats, Occurrence, PoliceStation } from '@/types';
import { toast } from 'sonner';
import { useInterval } from '@/hooks/use-interval';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<OccurrenceStats | null>(null);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [policeStations, setPoliceStations] = useState<PoliceStation[]>([]);
  const [loading, setLoading] = useState(true);
  
  const isAdmin = authService.isAdmin();

  const fetchOccurrences = useCallback(async () => {
    try {
      const occurrencesData = await occurrenceService.getUserOccurrences();
      setOccurrences(prev => {
        if (prev.length > 0) {
          // Check for new occurrences
          notificationService.checkForNewOccurrences(occurrencesData);
        }
        return occurrencesData;
      });
    } catch (error) {
      console.error('Error fetching occurrences:', error);
    }
  }, []);

  // Function to fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      const statsData = await occurrenceService.getOccurrenceStats();
      setStats(statsData);
      
      // Fetch occurrences based on user role
      await fetchOccurrences();
      
      const stationsData = await policeStationService.getAllPoliceStations();
      setPoliceStations(stationsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  }, [fetchOccurrences]);

  // Initial data load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Poll for new occurrences every 30 seconds
  useInterval(() => {
    fetchOccurrences();
  }, 30000); // 30 seconds

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao Sistema de Registro de Ocorrências
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Ocorrências"
          value={stats?.all || 0}
          icon={<FileText className="h-4 w-4" />}
        />
        
        <StatCard
          title="Minhas Ocorrências"
          value={stats?.self || 0}
          icon={<FileText className="h-4 w-4" />}
        />
        
        <StatCard
          title="Homicídios"
          value={stats?.murders || 0}
          icon={<AlertTriangle className="h-4 w-4" />}
          className="border-ocorrencia-vermelho/20"
        />
        
        <StatCard
          title="Furtos"
          value={stats?.thefts || 0}
          icon={<ShieldAlert className="h-4 w-4" />}
        />
      </div>
      
      <div className="grid gap-4 grid-cols-1">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              <span>{isAdmin ? 'Mapa de Ocorrências' : 'Mapa das Minhas Ocorrências'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[600px] w-full flex items-center justify-center">
                <p>Carregando mapa...</p>
              </div>
            ) : (
              <Map 
                occurrences={occurrences} 
                policeStations={policeStations} 
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
