import { supabase } from '../lib/supabase';

export type EmployeeName = 'André' | 'Andressa' | 'Pedro';

export interface IndividualProspectionRow {
  id: string;
  employee_name: EmployeeName;
  date: string;
  contatos_ativados: number;
  mql: number;
  sql: number;
  atividades_qtde: number;
  atividades_perc: number;
  reunioes: number;
  conexoes: number;
  created_at: string;
  updated_at: string;
}

export interface DateWithMetrics {
  date_id: string;
  date: string;
  metrics: Record<string, number>;
}

const METRICS_CONFIG: Record<EmployeeName, string[]> = {
  'Pedro': ['contatos_ativados', 'mql', 'atividades_qtde', 'atividades_perc', 'reunioes', 'conexoes'],
  'Andressa': ['contatos_ativados', 'mql', 'atividades_qtde', 'atividades_perc', 'reunioes', 'conexoes'],
  'André': ['sql', 'atividades_qtde', 'atividades_perc', 'conexoes', 'reunioes', 'contatos_ativados']
};

export const getMetricsForEmployee = (employeeName: EmployeeName): string[] => {
  return METRICS_CONFIG[employeeName] || [];
};

export const getMetricLabel = (metricName: string): string => {
  const labels: Record<string, string> = {
    'contatos_ativados': 'Contatos ativados',
    'mql': 'MQL',
    'atividades_qtde': 'Atividades (qtde.)',
    'atividades_perc': 'Atividades (%)',
    'reunioes': 'Reuniões',
    'conexoes': 'Conexões',
    'sql': 'SQL'
  };
  return labels[metricName] || metricName;
};

export const individualProspectionService = {
  async getEmployeeData(employeeName: EmployeeName): Promise<DateWithMetrics[]> {
    const { data, error } = await supabase
      .from('individual_prospection')
      .select('*')
      .eq('employee_name', employeeName)
      .order('date', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    return data.map(row => ({
      date_id: row.id,
      date: row.date,
      metrics: {
        contatos_ativados: row.contatos_ativados,
        mql: row.mql,
        sql: row.sql,
        atividades_qtde: row.atividades_qtde,
        atividades_perc: row.atividades_perc,
        reunioes: row.reunioes,
        conexoes: row.conexoes
      }
    }));
  },

  async addDate(employeeName: EmployeeName, date: string): Promise<string> {
    const { data, error } = await supabase
      .from('individual_prospection')
      .insert({
        employee_name: employeeName,
        date,
        contatos_ativados: 0,
        mql: 0,
        sql: 0,
        atividades_qtde: 0,
        atividades_perc: 0,
        reunioes: 0,
        conexoes: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  },

  async updateMetric(dateId: string, metricName: string, value: number): Promise<void> {
    const updateData: any = {
      [metricName]: value,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('individual_prospection')
      .update(updateData)
      .eq('id', dateId);

    if (error) throw error;
  },

  async deleteDate(dateId: string): Promise<void> {
    const { error } = await supabase
      .from('individual_prospection')
      .delete()
      .eq('id', dateId);

    if (error) throw error;
  }
};
