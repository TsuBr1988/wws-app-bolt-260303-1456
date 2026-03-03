import {
  supabaseComercialPrivado,
  supabaseComercialPublico,
  supabaseFinancas,
  supabaseGeral,
} from './supabaseClients';

export type Modulo =
  | 'RH'
  | 'OPERACIONAL'
  | 'COMERCIAL'
  | 'COMPRAS'
  | 'QUALIDADE'
  | 'CULTURA'
  | 'ATAS'
  | 'FINANCAS'
  | 'COMERCIAL_PRIVADO'
  | 'COMERCIAL_PUBLICO';

export function getDatabase(modulo: Modulo) {
  switch (modulo) {
    case 'FINANCAS':
      return supabaseFinancas;
    case 'COMERCIAL_PRIVADO':
      return supabaseComercialPrivado;
    case 'COMERCIAL_PUBLICO':
      return supabaseComercialPublico;
    default:
      return supabaseGeral;
  }
}
