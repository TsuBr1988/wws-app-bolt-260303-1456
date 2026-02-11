import { supabase } from '../lib/supabase';

export interface ProspectionTeamKPIs {
  currentMonth: {
    contatosAtivados: number;
    totalAtividades: number;
    totalConexoes: number;
    mql: number;
    sql: number;
    reunioes: number;
  };
  previousMonth: {
    contatosAtivados: number;
    totalAtividades: number;
    totalConexoes: number;
    mql: number;
    sql: number;
    reunioes: number;
  };
  changes: {
    contatosAtivados: { value: number; percentage: number };
    totalAtividades: { value: number; percentage: number };
    totalConexoes: { value: number; percentage: number };
    mql: { value: number; percentage: number };
    sql: { value: number; percentage: number };
    reunioes: { value: number; percentage: number };
  };
}

function getMonthRange(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
}

function calculateChange(current: number, previous: number): { value: number; percentage: number } {
  const value = current - previous;
  const percentage = previous > 0 ? ((current - previous) / previous) * 100 : (current > 0 ? 100 : 0);
  return { value, percentage };
}

export async function getProspectionTeamKPIs(year?: number): Promise<ProspectionTeamKPIs> {
  const now = new Date();
  const targetYear = year || now.getFullYear();
  const currentMonthIndex = now.getMonth();
  const previousMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;
  const previousMonthYear = currentMonthIndex === 0 ? targetYear - 1 : targetYear;

  const currentRange = getMonthRange(targetYear, currentMonthIndex);
  const previousRange = getMonthRange(previousMonthYear, previousMonthIndex);

  const { data: currentData, error: currentError } = await supabase
    .from('individual_prospection')
    .select('*')
    .gte('date', currentRange.start)
    .lte('date', currentRange.end);

  if (currentError) {
    console.error('Error fetching current month data:', currentError);
    throw currentError;
  }

  const { data: previousData, error: previousError } = await supabase
    .from('individual_prospection')
    .select('*')
    .gte('date', previousRange.start)
    .lte('date', previousRange.end);

  if (previousError) {
    console.error('Error fetching previous month data:', previousError);
    throw previousError;
  }

  const calculateTotals = (data: any[]) => {
    return data.reduce((acc, record) => {
      return {
        contatosAtivados: acc.contatosAtivados + (parseInt(record.contatos_ativados) || 0),
        totalAtividades: acc.totalAtividades + (parseInt(record.atividades_qtde) || 0),
        totalConexoes: acc.totalConexoes + (parseInt(record.conexoes) || 0),
        mql: acc.mql + (parseInt(record.mql) || 0),
        sql: acc.sql + (parseInt(record.sql) || 0),
        reunioes: acc.reunioes + (parseInt(record.reunioes) || 0),
      };
    }, {
      contatosAtivados: 0,
      totalAtividades: 0,
      totalConexoes: 0,
      mql: 0,
      sql: 0,
      reunioes: 0,
    });
  };

  const currentMonthTotals = calculateTotals(currentData || []);
  const previousMonthTotals = calculateTotals(previousData || []);

  return {
    currentMonth: currentMonthTotals,
    previousMonth: previousMonthTotals,
    changes: {
      contatosAtivados: calculateChange(currentMonthTotals.contatosAtivados, previousMonthTotals.contatosAtivados),
      totalAtividades: calculateChange(currentMonthTotals.totalAtividades, previousMonthTotals.totalAtividades),
      totalConexoes: calculateChange(currentMonthTotals.totalConexoes, previousMonthTotals.totalConexoes),
      mql: calculateChange(currentMonthTotals.mql, previousMonthTotals.mql),
      sql: calculateChange(currentMonthTotals.sql, previousMonthTotals.sql),
      reunioes: calculateChange(currentMonthTotals.reunioes, previousMonthTotals.reunioes),
    }
  };
}
