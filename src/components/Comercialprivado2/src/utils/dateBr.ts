import { addDays, format, startOfWeek, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Calcula período de prospecção baseado em data de referência
 * Regra: Período = semana que termina no dia anterior à data de referência
 * @param refYmd - Data de referência no formato 'YYYY-MM-DD'
 * @returns Objeto com periodStart, periodEnd e weekStart para salvar no banco
 */
export function computeProspectionPeriod(refYmd: string) {
  try {
    // Data de referência (D) - sem horário
    const d = parseISO(refYmd);
    
    if (isNaN(d.getTime())) {
      throw new Error('Data de referência inválida');
    }
    
    // Período termina no dia anterior à data de referência (D-1)
    const periodEnd = addDays(d, -1);
    
    // Período começa na segunda-feira da semana que contém periodEnd
    const periodStart = startOfWeek(periodEnd, { weekStartsOn: 1 }); // 1 = segunda-feira
    
    // Calcular domingo da semana (6 dias após segunda)
    const sunday = addDays(periodStart, 6);
    
    return { 
      periodStart, 
      periodEnd: sunday,
      weekStart: format(periodStart, 'yyyy-MM-dd') // Para salvar no Supabase
    };
  } catch (error) {
    console.error('Erro ao calcular período de prospecção:', error);
    
    // Fallback para período atual se houver erro
    const today = new Date();
    const yesterday = addDays(today, -1);
    const monday = startOfWeek(yesterday, { weekStartsOn: 1 });
    const sunday = addDays(monday, 6);
    
    return {
      periodStart: monday,
      periodEnd: sunday,
      weekStart: format(monday, 'yyyy-MM-dd')
    };
  }
}

/**
 * Formata data em português brasileiro
 * @param d - Objeto Date
 * @returns String formatada como 'DD/MM/YYYY'
 */
export function fmtBr(d: Date): string {
  return format(d, 'dd/MM/yyyy', { locale: ptBR });
}

/**
 * Valida se uma string representa uma data válida
 * @param dateString - String da data no formato 'YYYY-MM-DD'
 * @returns true se a data for válida
 */
export function isValidDateString(dateString: string): boolean {
  if (!dateString) return false;
  
  try {
    const date = parseISO(dateString);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}