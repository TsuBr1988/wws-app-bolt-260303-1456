/**
 * Utilitários para manipulação de datas
 * Resolve problemas de fuso horário entre UTC e horário local
 */

/**
 * Formata uma data para ser salva no banco de dados em colunas timestamp with time zone
 * Adiciona meio-dia UTC para evitar problemas de fuso horário
 * @param dateString - String da data no formato YYYY-MM-DD
 * @returns String formatada para o banco de dados
 */
export const formatTimestampForDb = (dateString: string): string => {
  if (!dateString) return new Date().toISOString();
  
  // Garantir que temos uma data válida
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    console.warn('Data inválida fornecida:', dateString);
    return new Date().toISOString();
  }
  
  // Criar uma nova data com meio-dia UTC para evitar problemas de fuso horário
  // Isso garante que o dia permaneça o mesmo independente do fuso horário local
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}T12:00:00.000Z`;
};

/**
 * Formata uma data vinda do banco para exibição
 * Funciona tanto com colunas date quanto timestamp with time zone
 * @param dateString - String da data do banco
 * @param format - Formato de saída ('pt-BR' por padrão)
 * @returns String formatada para exibição
 */
export const displayDate = (dateString: string | null | undefined, format: 'pt-BR' | 'ISO' = 'pt-BR'): string => {
  if (!dateString) return '';
  
  try {
    // Forçar interpretação como UTC para evitar problemas de fuso horário
    const date = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00Z`);
    if (isNaN(date.getTime())) {
      console.warn('Data inválida para exibição:', dateString);
      return '';
    }
    
    if (format === 'ISO') {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    
    return date.toLocaleDateString('pt-BR', {
      timeZone: 'UTC',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '';
  }
};

/**
 * Formata uma data vinda do banco para exibição com hora
 * @param dateString - String da data do banco
 * @returns String formatada com data e hora
 */
export const displayDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn('Data inválida para exibição:', dateString);
      return '';
    }
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Erro ao formatar data e hora:', error);
    return '';
  }
};

/**
 * Converte uma data do banco para formato de input date (YYYY-MM-DD)
 * @param dateString - String da data do banco
 * @returns String no formato YYYY-MM-DD para inputs
 */
export const formatDateForInput = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn('Data inválida para input:', dateString);
      return '';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Erro ao formatar data para input:', error);
    return '';
  }
};

/**
 * Valida se uma string representa uma data válida
 * @param dateString - String da data a ser validada
 * @returns true se a data for válida
 */
export const isValidDate = (dateString: string): boolean => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Obtém a data atual formatada para input (YYYY-MM-DD)
 * @returns String da data atual
 */
export const getCurrentDateForInput = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Calcula o tempo decorrido entre duas datas e retorna uma string formatada
 * @param startDate - Data de início
 * @param endDate - Data de fim
 * @returns String formatada com o tempo decorrido
 */
export const calculateTimeDifference = (startDate: string, endDate: string): string => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Tempo não calculável';
    }
    
    const diffInMs = end.getTime() - start.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 1) {
      return 'Menos de 1 dia';
    } else if (diffInDays === 1) {
      return '1 dia';
    } else if (diffInDays < 7) {
      return `${diffInDays} dias`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      const remainingDays = diffInDays % 7;
      if (remainingDays === 0) {
        return `${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
      } else {
        return `${weeks} ${weeks === 1 ? 'semana' : 'semanas'} e ${remainingDays} ${remainingDays === 1 ? 'dia' : 'dias'}`;
      }
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      const remainingDays = diffInDays % 30;
      if (remainingDays < 7) {
        return `${months} ${months === 1 ? 'mês' : 'meses'}`;
      } else {
        const weeks = Math.floor(remainingDays / 7);
        return `${months} ${months === 1 ? 'mês' : 'meses'} e ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
      }
    } else {
      const years = Math.floor(diffInDays / 365);
      const remainingDays = diffInDays % 365;
      const months = Math.floor(remainingDays / 30);
      if (months === 0) {
        return `${years} ${years === 1 ? 'ano' : 'anos'}`;
      } else {
        return `${years} ${years === 1 ? 'ano' : 'anos'} e ${months} ${months === 1 ? 'mês' : 'meses'}`;
      }
    }
  } catch (error) {
    console.error('Erro ao calcular diferença de tempo:', error);
    return 'Tempo não calculável';
  }
};