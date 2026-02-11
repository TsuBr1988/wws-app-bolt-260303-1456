import { supabase } from '../lib/supabase';
import { Department } from '../contexts/DepartmentContext';

export interface MonthlyGoal {
  id?: string;
  year: number;
  month: number;
  monthName: string;
  targetValue: number;
  createdAt?: string;
  updatedAt?: string;
}

export const monthlyGoalsService = {
  // Buscar metas de um ano específico
  async getMonthlyGoals(year: number, department: Department): Promise<MonthlyGoal[]> {
    try {
      console.log(`🎯 Buscando metas mensais para ${department} - ${year}`);
      
      try {
        // Verificar se supabase está configurado antes de fazer request
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
          throw new Error('❌ Supabase não configurado: verifique variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env');
        }
        
        const { data, error } = await supabase
          .from('monthly_goals')
          .select('*')
          .eq('year', year)
          .eq('department', department)
          .order('month', { ascending: true });

        if (error) {
          console.error('❌ Erro do Supabase ao buscar metas mensais:', error);
          
          // Verificar tipos específicos de erro do Supabase
          if (error.message?.includes('JWT') || error.message?.includes('auth')) {
            throw new Error(`❌ Erro de autenticação: Verifique se VITE_SUPABASE_ANON_KEY está correto no .env`);
          } else if (error.message?.includes('not found') || error.message?.includes('table')) {
            throw new Error(`❌ Erro de schema: Tabela monthly_goals não encontrada - execute as migrações do banco`);
          } else {
            throw new Error(`❌ Erro do banco de dados: ${error.message}`);
          }
        }

        console.log(`📊 Encontradas ${data?.length || 0} metas para ${year}`);

        // Se não houver metas, criar padrão
        if (!data || data.length === 0) {
          console.log('📝 Criando metas padrão para', department, year);
          return await this.createDefaultGoals(year, department);
        }

        // Converter dados do banco para o formato da aplicação
        const goals: MonthlyGoal[] = data.map(goal => ({
          id: goal.id,
          year: goal.year,
          month: goal.month,
          monthName: new Date(goal.year, goal.month - 1, 1).toLocaleDateString('pt-BR', { month: 'long' }),
          targetValue: Number(goal.target_value),
          createdAt: goal.created_at,
          updatedAt: goal.updated_at
        }));

        // Garantir que temos todos os 12 meses
        const completeGoals = this.ensureAllMonths(goals, year);
        
        return completeGoals;
        
      } catch (networkError) {
        console.error('🌐 Erro de rede ao conectar com Supabase:', networkError.message);
        
        // Detectar diferentes tipos de erro de rede
        if (networkError.message?.includes('Failed to fetch')) {
          throw new Error('❌ Falha ao conectar: Verifique se 1) arquivo .env existe 2) VITE_SUPABASE_URL está correto 3) internet está conectada');
        } else if (networkError.message?.includes('NetworkError')) {
          throw new Error('❌ Erro de rede: Verifique sua conexão com a internet');
        } else if (networkError.message?.includes('CORS')) {
          throw new Error('❌ Erro de CORS: Verifique se o domínio está autorizado no Supabase');
        } else if (networkError.name === 'TypeError' && networkError.message?.includes('fetch')) {
          throw new Error('❌ Erro de configuração: Verifique se VITE_SUPABASE_URL no .env está correto');
        }
        
        throw networkError;
      }
    } catch (error) {
      console.error('❌ Erro no serviço de metas mensais:', error);
      throw error;
    }
  },

  // Criar metas padrão para um ano
  async createDefaultGoals(year: number, department: Department): Promise<MonthlyGoal[]> {
    const defaultGoals = Array.from({ length: 12 }, (_, index) => ({
      year,
      month: index + 1,
      target_value: department === 'Petrobras' ? 500000 : 300000 // R$ 500k para Petrobras, R$ 300k para Comercial
    }));

    const { data, error } = await supabase
      .from('monthly_goals')
      .insert(defaultGoals)
      .select();

    if (error) {
      console.error('Erro ao criar metas padrão:', error);
      throw error;
    }

    return data?.map(goal => ({
      id: goal.id,
      year: goal.year,
      month: goal.month,
      monthName: new Date(goal.year, goal.month - 1, 1).toLocaleDateString('pt-BR', { month: 'long' }),
      targetValue: Number(goal.target_value),
      createdAt: goal.created_at,
      updatedAt: goal.updated_at
    })) || [];
  },

  // Garantir que temos todos os 12 meses
  ensureAllMonths(existingGoals: MonthlyGoal[], year: number): MonthlyGoal[] {
    const allMonths = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const existing = existingGoals.find(g => g.month === month);
      
      if (existing) {
        return existing;
      }

      return {
        year,
        month,
        monthName: new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long' }),
        targetValue: 300000 // Padrão R$ 300k
      };
    });

    return allMonths;
  },

  // Atualizar metas mensais
  async updateMonthlyGoals(goals: MonthlyGoal[], department: Department): Promise<void> {
    try {
      console.log('💾 Salvando metas mensais para', department, ':', goals);

      // Preparar dados para upsert
      const upsertData = goals.map(goal => ({
        year: goal.year,
        month: goal.month,
        target_value: goal.targetValue,
        department: department
      }));

      const { error } = await supabase
        .from('monthly_goals')
        .upsert(upsertData, {
          onConflict: 'year,month,department'
        });

      if (error) {
        console.error('Erro ao salvar metas mensais:', error);
        throw error;
      }

      console.log('✅ Metas mensais salvas com sucesso');
    } catch (error) {
      console.error('Erro no serviço de atualização de metas:', error);
      throw error;
    }
  },

  // Buscar meta de um mês específico
  async getMonthGoal(month: number, year: number, department: Department): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('monthly_goals')
        .select('target_value')
        .eq('year', year)
        .eq('month', month)
        .eq('department', department)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Não encontrado, retornar padrão
          return department === 'Petrobras' ? 500000 : 300000;
        }
        throw error;
      }

      return Number(data.target_value);
    } catch (error) {
      console.error('Erro ao buscar meta do mês:', error);
      return department === 'Petrobras' ? 500000 : 300000; // Fallback baseado no departamento
    }
  },

  // Buscar meta anual total
  async getAnnualGoal(year: number, department: Department): Promise<number> {
    try {
      const goals = await this.getMonthlyGoals(year, department);
      return goals.reduce((sum, goal) => sum + goal.targetValue, 0);
    } catch (error) {
      console.error('Erro ao buscar meta anual:', error);
      return department === 'Petrobras' ? 6000000 : 3600000; // Fallback baseado no departamento
    }
  }
};