import { STATUS_ORDER_RANK } from '../constants/status';

function getStatusRank(status?: string) {
  if (!status) return STATUS_ORDER_RANK.default;
  return STATUS_ORDER_RANK[status] ?? STATUS_ORDER_RANK.default;
}

function getDateValue(dateString?: string | null): number {
  if (!dateString) return Number.POSITIVE_INFINITY; // Nulos por último
  return new Date(dateString).getTime();
}

export function applyDefaultOrder(list: any[]) {
  const clone = [...(list ?? [])];
  
  clone.sort((a, b) => {
    // 1. Primeiro critério: ranking por status
    const rankA = getStatusRank(a.status || a.situacao);
    const rankB = getStatusRank(b.status || b.situacao);
    
    if (rankA !== rankB) {
      return rankA - rankB;
    }

    // 2. Dentro do mesmo grupo: ordenar por próxima ação (crescente, nulos por último)
    const proximaAcaoA = getDateValue(a.data_proxima_acao || a.dataProximaAcao);
    const proximaAcaoB = getDateValue(b.data_proxima_acao || b.dataProximaAcao);
    
    if (proximaAcaoA !== proximaAcaoB) {
      return proximaAcaoA - proximaAcaoB;
    }

    // 3. Fallback: data do pregão (crescente, nulos por último)
    const dataPregaoA = getDateValue(a.data_pregao || a.dataHoraPregao || a.dataPregao);
    const dataPregaoB = getDateValue(b.data_pregao || b.dataHoraPregao || b.dataPregao);
    
    if (dataPregaoA !== dataPregaoB) {
      return dataPregaoA - dataPregaoB;
    }

    // 4. Fallback final: created_at (crescente)
    const createdA = getDateValue(a.created_at || a.createdAt);
    const createdB = getDateValue(b.created_at || b.createdAt);
    
    if (createdA !== createdB) {
      return createdA - createdB;
    }

    // 5. Fallback estável por ID
    return String(a.id).localeCompare(String(b.id));
  });
  
  return clone;
}