import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Map from '@/components/Map';
import { MapPin, FileText, Users, Shield } from 'lucide-react';
import occurrenceService from '@/services/occurrenceService';
import policeStationService from '@/services/policeStationService';
import { Occurrence, PoliceStation } from '@/types';
import { toast } from 'sonner';
import { useInterval } from '@/hooks/use-interval';
import { useIsMobile } from '@/hooks/use-mobile';
import api, { basePathUrlApiV1 } from '@/services/api';
import authService from '@/services/authService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';

const COLORS = ['#FF4B4B', '#FFA726', '#66BB6A', '#42A5F5', '#7E57C2', '#EC407A', '#26A69A'];

const Dashboard: React.FC = () => {
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [policeStations, setPoliceStations] = useState<PoliceStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    recent: 0
  });
  const [markers, setMarkers] = useState([]);
  const [graphData, setGraphData] = useState({
    typeData: [],
    monthlyData: []
  });
  
  const isMobile = useIsMobile();
  const isAdmin = authService.isAdmin();

  const processGraphData = (occurrences: Occurrence[]) => {
    // Processa dados por tipo de ocorrência
    const typeCounts = occurrences.reduce((acc: { [key: string]: { count: number, recent: number } }, occ) => {
      const type = occ.type || 'Não especificado';
      if (!acc[type]) {
        acc[type] = { count: 0, recent: 0 };
      }
      acc[type].count++;

      // Verifica se é uma ocorrência recente (últimos 7 dias)
      const occDate = new Date(occ.date);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      if (occDate >= sevenDaysAgo) {
        acc[type].recent++;
      }

      return acc;
    }, {});

    const typeData = Object.entries(typeCounts).map(([type, data]) => ({
      type,
      count: data.count,
      recent: data.recent
    }));

    // Processa dados mensais
    const monthlyCounts = occurrences.reduce((acc: { [key: string]: number }, occ) => {
      const date = new Date(occ.date);
      const month = date.toLocaleString('pt-BR', { month: 'short' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    const monthlyData = Object.entries(monthlyCounts).map(([month, count]) => ({
      month,
      count
    }));

    setGraphData({
      typeData,
      monthlyData
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = isAdmin 
        ? await occurrenceService.getAllOccurrences()
        : await occurrenceService.getUserOccurrences();
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
      
      // Processa dados para os gráficos
      processGraphData(occurrencesData);
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

  useEffect(() => {
    const fetchMarkers = async () => {
      try {
        const response = await api.get(`${basePathUrlApiV1}/policeStation`);
        setMarkers(response.data);
      } catch (error) {
        console.error('Error fetching markers:', error);
      }
    };

    fetchMarkers();
  }, []);

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
            <CardTitle className="text-sm font-medium">{isAdmin ? "Total" : "Minhas"} Ocorrências</CardTitle>
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

      {/* Gráficos (apenas para administradores) */}
      {isAdmin && (
        <>
          {/* Gráfico de Barras - Tipos de Ocorrências */}
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Ocorrências</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={graphData.typeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="type" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      yAxisId="left"
                      orientation="left"
                      stroke="#8884d8"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="#82ca9d"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                      formatter={(value: number) => [`${value} ocorrências`, '']}
                    />
                    <Bar 
                      yAxisId="left"
                      dataKey="count" 
                      name="Total"
                      fill="#8884d8"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      yAxisId="right"
                      dataKey="recent" 
                      name="Últimos 7 dias"
                      fill="#82ca9d"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Pizza - Distribuição de Ocorrências */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Ocorrências</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={graphData.typeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="type"
                    >
                      {graphData.typeData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                      formatter={(value: number) => [`${value} ocorrências`, '']}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value) => value}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Linha - Ocorrências por Mês */}
          <Card>
            <CardHeader>
              <CardTitle>Ocorrências por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graphData.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                      formatter={(value: number) => [`${value} ocorrências`, '']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Dashboard;
