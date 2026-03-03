import { getDatabase } from '@/lib/databaseResolver';
import { HrHeadcount, FinRevenue, ComSales, HrTurnover, HrContractEmployees, HrAbsenteeism, HrSeverance, Client, HrLaborLawsuits, PurchasesUniforms, PurchasesCleaningMaterials, PurchasesEpis, PurchasesEquipamentos, PurchasesCombustivel, PurchasesSemParar, OperationalFTs, OperationalSupervisorVisits, OperationalClientVisits, FinancialContractMargin, FinancialStationResults, HrOrganogram, Department, BscItem, BscFoundation } from '@/types/database';
import { getLast12Months } from '@/lib/months';

const supabaseGeral = getDatabase('RH');
const supabaseFinancas = getDatabase('FINANCAS');
const supabase = supabaseGeral;

const debugLog = (...args: unknown[]) => {
  if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_LOGS === 'true') console.log(...args);
};

export class DashboardService {
  // HR Headcount Services
  static async getHrHeadcount(monthsRange: string[]): Promise<HrHeadcount[]> {
    debugLog('[DashboardService] Fetching HR headcount for months:', monthsRange);
    const { data, error } = await supabaseGeral
      .from('hr_headcount')
      .select('*')
      .in('month_ym', monthsRange)
      .order('month_ym', { ascending: true });

    if (error) {
      console.error('[DashboardService] Error fetching HR headcount:', error);
      throw error;
    }
    debugLog('[DashboardService] HR headcount fetched:', data?.length || 0, 'records');
    return data || [];
  }

  static async upsertHrHeadcount(records: Omit<HrHeadcount, 'id' | 'created_at'>[]): Promise<void> {
    const { error } = await supabaseGeral
      .from('hr_headcount')
      .upsert(records, { onConflict: 'month_ym,company' });

    if (error) throw error;
  }

  // HR Turnover Services
  static async getHrTurnover(monthsRange: string[]): Promise<HrTurnover[]> {
    const { data, error } = await supabaseGeral
      .from('hr_turnover')
      .select('*')
      .in('month_ym', monthsRange)
      .order('month_ym', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async upsertHrTurnover(records: Omit<HrTurnover, 'id' | 'created_at'>[]): Promise<void> {
    const { error } = await supabaseGeral
      .from('hr_turnover')
      .upsert(records, { onConflict: 'month_ym' });

    if (error) throw error;
  }

  // Finance Revenue Services
  static async getFinRevenue(monthsRange: string[]): Promise<FinRevenue[]> {
    const { data, error } = await supabaseFinancas
      .from('fin_revenue')
      .select('*')
      .in('month_ym', monthsRange)
      .order('month_ym', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async upsertFinRevenue(records: Omit<FinRevenue, 'id' | 'created_at'>[]): Promise<void> {
    const { error } = await supabaseFinancas
      .from('fin_revenue')
      .upsert(records, { onConflict: 'company,contract_name,type,month_ym' });

    if (error) throw error;
  }

  // Commercial Sales Services
  static async getComSales(monthsRange: string[], segment?: 'publico' | 'privado'): Promise<ComSales[]> {
    let query = supabaseGeral
      .from('com_sales')
      .select('*')
      .in('month_ym', monthsRange);

    if (segment) {
      query = query.eq('segment', segment);
    }

    const { data, error } = await query.order('month_ym', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async upsertComSales(records: Omit<ComSales, 'id' | 'created_at'>[]): Promise<void> {
    const { error } = await supabaseGeral
      .from('com_sales')
      .upsert(records, { onConflict: 'month_ym,segment' });

    if (error) throw error;
  }

  // Utility method to create empty records for missing months
  static createEmptyHrRecords(months: string[]): Omit<HrHeadcount, 'id' | 'created_at'>[] {
    const records: Omit<HrHeadcount, 'id' | 'created_at'>[] = [];
    const companies: ('WWS' | 'Worldwide')[] = ['WWS', 'Worldwide'];

    months.forEach(month => {
      companies.forEach(company => {
        records.push({
          month_ym: month,
          company,
          qty: 0
        });
      });
    });

    return records;
  }

  static createEmptyTurnoverRecords(months: string[]): Omit<HrTurnover, 'id' | 'created_at'>[] {
    return months.map(month => ({
      month_ym: month,
      ativos: 0,
      admissao: 0,
      demissao: 0
    }));
  }

  static createEmptyFinRecords(months: string[]): Omit<FinRevenue, 'id' | 'created_at'>[] {
    const records: Omit<FinRevenue, 'id' | 'created_at'>[] = [];
    const companies: ('WWS' | 'Worldwide')[] = ['WWS', 'Worldwide'];

    months.forEach(month => {
      companies.forEach(company => {
        records.push({
          month_ym: month,
          company,
          contract_name: 'TOTAL',
          type: 'publico',
          budget_2025: 0,
          amount: 0
        });
      });
    });

    return records;
  }

  static createEmptyComRecords(months: string[], segment: 'publico' | 'privado'): Omit<ComSales, 'id' | 'created_at'>[] {
    return months.map(month => ({
      month_ym: month,
      segment,
      amount: 0
    }));
  }

  // HR Contract Employees Services
  static async getHrContractEmployees(monthsRange: string[]): Promise<HrContractEmployees[]> {
    const { data, error } = await supabase
      .from('hr_contract_employees')
      .select('*')
      .in('month_ym', monthsRange)
      .order('company', { ascending: true })
      .order('contract_name', { ascending: true })
      .order('month_ym', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async upsertHrContractEmployees(records: Omit<HrContractEmployees, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    const { error } = await supabase
      .from('hr_contract_employees')
      .upsert(records, { onConflict: 'company,contract_name,month_ym' });

    if (error) throw error;
  }

  static async deleteHrContractEmployee(id: string): Promise<void> {
    const { error } = await supabase
      .from('hr_contract_employees')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // HR Absenteeism Services
  static async getHrAbsenteeism(monthsRange: string[]): Promise<HrAbsenteeism[]> {
    const { data, error } = await supabase
      .from('hr_absenteeism')
      .select('*')
      .in('month_ym', monthsRange)
      .order('month_ym', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async upsertHrAbsenteeism(records: Omit<HrAbsenteeism, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    const { error } = await supabase
      .from('hr_absenteeism')
      .upsert(records, { onConflict: 'month_ym' });

    if (error) throw error;
  }

  // HR Severance Services
  static async getHrSeverance(monthsRange: string[]): Promise<HrSeverance[]> {
    const { data, error } = await supabase
      .from('hr_severance')
      .select('*')
      .in('month_ym', monthsRange)
      .order('company', { ascending: true })
      .order('contract_name', { ascending: true })
      .order('month_ym', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async upsertHrSeverance(records: Omit<HrSeverance, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    const { error } = await supabase
      .from('hr_severance')
      .upsert(records, { onConflict: 'company,contract_name,month_ym' });

    if (error) throw error;
  }

  static async deleteHrSeverance(rows: { company: string; contract_name: string }[]): Promise<void> {
    const months = getLast12Months();

    for (const row of rows) {
      for (const month of months) {
        const { error } = await supabase
          .from('hr_severance')
          .delete()
          .eq('company', row.company)
          .eq('contract_name', row.contract_name)
          .eq('month_ym', month.monthYm);

        if (error) throw error;
      }
    }
  }

  static async getHrSeveranceContracts(): Promise<string[]> {
    const { data, error } = await supabase
      .from('hr_severance')
      .select('contract_name')
      .order('contract_name');

    if (error) throw error;

    const uniqueContracts = [...new Set(data?.map(d => d.contract_name) || [])];
    return uniqueContracts;
  }

  // Clients Services
  static async getClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async createClient(name: string, company: 'WWS' | 'Worldwide' | null = null, tipo: 'Público' | 'Privado' | null = null, cidade: string | null = null): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .insert([{ name, company, tipo, cidade }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateClient(id: string, name: string, company: 'WWS' | 'Worldwide' | null = null, tipo: 'Público' | 'Privado' | null = null, cidade: string | null = null): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .update({ name, company, tipo, cidade, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  static async deleteClient(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Labor Lawsuits Services
  static async getHrLaborLawsuits(monthsRange: string[]): Promise<HrLaborLawsuits[]> {
    const { data, error } = await supabase
      .from('hr_labor_lawsuits')
      .select('*')
      .in('month_ym', monthsRange)
      .order('company', { ascending: true })
      .order('contract_name', { ascending: true })
      .order('month_ym', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async upsertHrLaborLawsuits(records: Omit<HrLaborLawsuits, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    const { error } = await supabase
      .from('hr_labor_lawsuits')
      .upsert(records, { onConflict: 'company,contract_name,month_ym' });

    if (error) throw error;
  }

  static async getHrLaborLawsuitsContracts(): Promise<string[]> {
    const { data, error } = await supabase
      .from('hr_labor_lawsuits')
      .select('contract_name')
      .order('contract_name');

    if (error) throw error;

    const uniqueContracts = [...new Set(data?.map(d => d.contract_name) || [])];
    return uniqueContracts;
  }

  // Purchases Uniforms Services
  static async getPurchasesUniforms(monthsRange: string[]): Promise<PurchasesUniforms[]> {
    const { data, error } = await supabase
      .from('purchases_uniforms')
      .select('*')
      .in('month_ym', monthsRange)
      .order('company', { ascending: true })
      .order('contract_name', { ascending: true })
      .order('month_ym', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async upsertPurchasesUniforms(records: Omit<PurchasesUniforms, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    const { error } = await supabase
      .from('purchases_uniforms')
      .upsert(records, { onConflict: 'company,contract_name,month_ym' });

    if (error) throw error;
  }

  static async deletePurchasesUniforms(rows: { company: string; contract_name: string }[]): Promise<void> {
    const months = getLast12Months();

    for (const row of rows) {
      for (const month of months) {
        const { error } = await supabase
          .from('purchases_uniforms')
          .delete()
          .eq('company', row.company)
          .eq('contract_name', row.contract_name)
          .eq('month_ym', month.monthYm);

        if (error) throw error;
      }
    }
  }

  // Purchases Cleaning Materials Services
  static async getPurchasesCleaningMaterials(monthsRange: string[]): Promise<PurchasesCleaningMaterials[]> {
    const { data, error } = await supabase
      .from('purchases_cleaning_materials')
      .select('*')
      .in('month_ym', monthsRange)
      .order('company', { ascending: true })
      .order('contract_name', { ascending: true })
      .order('month_ym', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async upsertPurchasesCleaningMaterials(records: Omit<PurchasesCleaningMaterials, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    const { error } = await supabase
      .from('purchases_cleaning_materials')
      .upsert(records, { onConflict: 'company,contract_name,month_ym' });

    if (error) throw error;
  }

  static async deletePurchasesCleaningMaterials(rows: { company: string; contract_name: string }[]): Promise<void> {
    const months = getLast12Months();

    for (const row of rows) {
      for (const month of months) {
        const { error } = await supabase
          .from('purchases_cleaning_materials')
          .delete()
          .eq('company', row.company)
          .eq('contract_name', row.contract_name)
          .eq('month_ym', month.monthYm);

        if (error) throw error;
      }
    }
  }

  // Purchases EPIs Services
  static async getPurchasesEpis(monthsRange: string[]): Promise<PurchasesEpis[]> {
    const { data, error } = await supabase
      .from('purchases_epis')
      .select('*')
      .in('month_ym', monthsRange)
      .order('company', { ascending: true })
      .order('contract_name', { ascending: true })
      .order('month_ym', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async upsertPurchasesEpis(records: Omit<PurchasesEpis, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    const { error } = await supabase
      .from('purchases_epis')
      .upsert(records, { onConflict: 'company,contract_name,month_ym' });

    if (error) throw error;
  }

  static async deletePurchasesEpis(rows: { company: string; contract_name: string }[]): Promise<void> {
    const months = getLast12Months();

    for (const row of rows) {
      for (const month of months) {
        const { error } = await supabase
          .from('purchases_epis')
          .delete()
          .eq('company', row.company)
          .eq('contract_name', row.contract_name)
          .eq('month_ym', month.monthYm);

        if (error) throw error;
      }
    }
  }

  // Purchases Equipamentos Services
  static async getPurchasesEquipamentos(monthsRange: string[]): Promise<PurchasesEquipamentos[]> {
    const { data, error } = await supabase
      .from('purchases_equipamentos')
      .select('*')
      .in('month_ym', monthsRange)
      .order('company', { ascending: true })
      .order('contract_name', { ascending: true })
      .order('month_ym', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async upsertPurchasesEquipamentos(records: Omit<PurchasesEquipamentos, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    const { error } = await supabase
      .from('purchases_equipamentos')
      .upsert(records, { onConflict: 'company,contract_name,month_ym' });

    if (error) throw error;
  }

  static async deletePurchasesEquipamentos(rows: { company: string; contract_name: string }[]): Promise<void> {
    const months = getLast12Months();

    for (const row of rows) {
      for (const month of months) {
        const { error } = await supabase
          .from('purchases_equipamentos')
          .delete()
          .eq('company', row.company)
          .eq('contract_name', row.contract_name)
          .eq('month_ym', month.monthYm);

        if (error) throw error;
      }
    }
  }

  // Purchases Combustível Services
  static async getPurchasesCombustivel(monthsRange: string[]): Promise<PurchasesCombustivel[]> {
    const { data, error } = await supabase
      .from('purchases_combustivel')
      .select('*')
      .in('month_ym', monthsRange)
      .order('company', { ascending: true })
      .order('department', { ascending: true })
      .order('month_ym', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async upsertPurchasesCombustivel(records: Omit<PurchasesCombustivel, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    const { error } = await supabase
      .from('purchases_combustivel')
      .upsert(records, { onConflict: 'company,department,month_ym' });

    if (error) throw error;
  }

  static async deletePurchasesCombustivel(rows: { company: string; department: string }[]): Promise<void> {
    const months = getLast12Months();

    for (const row of rows) {
      for (const month of months) {
        const { error } = await supabase
          .from('purchases_combustivel')
          .delete()
          .eq('company', row.company)
          .eq('department', row.department)
          .eq('month_ym', month.monthYm);

        if (error) throw error;
      }
    }
  }

  // Purchases Sem Parar Services
  static async getPurchasesSemParar(monthsRange: string[]): Promise<PurchasesSemParar[]> {
    const { data, error } = await supabase
      .from('purchases_sem_parar')
      .select('*')
      .in('month_ym', monthsRange)
      .order('company', { ascending: true })
      .order('department', { ascending: true })
      .order('month_ym', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async upsertPurchasesSemParar(records: Omit<PurchasesSemParar, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    const { error } = await supabase
      .from('purchases_sem_parar')
      .upsert(records, { onConflict: 'company,department,month_ym' });

    if (error) throw error;
  }

  static async deletePurchasesSemParar(rows: { company: string; department: string }[]): Promise<void> {
    const months = getLast12Months();

    for (const row of rows) {
      for (const month of months) {
        const { error } = await supabase
          .from('purchases_sem_parar')
          .delete()
          .eq('company', row.company)
          .eq('department', row.department)
          .eq('month_ym', month.monthYm);

        if (error) throw error;
      }
    }
  }

  // Operational FTs Services
  static async getOperationalFTs(monthsRange: string[]): Promise<OperationalFTs[]> {
    const { data, error } = await supabase
      .from('operational_fts')
      .select('*')
      .in('month_ym', monthsRange)
      .order('company', { ascending: true })
      .order('contract_name', { ascending: true })
      .order('month_ym', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async upsertOperationalFTs(records: Omit<OperationalFTs, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    const { error } = await supabase
      .from('operational_fts')
      .upsert(records, { onConflict: 'company,contract_name,month_ym' });

    if (error) throw error;
  }

  static async deleteOperationalFTs(rows: { company: string; contract_name: string }[]): Promise<void> {
    const months = getLast12Months();

    for (const row of rows) {
      for (const month of months) {
        const { error } = await supabase
          .from('operational_fts')
          .delete()
          .eq('company', row.company)
          .eq('contract_name', row.contract_name)
          .eq('month_ym', month.monthYm);

        if (error) throw error;
      }
    }
  }

  static async getOperationalSupervisorVisits(monthsRange: string[]): Promise<OperationalSupervisorVisits[]> {
    const { data, error } = await supabase
      .from('operational_supervisor_visits')
      .select('*')
      .in('month_ym', monthsRange)
      .order('company', { ascending: true })
      .order('supervisor_name', { ascending: true })
      .order('month_ym', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async upsertOperationalSupervisorVisits(records: Omit<OperationalSupervisorVisits, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    const { error } = await supabase
      .from('operational_supervisor_visits')
      .upsert(records, { onConflict: 'company,supervisor_name,month_ym' });

    if (error) throw error;
  }

  static async deleteOperationalSupervisorVisits(rows: { company: string; supervisor_name: string }[]): Promise<void> {
    const months = getLast12Months();

    for (const row of rows) {
      for (const month of months) {
        const { error } = await supabase
          .from('operational_supervisor_visits')
          .delete()
          .eq('company', row.company)
          .eq('supervisor_name', row.supervisor_name)
          .eq('month_ym', month.monthYm);

        if (error) throw error;
      }
    }
  }

  static async getOperationalClientVisits(monthsRange: string[]): Promise<OperationalClientVisits[]> {
    const { data, error } = await supabase
      .from('operational_client_visits')
      .select('*')
      .in('month_ym', monthsRange)
      .order('company', { ascending: true })
      .order('contract_name', { ascending: true })
      .order('month_ym', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async upsertOperationalClientVisits(records: Omit<OperationalClientVisits, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    const { error } = await supabase
      .from('operational_client_visits')
      .upsert(records, { onConflict: 'company,contract_name,month_ym' });

    if (error) throw error;
  }

  static async deleteOperationalClientVisits(rows: { company: string; contract_name: string }[]): Promise<void> {
    const months = getLast12Months();

    for (const row of rows) {
      for (const month of months) {
        const { error } = await supabase
          .from('operational_client_visits')
          .delete()
          .eq('company', row.company)
          .eq('contract_name', row.contract_name)
          .eq('month_ym', month.monthYm);

        if (error) throw error;
      }
    }
  }

  static async getFinancialContractMargin(monthsRange: string[]): Promise<FinancialContractMargin[]> {
    const { data, error } = await supabaseFinancas
      .from('financial_contract_margin')
      .select('*')
      .in('month_ym', monthsRange)
      .order('company', { ascending: true })
      .order('contract_name', { ascending: true })
      .order('month_ym', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async upsertFinancialContractMargin(records: Omit<FinancialContractMargin, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    const { error } = await supabaseFinancas
      .from('financial_contract_margin')
      .upsert(records, { onConflict: 'company,contract_name,month_ym' });

    if (error) throw error;
  }

  static async getFinancialStationResults(monthsRange: string[]): Promise<FinancialStationResults[]> {
    const { data, error } = await supabaseFinancas
      .from('financial_station_results')
      .select('*')
      .in('month_ym', monthsRange)
      .order('contract_name', { ascending: true })
      .order('month_ym', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async upsertFinancialStationResults(records: Omit<FinancialStationResults, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    const { error } = await supabaseFinancas
      .from('financial_station_results')
      .upsert(records, { onConflict: 'contract_name,month_ym' })
      ;

    if (error) {
      console.error('Upsert error:', error);
      throw error;
    }
  }

  static async deleteFinancialStationResults(rows: { contract_name: string }[]): Promise<void> {
    const months = getLast12Months();

    for (const row of rows) {
      for (const month of months) {
        const { error } = await supabaseFinancas
          .from('financial_station_results')
          .delete()
          .eq('contract_name', row.contract_name)
          .eq('month_ym', month.monthYm);

        if (error) throw error;
      }
    }
  }

  static async syncFinancialStationResults(
    currentData: Omit<FinancialStationResults, 'id' | 'created_at' | 'updated_at'>[],
    existingData: FinancialStationResults[]
  ): Promise<void> {
    const currentKeys = new Set(
      currentData.map(r => `${r.contract_name}|${r.month_ym}`)
    );

    const toDelete = existingData.filter(
      r => !currentKeys.has(`${r.contract_name}|${r.month_ym}`)
    );

    if (toDelete.length > 0) {
      const deletePromises = toDelete.map(record =>
        supabaseFinancas
          .from('financial_station_results')
          .delete()
          .eq('contract_name', record.contract_name)
          .eq('month_ym', record.month_ym)
      );

      const results = await Promise.all(deletePromises);
      const firstError = results.find(r => r.error)?.error;

      if (firstError) {
        console.error('Delete errors:', firstError);
        throw firstError;
      }
    }

    if (currentData.length > 0) {
      await DashboardService.upsertFinancialStationResults(currentData);
    }
  }

  static async getFinancialAdministrativeExpenses(monthsRange: string[]) {
    const { data, error } = await supabaseFinancas
      .from('fin_administrative_expenses')
      .select('*')
      .in('month_ym', monthsRange)
      .order('company', { ascending: true })
      .order('department', { ascending: true })
      .order('month_ym', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async upsertFinancialAdministrativeExpenses(records: { company: string; department: string; month_ym: string; amount: number }[]): Promise<void> {
    const { error } = await supabaseFinancas
      .from('fin_administrative_expenses')
      .upsert(records, { onConflict: 'company,department,month_ym' });

    if (error) throw error;
  }

  static async getAvailableDepartments(): Promise<string[]> {
    const { data, error } = await supabaseFinancas
      .from('fin_administrative_expenses')
      .select('department')
      .order('department');

    if (error) throw error;

    const uniqueDepartments = [...new Set(data?.map(d => d.department) || [])];
    return uniqueDepartments;
  }

  static async getAllAvailableMonths(tableName: string): Promise<string[]> {
    const isFinancialTable = tableName.startsWith('financial_') || tableName.startsWith('fin_');
    const db = isFinancialTable ? supabaseFinancas : supabaseGeral;

    const { data, error } = await db
      .from(tableName)
      .select('month_ym')
      .order('month_ym', { ascending: true });

    if (error) throw error;

    const uniqueMonths = [...new Set(data?.map(d => d.month_ym) || [])];
    return uniqueMonths;
  }

  static async getHrOrganogram(): Promise<HrOrganogram[]> {
    const { data, error } = await supabase
      .from('hr_organogram')
      .select('*')
      .order('level', { ascending: true })
      .order('employee_name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async upsertHrOrganogram(record: Omit<HrOrganogram, 'created_at' | 'updated_at'>): Promise<HrOrganogram> {
    const { data, error } = await supabase
      .from('hr_organogram')
      .upsert(record, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteHrOrganogram(id: string): Promise<void> {
    const { error } = await supabase
      .from('hr_organogram')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getDepartments(): Promise<Department[]> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('level', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async upsertDepartment(record: Omit<Department, 'created_at' | 'updated_at'>): Promise<Department> {
    const { data, error } = await supabase
      .from('departments')
      .upsert(record, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteDepartment(id: string): Promise<void> {
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getBscItems(): Promise<BscItem[]> {
    debugLog('[DashboardService] Fetching BSC items...');
    const { data, error } = await supabase
      .from('bsc_items')
      .select('*')
      .order('level', { ascending: true })
      .order('order_position', { ascending: true });

    if (error) {
      console.error('[DashboardService] Error fetching BSC items:', error);
      throw error;
    }
    debugLog('[DashboardService] BSC items fetched:', data?.length || 0, 'records');
    return data || [];
  }

  static async upsertBscItem(record: Omit<BscItem, 'created_at' | 'updated_at'>): Promise<BscItem> {
    const { data, error } = await supabase
      .from('bsc_items')
      .upsert(record, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteBscItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('bsc_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getBscFoundation(): Promise<BscFoundation[]> {
    debugLog('[DashboardService] Fetching BSC foundation...');
    const { data, error } = await supabase
      .from('bsc_foundation')
      .select('*')
      .order('order_position', { ascending: true });

    if (error) {
      console.error('[DashboardService] Error fetching BSC foundation:', error);
      throw error;
    }
    debugLog('[DashboardService] BSC foundation fetched:', data?.length || 0, 'records');
    return data || [];
  }

  static async updateBscFoundation(id: string, content: string): Promise<void> {
    const { error } = await supabase
      .from('bsc_foundation')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }
}