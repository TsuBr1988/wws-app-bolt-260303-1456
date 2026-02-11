import { supabase } from '../lib/supabase';

export interface EncargoOverride {
  id?: string;
  budget_id: string;
  grupo_code: string;
  encargo_code: string;
  encargo_name: string;
  custom_rate: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export const budgetEncargosService = {
  async getOverrides(budgetId: string): Promise<EncargoOverride[]> {
    try {
      const { data, error } = await supabase
        .from('budget_encargos_overrides')
        .select('*')
        .eq('budget_id', budgetId);

      if (error) {
        console.error('Erro ao buscar encargos customizados:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar encargos customizados:', error);
      return [];
    }
  },

  async saveOverride(
    budgetId: string,
    grupoCode: string,
    encargoCode: string,
    encargoName: string,
    customRate: number,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('budget_encargos_overrides')
        .upsert({
          budget_id: budgetId,
          grupo_code: grupoCode,
          encargo_code: encargoCode,
          encargo_name: encargoName,
          custom_rate: customRate,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'budget_id,encargo_code'
        });

      if (error) {
        console.error('Erro ao salvar encargo customizado:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao salvar encargo customizado:', error);
      return { success: false, error: error.message };
    }
  },

  async removeOverride(
    budgetId: string,
    encargoCode: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('budget_encargos_overrides')
        .delete()
        .eq('budget_id', budgetId)
        .eq('encargo_code', encargoCode);

      if (error) {
        console.error('Erro ao remover encargo customizado:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao remover encargo customizado:', error);
      return { success: false, error: error.message };
    }
  },

  async countOverrides(budgetId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('budget_encargos_overrides')
        .select('id', { count: 'exact', head: true })
        .eq('budget_id', budgetId);

      if (error) {
        console.error('Erro ao contar encargos customizados:', error);
        return 0;
      }

      return (data as any)?.length || 0;
    } catch (error) {
      console.error('Erro ao contar encargos customizados:', error);
      return 0;
    }
  },

  async removeAllOverrides(budgetId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('budget_encargos_overrides')
        .delete()
        .eq('budget_id', budgetId);

      if (error) {
        console.error('Erro ao remover todos os encargos customizados:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao remover todos os encargos customizados:', error);
      return { success: false, error: error.message };
    }
  },

  async getEncargosWithOverrides(budgetId: string, gruposEncargos: any[]): Promise<any[]> {
    try {
      const overrides = await this.getOverrides(budgetId);
      const overridesMap = new Map(
        overrides.map(o => [o.encargo_code, o])
      );

      return gruposEncargos.map(grupo => ({
        ...grupo,
        i: grupo.i.map((item: any) => {
          const override = overridesMap.get(item.d);
          return {
            ...item,
            p: override ? override.custom_rate : item.p,
            isCustomized: !!override,
            override: override || null,
          };
        }),
      }));
    } catch (error) {
      console.error('Erro ao obter encargos com overrides:', error);
      return gruposEncargos;
    }
  },
};
