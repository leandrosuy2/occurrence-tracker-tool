import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Map from '@/components/Map';
import { MapPin, FileText, Users, Shield, Plus, List } from 'lucide-react';
import occurrenceService from '@/services/occurrenceService';
import policeStationService from '@/services/policeStationService';
import { Occurrence, PoliceStation } from '@/types';
import { toast } from 'sonner';
import { useInterval } from '@/hooks/use-interval';
import { useIsMobile } from '@/hooks/use-mobile';
import api, { basePathUrlApiV1 } from '@/services/api';
import authService from '@/services/authService';
import { formatOccurrenceType } from '@/utils/occurrenceUtils';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import OccurrenceForm from '@/components/OccurrenceForm';
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
import ChatModal from '@/components/ChatModal';

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
  const [isNewOccurrenceModalOpen, setIsNewOccurrenceModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState<string | null>(null);
  const currentToken = localStorage.getItem('token') || '';
  
  const isMobile = useIsMobile();
  const isAdmin = authService.isAdmin();
  const navigate = useNavigate();

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

    const typeData = Object.entries(typeCounts)
      .map(([type, data]) => ({
        rawType: type,
        type: formatOccurrenceType(type),
        shortType: formatOccurrenceType(type).split(' ').slice(0, 2).join(' ') + (formatOccurrenceType(type).split(' ').length > 2 ? '...' : ''),
        count: data.count,
        recent: data.recent
      }))
      .sort((a, b) => b.count - a.count); // Ordena por contagem decrescente

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
    if (!isNewOccurrenceModalOpen && !isChatModalOpen) {
      fetchData();
    }
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

  const CustomBarLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (isMobile && value < 2) return null; // Não mostra labels pequenos no mobile
    return (
      <text x={x + width / 2} y={y - 5} fill="#666" textAnchor="middle" fontSize={isMobile ? 10 : 12}>
        {value}
      </text>
    );
  };

  const CustomPieLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    if (percent < (isMobile ? 0.1 : 0.05)) return null; // Aumenta o limite mínimo no mobile
    
    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={isMobile ? 10 : 12}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const handleChatOpen = (occurrenceId: string) => {
    setSelectedOccurrenceId(occurrenceId);
    setIsChatModalOpen(true);
  };

  const handleChatClose = () => {
    setIsChatModalOpen(false);
    setSelectedOccurrenceId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">BEM VINDO</h1>
        <p className="text-muted-foreground">
          {isAdmin 
            ? "ESSE É O SEU PAINEL DE CONTROLE DE OCORRENCIAS"
            : "Faça sua ocorrência detalhada clicando no botão abaixo, ou uma ocorrência rápida clicando em SOS."
          }
        </p>
      </div>
      
      {/* Botões de Ação para Usuários Não-Admin */}
      {!isAdmin && (
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            className="flex-1 bg-ocorrencia-azul-escuro hover:bg-ocorrencia-azul-medio text-white"
            onClick={() => setIsNewOccurrenceModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Faça sua ocorrência detalhada
          </Button>
          
          <Button 
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/ocorrencias?filter=my')}
          >
            <List className="mr-2 h-4 w-4" />
            Minhas Ocorrências
          </Button>
        </div>
      )}
      
      {/* Modal de Nova Ocorrência - Apenas para usuários não-admin */}
      {!isAdmin && (
        <Dialog open={isNewOccurrenceModalOpen} onOpenChange={setIsNewOccurrenceModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <OccurrenceForm 
              onSuccess={() => {
                setIsNewOccurrenceModalOpen(false);
                fetchData(); // Recarrega os dados do dashboard
              }}
              onCancel={() => setIsNewOccurrenceModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

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

        {isAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Últimos 7 Dias</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recent}</div>
            </CardContent>
          </Card>
        )}
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
                onOccurrenceClick={handleChatOpen}
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
            <CardContent className="p-2 sm:p-6">
              <div className={`h-[${isMobile ? '300px' : '400px'}] w-full`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={graphData.typeData}
                    margin={isMobile ? 
                      { top: 20, right: 10, left: 0, bottom: 60 } : 
                      { top: 20, right: 30, left: 20, bottom: 100 }
                    }
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="shortType" 
                      angle={-45}
                      textAnchor="end"
                      height={isMobile ? 80 : 120}
                      interval={0}
                      tick={{ fontSize: isMobile ? 9 : 11 }}
                    />
                    <YAxis 
                      yAxisId="left"
                      orientation="left"
                      stroke="#8884d8"
                      tick={{ fontSize: isMobile ? 9 : 11 }}
                      width={isMobile ? 30 : 40}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="#82ca9d"
                      tick={{ fontSize: isMobile ? 9 : 11 }}
                      width={isMobile ? 30 : 40}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '8px',
                        fontSize: isMobile ? '12px' : '14px'
                      }}
                      formatter={(value: number, name: string, entry: any) => [
                        `${value} ocorrência${value !== 1 ? 's' : ''}`,
                        entry.payload.type
                      ]}
                    />
                    <Bar 
                      yAxisId="left"
                      dataKey="count" 
                      name="Total"
                      fill="#8884d8"
                      radius={[4, 4, 0, 0]}
                      label={<CustomBarLabel />}
                    />
                    <Bar 
                      yAxisId="right"
                      dataKey="recent" 
                      name="Últimos 7 dias"
                      fill="#82ca9d"
                      radius={[4, 4, 0, 0]}
                    />
                    <Legend 
                      verticalAlign="top"
                      height={36}
                      wrapperStyle={isMobile ? { fontSize: '10px' } : undefined}
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
            <CardContent className="p-2 sm:p-6">
              <div className={`h-[${isMobile ? '300px' : '400px'}] w-full`}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={graphData.typeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={CustomPieLabel}
                      outerRadius={isMobile ? 80 : 130}
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
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '8px',
                        fontSize: isMobile ? '12px' : '14px'
                      }}
                      formatter={(value: number, name: string, entry: any) => [
                        `${value} ocorrência${value !== 1 ? 's' : ''}`,
                        entry.payload.type
                      ]}
                    />
                    <Legend 
                      layout={isMobile ? "horizontal" : "vertical"}
                      align={isMobile ? "center" : "right"}
                      verticalAlign={isMobile ? "bottom" : "middle"}
                      wrapperStyle={isMobile ? { fontSize: '10px' } : undefined}
                      formatter={(value, entry: any) => {
                        const type = entry.payload.type;
                        const maxLength = isMobile ? 15 : 25;
                        return type.length > maxLength ? type.substring(0, maxLength) + '...' : type;
                      }}
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
            <CardContent className="p-2 sm:p-6">
              <div className={`h-[${isMobile ? '300px' : '400px'}] w-full`}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={graphData.monthlyData}
                    margin={isMobile ? 
                      { top: 20, right: 10, left: 0, bottom: 20 } : 
                      { top: 20, right: 30, left: 20, bottom: 30 }
                    }
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month"
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      height={isMobile ? 40 : 60}
                    />
                    <YAxis 
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      width={isMobile ? 30 : 40}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '8px',
                        fontSize: isMobile ? '12px' : '14px'
                      }}
                      formatter={(value: number) => [`${value} ocorrência${value !== 1 ? 's' : ''}`, '']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ r: isMobile ? 3 : 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ChatModal - Always render but control visibility with isOpen */}
      <ChatModal
        isOpen={isChatModalOpen}
        onClose={handleChatClose}
        occurrenceId={selectedOccurrenceId || ''}
        userId={currentUser?.id || ''}
        token={currentToken}
      />
    </div>
  );
};

export default Dashboard;
