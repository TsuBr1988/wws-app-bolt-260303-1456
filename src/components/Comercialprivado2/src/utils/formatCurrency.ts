/**
 * Formata valores monetários para o padrão brasileiro com 2 casas decimais
 * @param value - Valor numérico a ser formatado
 * @returns String formatada no padrão R$ 9.999,99
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Formata valores monetários sem símbolo de moeda
 * @param value - Valor numérico a ser formatado
 * @returns String formatada no padrão 9.999,99
 */
export const formatCurrencyNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};