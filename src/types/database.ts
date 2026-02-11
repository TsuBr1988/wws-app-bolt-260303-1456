export interface HrHeadcount {
  id: string;
  month_ym: string;
  company: 'WWS' | 'Worldwide';
  qty: number;
  created_at: string;
}

export interface FinRevenue {
  id: string;
  month_ym: string;
  company: 'WWS' | 'Worldwide';
  contract_name: string;
  type: 'publico' | 'privado';
  budget_2025: number;
  amount: number;
  created_at: string;
}

export interface FinRevenueTableRow {
  id?: string;
  company: string;
  contract_name: string;
  type: string;
  budget_2025: number;
  [key: string]: string | number | undefined;
}

export interface ComSales {
  id: string;
  month_ym: string;
  segment: 'publico' | 'privado';
  amount: number;
  created_at: string;
}

export interface HrTurnover {
  id: string;
  month_ym: string;
  ativos: number;
  admissao: number;
  demissao: number;
  created_at: string;
}

export interface HrContractEmployees {
  id: string;
  company: 'WWS' | 'Worldwide';
  contract_name: string;
  contract_qty: number;
  month_ym: string;
  fixos: number;
  ferias_concedidas: number;
  feiristas: number;
  afastados: number;
  created_at: string;
  updated_at: string;
}

export interface ChartDataPoint {
  monthLabel: string;
  [key: string]: string | number;
}

export interface EditableRowData {
  monthYm: string;
  monthLabel: string;
  [key: string]: string | number;
}

export interface ContractTableRow {
  id?: string;
  company: string;
  contract_name: string;
  contract_qty: number;
  isManual?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export interface HrAbsenteeism {
  id: string;
  month_ym: string;
  justified_absence: number;
  unjustified_absence: number;
  expected_workload: number;
  created_at: string;
  updated_at: string;
}

export interface HrSeverance {
  id: string;
  company: 'WWS' | 'Worldwide';
  contract_name: string;
  month_ym: string;
  severance_amount: number;
  severance_qty: number;
  created_at: string;
  updated_at: string;
}

export interface SeveranceTableRow {
  id?: string;
  company: string;
  contract_name: string;
  tipo?: string;
  cidade?: string;
  [key: string]: string | number | undefined;
}

export interface Client {
  id: string;
  name: string;
  company: 'WWS' | 'Worldwide' | null;
  tipo: 'Público' | 'Privado' | null;
  cidade: string | null;
  created_at: string;
  updated_at: string;
}

export interface HrLaborLawsuits {
  id: string;
  company: 'WWS' | 'Worldwide';
  contract_name: string;
  month_ym: string;
  lawsuits_qty: number;
  lawsuits_amount: number;
  created_at: string;
  updated_at: string;
}

export interface LaborLawsuitsTableRow {
  id?: string;
  company: string;
  contract_name: string;
  [key: string]: string | number | undefined;
}

export interface PurchasesUniforms {
  id: string;
  company: 'WWS' | 'Worldwide';
  contract_name: string;
  budget_2025: number;
  month_ym: string;
  amount_spent: number;
  created_at: string;
  updated_at: string;
}

export interface UniformsTableRow {
  id?: string;
  company: string;
  contract_name: string;
  budget_2025: number;
  [key: string]: string | number | undefined;
}

export interface PurchasesCleaningMaterials {
  id: string;
  company: 'WWS' | 'Worldwide';
  contract_name: string;
  budget_2025: number;
  month_ym: string;
  amount_spent: number;
  created_at: string;
  updated_at: string;
}

export interface CleaningMaterialsTableRow {
  id?: string;
  company: string;
  contract_name: string;
  budget_2025: number;
  [key: string]: string | number | undefined;
}

export interface PurchasesEpis {
  id: string;
  company: 'WWS' | 'Worldwide';
  contract_name: string;
  budget_2025: number;
  month_ym: string;
  amount_spent: number;
  created_at: string;
  updated_at: string;
}

export interface EpisTableRow {
  id?: string;
  company: string;
  contract_name: string;
  budget_2025: number;
  [key: string]: string | number | undefined;
}

export interface PurchasesEquipamentos {
  id: string;
  company: 'WWS' | 'Worldwide';
  contract_name: string;
  budget_2025: number;
  month_ym: string;
  amount_spent: number;
  created_at: string;
  updated_at: string;
}

export interface EquipamentosTableRow {
  id?: string;
  company: string;
  contract_name: string;
  budget_2025: number;
  [key: string]: string | number | undefined;
}

export interface PurchasesCombustivel {
  id: string;
  company: 'WWS' | 'Worldwide';
  department: string;
  budget_2025: number;
  month_ym: string;
  amount_spent: number;
  created_at: string;
  updated_at: string;
}

export interface CombustivelTableRow {
  id?: string;
  company: string;
  department: string;
  budget_2025: number;
  [key: string]: string | number | undefined;
}

export interface PurchasesSemParar {
  id: string;
  company: 'WWS' | 'Worldwide';
  department: string;
  budget_2025: number;
  month_ym: string;
  amount_spent: number;
  created_at: string;
  updated_at: string;
}

export interface SemPararTableRow {
  id?: string;
  company: string;
  department: string;
  budget_2025: number;
  [key: string]: string | number | undefined;
}

export interface HrOrganogram {
  id: string;
  employee_name: string;
  position: string;
  parent_id: string | null;
  level: number;
  department: string | null;
  department_id: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface BscItem {
  id: string;
  title: string;
  description: string | null;
  parent_id: string | null;
  level: number;
  order_position: number;
  is_kpi: boolean;
  meta: string | null;
  iniciativas: string | null;
  created_at: string;
  updated_at: string;
}

export interface BscFoundation {
  id: string;
  field_name: string;
  content: string;
  order_position: number;
  created_at: string;
  updated_at: string;
}

export interface OperationalFTs {
  id: string;
  company: 'WWS' | 'Worldwide';
  contract_name: string;
  budget_2025: number;
  month_ym: string;
  amount_spent: number;
  created_at: string;
  updated_at: string;
}

export interface FTsTableRow {
  id?: string;
  company: string;
  contract_name: string;
  budget_2025: number;
  [key: string]: string | number | undefined;
}

export interface OperationalSupervisorVisits {
  id: string;
  company: 'WWS' | 'Worldwide';
  supervisor_name: string;
  month_ym: string;
  visits_count: number;
  created_at: string;
  updated_at: string;
}

export interface SupervisorVisitsTableRow {
  id?: string;
  company: string;
  supervisor_name: string;
  [key: string]: string | number | undefined;
}

export interface OperationalClientVisits {
  id: string;
  company: 'WWS' | 'Worldwide';
  contract_name: string;
  month_ym: string;
  visits_count: number;
  created_at: string;
  updated_at: string;
}

export interface ClientVisitsTableRow {
  id?: string;
  company: string;
  contract_name: string;
  [key: string]: string | number | undefined;
}

export interface FinancialContractMargin {
  id: string;
  company: 'WWS' | 'Worldwide';
  contract_name: string;
  budget_2025: number;
  month_ym: string;
  amount_spent: number;
  created_at: string;
  updated_at: string;
}

export interface ContractMarginTableRow {
  id?: string;
  company: string;
  contract_name: string;
  budget_2025: number;
  [key: string]: string | number | undefined;
}

export interface FinancialStationResults {
  id: string;
  contract_name: string;
  month_ym: string;
  revenue: number;
  net_revenue: number;
  payroll_ft: number;
  csv_total: number;
  contribution_margin: number;
  forecast_revenue: number;
  forecast_net_revenue: number;
  forecast_payroll_ft: number;
  forecast_csv_total: number;
  forecast_contribution_margin: number;
  created_at: string;
  updated_at: string;
}

export interface StationResultsTableRow {
  id?: string;
  contract_name: string;
  [key: string]: string | number | undefined;
}