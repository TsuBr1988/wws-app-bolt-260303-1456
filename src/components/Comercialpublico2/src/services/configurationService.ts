import { supabase } from '../lib/supabase';

export interface MonthlyGoal {
  month: number;
  monthName: string;
  targetValue: number;
}

export interface CommissionTier {
  id: string;
  percentage: number;
  minValue: number;
  maxValue: number | null;
  label: string;
}

export interface WeeklyMetric {
  id: string;
  name: string;
  points: number;
  role: 'Closer' | 'SDR' | 'Both';
}

export const configurationService = {
  // Monthly Goals
  async getMonthlyGoals(year?: number): Promise<MonthlyGoal[]> {
    const targetYear = year || new Date().getFullYear();
    const configType = `monthly_goals_${targetYear}`;
    
    const { data, error } = await supabase
      .from('system_configurations')
      .select('config_data')
      .eq('config_type', configType)
      .maybeSingle();

    if (error) {
      return [];
    }

    return data?.config_data || [];
  },

  // Buscar meta de um mês específico
  async getMonthlyGoal(month: number, year: number): Promise<number> {
    const goals = await this.getMonthlyGoals(year);
    const monthGoal = goals.find(g => g.month === month);
    return monthGoal?.targetValue || 300000; // Default R$ 300k
  },

  // Buscar meta anual total
  async getAnnualGoal(year: number): Promise<number> {
    const goals = await this.getMonthlyGoals(year);
    return goals.reduce((sum, goal) => sum + goal.targetValue, 0);
  },

  async updateMonthlyGoals(goals: MonthlyGoal[], year?: number): Promise<void> {
    const targetYear = year || new Date().getFullYear();
    const configType = `monthly_goals_${targetYear}`;
    
    const { error } = await supabase
      .from('system_configurations')
      .upsert({
        config_type: configType,
        config_data: goals
      }, {
        onConflict: 'config_type'
      });

    if (error) {
      throw error;
    }
  },

  // Commission Tiers
  async getCommissionTiers(): Promise<CommissionTier[]> {
    const { data, error } = await supabase
      .from('system_configurations')
      .select('config_data')
      .eq('config_type', 'commission_tiers')
      .maybeSingle();

    if (error) {
      return [];
    }

    return data?.config_data || [];
  },

  async updateCommissionTiers(tiers: CommissionTier[]): Promise<void> {
    const { error } = await supabase
      .from('system_configurations')
      .upsert({
        config_type: 'commission_tiers',
        config_data: tiers
      }, {
        onConflict: 'config_type'
      });

    if (error) {
      throw error;
    }
  },

  // Weekly Metrics
  async getWeeklyMetrics(): Promise<WeeklyMetric[]> {
    const { data, error } = await supabase
      .from('system_configurations')
      .select('config_data')
      .eq('config_type', 'weekly_metrics')
      .maybeSingle();

    if (error) {
      return [];
    }

    return data?.config_data || [];
  },

  async updateWeeklyMetrics(metrics: WeeklyMetric[]): Promise<void> {
    const { error } = await supabase
      .from('system_configurations')
      .upsert({
        config_type: 'weekly_metrics',
        config_data: metrics
      }, {
        onConflict: 'config_type'
      });

    if (error) {
      throw error;
    }
  }
};