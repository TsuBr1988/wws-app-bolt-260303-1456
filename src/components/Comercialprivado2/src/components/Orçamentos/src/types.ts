export interface Scale {
  nome: string;
  dias: number;
  multiplier: number;
  vrDays: number;
  vtDays: number;
}

export interface Scales {
  [key: string]: Scale;
}

export interface SalaryTable {
  [key: string]: number;
}

export interface FunctionData {
  id: string;
  nome: string;
  q: number;
  diasU: number;
  s: number;
  vPeric: number;
  vInsal: number;
  vGrat: number;
  vNot: number;
  vRed: number;
  vIntra: number;
  baseCalculoGeral: number;
  beneficios: Benefit[];
  materiais: number;
  capex: number;
  equipamentos: number;
  uniformes: number;
  outros: number;
  beneficiosDiferenciados: number;
  totalAcumulado: number;
  encargosAcumulado: number;
  totalComBDI: number;
  valorTotalBDI: number;
  issRate: number;
}

export interface Benefit {
  d: string;
  v: number;
}

export interface FunctionConfig {
  id: string;
  nome: string;
  chaveSalario: string;
  qtd: number;
  salario: number;
  escala: string;
  horarioTipo: 'diurno' | 'noturno';
  peric: number;
  insal: number;
  grat: number;
  notPerc: number;
  horas: number;
  horaNotAd: number;
  hasIntra: 'sim' | 'nao';
  intraPerc: number;
  vtValue: number;
  city: string;
  issRate: number;
}

export interface Budget {
  id?: string;
  budget_number?: string;
  client_name: string;
  description?: string;
  name: string;
  vt_value: number;
  iss_rate: number;
  city: string;
  service_type?: 'facilities' | 'vigilancia';
  status?: 'open' | 'closed';
  year?: number;
  sequence_number?: number;
  functions: FunctionConfig[];
  created_at?: string;
  updated_at?: string;
}

export type TabType = 'novo' | 'geral' | 'materiais' | 'capex' | 'equipamentos' | 'uniformes' | 'outros' | 'beneficios-diferenciados' | 'posto' | 'configuracoes';

export interface EncargosGroup {
  g: string;
  i: { d: string; p: number }[];
}

export interface ConfigFunction {
  id?: string;
  code: string;
  name: string;
  base_salary: number;
  service_type: 'facilities' | 'vigilancia';
  default_bonus_percent?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ConfigBenefit {
  id?: string;
  code: string;
  name: string;
  calculation_type: 'fixed' | 'per_day' | 'per_month' | 'formula';
  base_value: number;
  service_type: 'facilities' | 'vigilancia';
  formula?: string;
  is_active?: boolean;
  order_index?: number;
  created_at?: string;
  updated_at?: string;
}
