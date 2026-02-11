/**
 * Utilitários para formatação de datas no fuso horário de São Paulo (UTC-3)
 */

const SAO_PAULO_TIMEZONE = 'America/Sao_Paulo';

/**
 * Ajustar data para evitar problemas de fuso horário
 * Adiciona offset para garantir que a data seja interpretada corretamente
 */
const adjustDateForTimezone = (date: Date): Date => {
  // Criar nova data adicionando offset do fuso horário local
  const adjustedDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
  return adjustedDate;
};

/**
 * Criar data de forma segura a partir de string, evitando problemas de timezone
 */
const createSafeDate = (dateString: string | Date): Date => {
  if (dateString instanceof Date) {
    return dateString;
  }
  
  // Se for string no formato YYYY-MM-DD, tratar como data local
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // Usar construtor local
  }
  
  // Para outros formatos, usar construtor padrão
  return new Date(dateString);
};
/**
 * Formatar data para o padrão brasileiro com fuso horário de São Paulo
 */
export const formatDateBR = (dateString: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const date = createSafeDate(dateString);
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options
  };
  
  return date.toLocaleDateString('pt-BR', defaultOptions);
};

/**
 * Formatar data/hora completa para o padrão brasileiro com fuso horário de São Paulo
 */
export const formatDateTimeBR = (dateString: string | Date): string => {
  const date = createSafeDate(dateString);
  
  return date.toLocaleString('pt-BR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formatar apenas horário para o padrão brasileiro com fuso horário de São Paulo
 */
export const formatTimeBR = (dateString: string | Date): string => {
  const date = createSafeDate(dateString);
  
  return date.toLocaleTimeString('pt-BR', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formatar data para exibição sem conversão de timezone (horário literal)
 */
export const formatDateBRLiteral = (dateString: string | Date): string => {
  const date = createSafeDate(dateString);
  
  return date.toLocaleDateString('pt-BR', {
    timeZone: 'UTC', // Usar UTC para evitar conversão
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formatar hora para exibição sem conversão de timezone (horário literal)
 */
export const formatTimeBRLiteral = (dateString: string | Date): string => {
  const date = createSafeDate(dateString);
  
  return date.toLocaleTimeString('pt-BR', {
    timeZone: SAO_PAULO_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formatar mês por extenso para o padrão brasileiro
 */
export const formatMonthBR = (dateString: string | Date): string => {
  const date = createSafeDate(dateString);
  
  return date.toLocaleDateString('pt-BR', {
    timeZone: SAO_PAULO_TIMEZONE,
    month: 'long'
  });
};

/**
 * Formatar mês e ano para o padrão brasileiro
 */
export const formatMonthYearBR = (dateString: string | Date): string => {
  const date = createSafeDate(dateString);
  
  return date.toLocaleDateString('pt-BR', {
    timeZone: SAO_PAULO_TIMEZONE,
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Converter datetime-local para ISO string no fuso horário de São Paulo
 */
export const convertLocalDateTimeToISOExact = (localDateTime: string): string => {
  if (!localDateTime) return '';
  
  // CORRIGIDO: Salvar exatamente o horário digitado sem conversão
  // Interpretar como horário local de São Paulo e converter para UTC
  const date = new Date(localDateTime);
  
  // Subtrair 3 horas para corrigir o offset de São Paulo (UTC-3)
  // Isso garante que 09:00 digitado = 09:00 salvo no Supabase
  date.setHours(date.getHours() - 3);
  
  return date.toISOString();
};

/**
 * Converter ISO string para datetime-local no fuso horário de São Paulo
 */
export const convertISOToLocalDateTimeExact = (isoString: string): string => {
  if (!isoString) return '';
  
  // CORRIGIDO: Converter UTC para horário local de São Paulo
  // Adicionar 3 horas para corrigir o offset
  const date = new Date(isoString);
  date.setHours(date.getHours() + 3);
  
  // Retornar no formato datetime-local
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Formatar data/hora ISO para exibição local exata no timezone de São Paulo
 * Corrige problema de 3 horas a menos na exibição
 */
export const formatToLocalDateTimeExact = (isoDateString: string): string => {
  if (!isoDateString) return '';
  const date = new Date(isoDateString);
  return date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * Formatar apenas a data ISO para exibição local exata
 */
export const formatToLocalDateExact = (isoDateString: string): string => {
  if (!isoDateString) return '';
  const date = new Date(isoDateString);
  return date.toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * Formatar apenas o horário ISO para exibição local exata
 */
export const formatToLocalTimeExact = (isoDateString: string): string => {
  if (!isoDateString) return '';
  const date = new Date(isoDateString);
  return date.toLocaleTimeString('pt-BR', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * Obter data atual no fuso horário de São Paulo
 */
export const getCurrentDateTimeBR = (): Date => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: SAO_PAULO_TIMEZONE }));
};

/**
    timeZone: 'UTC',
 */
export const isToday = (dateString: string): boolean => {
  const today = getCurrentDateTimeBR();
  const targetDate = createSafeDate(dateString);
  
  // Comparar apenas as datas (ano, mês, dia)
  return today.getFullYear() === targetDate.getFullYear() &&
         today.getMonth() === targetDate.getMonth() &&
         today.getDate() === targetDate.getDate();
};

/**
 * Calcular diferença em dias no fuso horário de São Paulo
 */
export const getDaysUntil = (dateString: string): number => {
  const today = getCurrentDateTimeBR();
  const targetDate = createSafeDate(dateString);
  
  // Normalizar as datas para o início do dia para cálculo preciso
  const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetNormalized = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  
  const diffTime = targetNormalized.getTime() - todayNormalized.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};