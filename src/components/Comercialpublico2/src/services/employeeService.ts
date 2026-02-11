import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Employee = Database['public']['Tables']['employees']['Row'];
type EmployeeInsert = Database['public']['Tables']['employees']['Insert'];
type EmployeeUpdate = Database['public']['Tables']['employees']['Update'];

export const employeeService = {
  // Buscar todos os funcionários com badges
  async getAll() {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        employee_badges (
          badge_id,
          earned_at,
          badges (
            id,
            name,
            icon,
            color,
            description
          )
        )
      `)
      .order('name');

    if (error) throw error;
    
    // Transformar dados para o formato esperado pela aplicação
    return data?.map(employee => ({
      ...employee,
      badges: employee.employee_badges?.map(eb => eb.badges).filter(Boolean) || []
    })) || [];
  },

  // Buscar funcionário por ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        employee_badges (
          badge_id,
          earned_at,
          badges (
            id,
            name,
            icon,
            color,
            description
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    
    return {
      ...data,
      badges: data.employee_badges?.map(eb => eb.badges).filter(Boolean) || []
    };
  },

  // Criar novo funcionário
  async create(employee: EmployeeInsert) {
    const { data, error } = await supabase
      .from('employees')
      .insert(employee)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar funcionário
  async update(id: string, employee: EmployeeUpdate) {
    const { data, error } = await supabase
      .from('employees')
      .update(employee)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar funcionário
  async delete(id: string) {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Adicionar badge a um funcionário
  async addBadge(employeeId: string, badgeId: string) {
    const { data, error } = await supabase
      .from('employee_badges')
      .insert({
        employee_id: employeeId,
        badge_id: badgeId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Remover badge de um funcionário
  async removeBadge(employeeId: string, badgeId: string) {
    const { error } = await supabase
      .from('employee_badges')
      .delete()
      .eq('employee_id', employeeId)
      .eq('badge_id', badgeId);

    if (error) throw error;
  },

  // Atualizar pontos do funcionário
  async updatePoints(id: string, points: number) {
    const { data, error } = await supabase
      .from('employees')
      .update({ points })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};