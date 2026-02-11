import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type WeeklyPerformance = Database['public']['Tables']['weekly_performance']['Row'];
type WeeklyPerformanceInsert = Database['public']['Tables']['weekly_performance']['Insert'];
type WeeklyPerformanceUpdate = Database['public']['Tables']['weekly_performance']['Update'];

export const weeklyPerformanceService = {
  // Buscar todas as performances semanais
  async getAll() {
    const { data, error } = await supabase
      .from('weekly_performance')
      .select(`
        *,
        employee:employees (
          id,
          name,
          avatar,
          role
        )
      `)
      .order('week_ending_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Buscar performance por funcionário
  async getByEmployee(employeeId: string) {
    const { data, error } = await supabase
      .from('weekly_performance')
      .select('*')
      .eq('employee_id', employeeId)
      .order('week_ending_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Buscar performance por semana
  async getByWeek(weekEndingDate: string) {
    const { data, error } = await supabase
      .from('weekly_performance')
      .select(`
        *,
        employee:employees (
          id,
          name,
          avatar,
          role
        )
      `)
      .eq('week_ending_date', weekEndingDate);

    if (error) throw error;
    return data || [];
  },

  // Criar ou atualizar performance semanal
  async upsert(performance: WeeklyPerformanceInsert) {
    const { data, error } = await supabase
      .from('weekly_performance')
      .upsert(performance, {
        onConflict: 'employee_id,week_ending_date'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar performance semanal
  async update(id: string, performance: WeeklyPerformanceUpdate) {
    const { data, error } = await supabase
      .from('weekly_performance')
      .update(performance)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar performance semanal
  async delete(id: string) {
    const { error } = await supabase
      .from('weekly_performance')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Buscar ranking mensal
  async getMonthlyRanking(year: number, month: number) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const { data, error } = await supabase
      .from('weekly_performance')
      .select(`
        employee_id,
        total_points,
        employee:employees (
          id,
          name,
          avatar,
          role
        )
      `)
      .gte('week_ending_date', startDate.toISOString().split('T')[0])
      .lte('week_ending_date', endDate.toISOString().split('T')[0]);

    if (error) throw error;

    // Agrupar por funcionário e somar pontos
    const ranking = data?.reduce((acc, curr) => {
      const employeeId = curr.employee_id;
      if (!acc[employeeId]) {
        acc[employeeId] = {
          employee: curr.employee,
          totalPoints: 0
        };
      }
      acc[employeeId].totalPoints += curr.total_points;
      return acc;
    }, {} as Record<string, any>);

    // Converter para array e ordenar
    return Object.values(ranking || {})
      .sort((a: any, b: any) => b.totalPoints - a.totalPoints);
  },

  // Buscar estatísticas gerais
  async getStats() {
    const { data, error } = await supabase
      .from('weekly_performance')
      .select('total_points, week_ending_date');

    if (error) throw error;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const thisMonthData = data?.filter(d => {
      const date = new Date(d.week_ending_date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }) || [];

    return {
      totalPoints: data?.reduce((sum, d) => sum + d.total_points, 0) || 0,
      thisMonthPoints: thisMonthData.reduce((sum, d) => sum + d.total_points, 0),
      averageWeeklyPoints: data?.length ? 
        (data.reduce((sum, d) => sum + d.total_points, 0) / data.length) : 0
    };
  }
};