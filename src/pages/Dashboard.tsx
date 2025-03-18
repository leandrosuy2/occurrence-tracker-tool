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
import { useIsMobile } from '@/hooks/use-mobile';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<OccurrenceStats | null>(null);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [policeStations, setPoliceStations] = useState<PoliceStation[]>([]);
  const [loading, setLoading] = useState(true);
  
  const isAdmin = authService.isAdmin();
  const isMobile = useIsMobile();

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

  // Get numeric values for stats or default to 0
  const getAllCount = () => {
    if (!stats) return 0;
    if (stats.all === null) return 0;
    if (typeof stats.all === 'object' && stats.all !== null) {
      return 'count' in stats.all ? Number(stats.all.count) : 0;
    }
    return Number(stats.all) || 0;
  };
  
  const getSelfCount = () => {
    if (!stats) return 0;
    if (stats.self === null) return 0;
    if (typeof stats.self === 'object' && stats.self !== null) {
      return 'count' in stats.self ? Number(stats.self.count) : 0;
    }
    return Number(stats.self) || 0;
  };
  
  const getMurdersCount = () => {
    if (!stats) return 0;
    if (stats.murders === null) return 0;
    if (typeof stats.murders === 'object' && stats.murders !== null) {
      return 'count' in stats.murders ? Number(stats.murders.count) : 0;
    }
    return Number(stats.murders) || 0;
  };
  
  const getTheftsCount = () => {
    if (!stats) return 0;
    if (stats.thefts === null) return 0;
    if (typeof stats.thefts === 'object' && stats.thefts !== null) {
      return 'count' in stats.thefts ? Number(stats.thefts.count) : 0;
    }
    return Number(stats.thefts) || 0;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao Sistema de Registro de Ocorrências
        </p>
      </div>
      
      <div className={`grid gap-4 ${isAdmin ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'}`}>
        <StatCard
          title="Total de Ocorrências"
          value={getAllCount()}
          icon={<FileText className="h-4 w-4" />}
        />
        
        <StatCard
          title="Minhas Ocorrências"
          value={getSelfCount()}
          icon={<FileText className="h-4 w-4" />}
        />
        
        {isAdmin && (
          <>
            <StatCard
              title="Homicídios"
              value={getMurdersCount()}
              icon={<AlertTriangle className="h-4 w-4" />}
              className="border-ocorrencia-vermelho/20"
            />
            
            <StatCard
              title="Furtos"
              value={getTheftsCount()}
              icon={<ShieldAlert className="h-4 w-4" />}
            />
          </>
        )}
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
              <div className="h-[300px] md:h-[400px] lg:h-[600px] w-full flex items-center justify-center">
                <p>Carregando mapa...</p>
              </div>
            ) : (
              <Map 
                occurrences={occurrences} 
                policeStations={policeStations}
                height={isMobile ? "h-[300px]" : "h-[600px]"}
                getUserLocation={true}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
