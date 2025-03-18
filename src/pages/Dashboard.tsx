import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Map from '@/components/Map';
import { MapPin, FileText } from 'lucide-react';
import occurrenceService from '@/services/occurrenceService';
import policeStationService from '@/services/policeStationService';
import { Occurrence, PoliceStation } from '@/types';
import { toast } from 'sonner';
import { useInterval } from '@/hooks/use-interval';
import { useIsMobile } from '@/hooks/use-mobile';

const Dashboard: React.FC = () => {
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [policeStations, setPoliceStations] = useState<PoliceStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    recent: 0
  });
  
  const isMobile = useIsMobile();

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await occurrenceService.getUserOccurrences();
      const occurrencesData = response.data || [];
      setOccurrences(occurrencesData);
      
      const stationsData = await policeStationService.getAllPoliceStations();
      setPoliceStations(stationsData);

      const total = occurrencesData.length;
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recent = occurrencesData.filter(occ => {
        const occDate = new Date(occ.date);
        return occDate >= sevenDaysAgo;
      }).length;

      setStats({ total, recent });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useInterval(() => {
    fetchData();
  }, 30000);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao Sistema de Registro de Ocorrências
        </p>
      </div>
      
      {/* Cards de Estatísticas */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Minhas Ocorrências</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Últimos 7 Dias</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recent}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Mapa */}
      <div className="grid gap-4 grid-cols-1">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              <span>Mapa de Ocorrências</span>
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
