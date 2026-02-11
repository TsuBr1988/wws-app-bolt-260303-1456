import { supabase } from '../lib/supabase';
import { configurationService } from './configurationService';

export interface MonthlyCost {
  year: number;
  month: number;
  amount: number;
  cost_type?: string;
}

export interface Rolling12MonthsResult {
  total: number;
  months: MonthlyCost[];
  period: {
    start: { year: number; month: number };
    end: { year: number; month: number };
  };
}

/**
 * Cache para evitar recálculos desnecessários
 * Chave: "YYYY-MM" (ano-mês de referência)
 */
const costsCache = new Map<string, Rolling12MonthsResult>();

const debugLog = (...args: unknown[]) => {
  if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_LOGS === 'true') console.log(...args);
};

/**
 * Calcula a soma dos custos operacionais dos últimos 12 meses (janela móvel)
 * @param refDate Data de referência (normalmente o mês atual do dashboard)
 * @returns Soma total e detalhamento por mês
 */
export async function getRolling12MonthsCosts(refDate: Date): Promise<Rolling12MonthsResult> {
  const refYear = refDate.getFullYear();
  const refMonth = refDate.getMonth() + 1; // 1-12
  const cacheKey = `${refYear}-${String(refMonth).padStart(2, '0')}`;

  // Verificar cache primeiro
  if (costsCache.has(cacheKey)) {
    debugLog(`💾 [CostsService] Cache hit para ${cacheKey}`);
    return costsCache.get(cacheKey)!;
  }

  debugLog(`🔄 [CostsService] Calculando custos dos últimos 12 meses para referência: ${refYear}-${refMonth}`);

  try {
    // Buscar dados de custos operacionais
    const operationalCosts = await configurationService.getOperationalCosts();
    
    debugLog(`📊 [CostsService] Dados de custos carregados:`, {
      totalCostTypes: operationalCosts.length,
      costTypes: operationalCosts.map(cost => cost.name)
    });

    // Gerar os últimos 12 meses a partir da referência
    const months: MonthlyCost[] = [];
    let totalAmount = 0;

    for (let i = 11; i >= 0; i--) {
      // Calcular o mês M-i
      let targetYear = refYear;
      let targetMonth = refMonth - i;

      // Ajustar se o mês ficou negativo (atravessar ano)
      while (targetMonth <= 0) {
        targetMonth += 12;
        targetYear -= 1;
      }

      // Somar todos os tipos de custo para este mês específico
      let monthTotal = 0;
      
      operationalCosts.forEach(costType => {
        // Verificar se existe dados para o ano alvo
        const yearData = costType.years?.find(y => y.year === targetYear);
        if (yearData) {
          // Buscar o valor do mês específico
          const monthData = yearData.months.find(m => m.month === targetMonth);
          const monthValue = monthData?.value || 0;
          monthTotal += monthValue;
        }
      });

      months.push({
        year: targetYear,
        month: targetMonth,
        amount: monthTotal,
        cost_type: 'all_types_combined'
      });

      totalAmount += monthTotal;

      debugLog(`📅 [CostsService] Mês ${targetYear}-${String(targetMonth).padStart(2, '0')}: ${monthTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
    }

    const result: Rolling12MonthsResult = {
      total: totalAmount,
      months,
      period: {
        start: { year: months[0].year, month: months[0].month },
        end: { year: refYear, month: refMonth }
      }
    };

    debugLog(`✅ [CostsService] Custos dos últimos 12 meses calculados:`, {
      total: totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      period: `${result.period.start.month}/${result.period.start.year} → ${result.period.end.month}/${result.period.end.year}`,
      cacheKey
    });

    // Armazenar no cache
    costsCache.set(cacheKey, result);

    return result;

  } catch (error) {
    console.error('❌ [CostsService] Erro ao calcular custos dos últimos 12 meses:', error);
    
    // Fallback para valor padrão em caso de erro
    const fallbackResult: Rolling12MonthsResult = {
      total: 196017.31, // Valor de fallback
      months: [],
      period: {
        start: { year: refYear, month: refMonth - 11 },
        end: { year: refYear, month: refMonth }
      }
    };

    console.warn(`⚠️ [CostsService] Usando valor de fallback: ${fallbackResult.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
    
    return fallbackResult;
  }
}

/**
 * Limpa o cache de custos (usar quando os custos operacionais forem atualizados)
 */
export function clearCostsCache() {
  debugLog('🗑️ [CostsService] Limpando cache de custos');
  costsCache.clear();
}

/**
 * Formata o período de 12 meses para exibição
 */
export function formatCostsPeriod(result: Rolling12MonthsResult): string {
  const { start, end } = result.period;
  return `${String(start.month).padStart(2, '0')}/${start.year} → ${String(end.month).padStart(2, '0')}/${end.year}`;
}