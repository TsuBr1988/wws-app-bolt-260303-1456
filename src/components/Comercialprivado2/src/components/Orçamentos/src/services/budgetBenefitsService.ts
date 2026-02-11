import { supabase } from '../lib/supabase';

export interface BenefitOverride {
  id?: string;
  budget_id: string;
  function_id: string;
  benefit_code: string;
  custom_value: number;
  custom_formula?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export const budgetBenefitsService = {
  async getOverride(
    budgetId: string,
    functionId: string,
    benefitCode: string
  ): Promise<BenefitOverride | null> {
    try {
      const { data, error } = await supabase
        .from('budget_function_benefit_overrides')
        .select('*')
        .eq('budget_id', budgetId)
        .eq('function_id', functionId)
        .eq('benefit_code', benefitCode)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar override:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar override:', error);
      return null;
    }
  },

  async getOverrides(budgetId: string, functionId: string): Promise<BenefitOverride[]> {
    try {
      const { data, error } = await supabase
        .from('budget_function_benefit_overrides')
        .select('*')
        .eq('budget_id', budgetId)
        .eq('function_id', functionId)
        .order('benefit_code');

      if (error) {
        console.error('Erro ao buscar overrides:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar overrides:', error);
      return [];
    }
  },

  async saveOverride(
    budgetId: string,
    functionId: string,
    benefitCode: string,
    value: number,
    notes?: string,
    formula?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const existing = await this.getOverride(budgetId, functionId, benefitCode);

      if (existing) {
        const { error } = await supabase
          .from('budget_function_benefit_overrides')
          .update({
            custom_value: value,
            custom_formula: formula,
            notes: notes,
          })
          .eq('id', existing.id);

        if (error) {
          console.error('Erro ao atualizar override:', error);
          return { success: false, error: error.message };
        }
      } else {
        const { error } = await supabase
          .from('budget_function_benefit_overrides')
          .insert({
            budget_id: budgetId,
            function_id: functionId,
            benefit_code: benefitCode,
            custom_value: value,
            custom_formula: formula,
            notes: notes,
          });

        if (error) {
          console.error('Erro ao criar override:', error);
          return { success: false, error: error.message };
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao salvar override:', error);
      return { success: false, error: error.message };
    }
  },

  async removeOverride(
    budgetId: string,
    functionId: string,
    benefitCode: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('budget_function_benefit_overrides')
        .delete()
        .eq('budget_id', budgetId)
        .eq('function_id', functionId)
        .eq('benefit_code', benefitCode);

      if (error) {
        console.error('Erro ao remover override:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao remover override:', error);
      return { success: false, error: error.message };
    }
  },

  async countOverrides(budgetId: string, functionId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('budget_function_benefit_overrides')
        .select('*', { count: 'exact', head: true })
        .eq('budget_id', budgetId)
        .eq('function_id', functionId);

      if (error) {
        console.error('Erro ao contar overrides:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Erro ao contar overrides:', error);
      return 0;
    }
  },

  async getAllBudgetOverrides(budgetId: string): Promise<BenefitOverride[]> {
    try {
      const { data, error } = await supabase
        .from('budget_function_benefit_overrides')
        .select('*')
        .eq('budget_id', budgetId)
        .order('function_id')
        .order('benefit_code');

      if (error) {
        console.error('Erro ao buscar overrides do orçamento:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar overrides do orçamento:', error);
      return [];
    }
  },
};
