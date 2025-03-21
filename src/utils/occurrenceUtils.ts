import { OccurrenceType } from '@/components/OccurrenceTypeModal';

export const formatOccurrenceType = (type: string): string => {
  switch (type) {
    case 'AGRESSOES_OU_BRIGAS': return 'Agressões ou brigas';
    case 'APOIO_EM_ACIDENTES_DE_TRANSITO': return 'Apoio em acidentes de trânsito';
    case 'DEPREDACAO_DO_PATRIMONIO_PUBLICO': return 'Depredação do patrimônio público';
    case 'EMERGENCIAS_AMBIENTAIS': return 'Emergências ambientais';
    case 'INVASAO_DE_PREDIOS_OU_TERRENOS_PUBLICOS': return 'Invasão de prédios ou terrenos públicos';
    case 'MARIA_DA_PENHA': return 'Maria da Penha';
    case 'PERTURBACAO_DO_SOSSEGO_PUBLICO': return 'Perturbação do sossego público';
    case 'POSSE_DE_ARMAS_BRANCAS_OU_DE_FOGO': return 'Posse de armas brancas ou de fogo';
    case 'PESSOA_SUSPEITA': return 'Pessoa suspeita';
    case 'ROUBOS_E_FURTOS': return 'Roubos e furtos';
    case 'TENTATIVA_DE_SUICIDIO': return 'Tentativa de suicídio';
    case 'USO_E_TRAFICO_DE_DROGAS': return 'Uso e tráfico de drogas';
    case 'VIOLENCIA_DOMESTICA': return 'Violência doméstica';
    case 'OUTROS': return 'Ocorrência rápida';
    case 'Não especificado': return 'Não especificado';
    default: return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
}; 