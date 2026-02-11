export interface Contract {
  id: string;
  client_name: string;
  city: string;
  numero_pregao: string | null
  numero_contrato: string | null
  monthly_value: number;
  start_date: string;
  end_date: string;
  contract_object: string;
  is_active: boolean;
  reequilibrio_dissidio: boolean;
  reequilibrio_ipca: boolean;
  ultimo_lembrete_dissidio: string | null;
  ultimo_lembrete_ipca: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractAddendum {
  id: string;
  contract_id: string;
  start_date: string;
  end_date: string;
  monthly_value: number;
  observations: string;
  is_punctual: boolean;
  effective_start_date: string;
  effective_end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContractWithAddendums extends Contract {
  addendums: ContractAddendum[];
  current_value: number;
  current_end_date: string;
  days_until_end: number;
  is_ending_soon: boolean;
  active_punctual_addendum?: ContractAddendum;
  latest_punctual_addendum?: ContractAddendum;
  punctual_ending_soon?: boolean;
  days_until_punctual_end?: number;
}