
export type Company = 'Worldwide Segurança' | 'WWS Services' | '2WS';
export type BalancesByCompany = Record<Company, number>;
export type FileType = 'pagar' | 'pagas' | 'receber' | 'recebidas';
export type ViewState = 'files' | 'dashboard' | 'statement' | 'simulations' | 'contract_analysis' | 'coa' | 'budget' | 'kpis' | 'contract_sheets' | 'delinquent' | 'loans' | 'administrative' | 'settings';
export type CoaViewMode = 'cash' | 'accrual';
export type CashSubView = 'all' | 'projected' | 'realized';
export type ClientType = 'public' | 'private';
export type CostCenterCategory = 'client' | 'administrative';
export type ClientCategoryFilter = 'all' | 'client' | 'administrative';
export type ClientStatusFilter = 'all' | 'active' | 'inactive';
export type ClientTypeFilter = 'all' | 'public' | 'private';
export type CityFilter = 'all' | string;

export interface Transaction {
  id: string;
  company: Company;
  type: 'pay' | 'receive';
  status: 'pending' | 'completed';
  dueDate: Date;
  paymentDate?: Date;
  competencyDate?: Date;
  simulationDate?: Date;
  amount: number;
  description: string;
  category: string;
  costCenter: string;
  originalFile: string;
  nome?: string;
}

export interface MonthlyValues {
    projected: number;
    realized: number;
    unrealized: number;
    accrual: number;
}

export interface CoaNode {
  code: string;
  name: string;
  monthlyData: Record<string, MonthlyValues>;
  children: CoaNode[];
  level: number;
  isLeaf: boolean;
  isProvisionLine?: boolean;
}

export interface ClientMetadata {
    category: CostCenterCategory;
    type: ClientType;
    city: string;
    company: Company;
    status?: 'active' | 'inactive';
}

export interface TransactionWithBalance extends Transaction {
    accumulatedBalance: number;
}

// Contract Types
export interface Contract {
    id: string;
    client_name: string;
    city: string;
    numero_pregao?: string;
    numero_contrato?: string;
    monthly_value: number;
    start_date: string; // ISO String YYYY-MM-DD
    end_date: string;   // ISO String YYYY-MM-DD
    contract_object: string;
    is_active: boolean;
    empresa: Company;
    tipo: 'Publico' | 'Privado';
    department: string;
    margem_percentual?: number;
    reequilibrio_dissidio?: boolean;
    reequilibrio_ipca?: boolean;
    cost_center?: string; // Optional link to client_metadata
    addendums?: ContractAddendum[];
}

export interface ContractAddendum {
    id: string;
    contract_id: string;
    start_date: string;
    end_date: string;
    monthly_value: number;
    observations: string;
    is_punctual: boolean;
    is_active: boolean;
    created_at?: string;
}

export interface ContractSheet {
    id: string;
    client_name: string;
    start_date: string;
    end_date: string;
    expense_year?: string | null;
    termination_date?: string | null;
    created_at?: string;
    updated_at?: string;
    items?: ContractSheetItem[];
}

export interface ContractSheetItem {
    id: string;
    sheet_id: string;
    category_code: string;
    category_name: string;
    budgeted_amount: number;
    client_name?: string;
}

export interface CategoriaDRE {
    id: string;
    ordem: number;
    codigo: string | null;
    nome: string;
    grupo: string;
    natureza: 'receita' | 'custo' | 'despesa' | 'subtotal' | 'indicador';
}

export interface CategoryNode {
    codigo: string | null;
    nome: string;
    grupo: string;
    natureza: 'receita' | 'custo' | 'despesa' | 'subtotal' | 'indicador';
    ordem: number;
    budgeted: number;
    realized: number;
    monthlyValues: Record<string, number>;
    children: CategoryNode[];
    level: number;
    isLeaf: boolean;
}