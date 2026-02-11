import { ProspectionWeekly, ProspectionKPIs, ProspectionFunnel, ProspectionTrending } from '../types/prospection';

/**
 * Obter segunda-feira da semana para uma data
 */
export const getWeekStart = (date: Date): string => {
  // Criar uma nova instância da data para evitar mutação
  const d = new Date(date.getTime());
  
  // Verificar se a data é válida
  if (isNaN(d.getTime())) {
    console.error('Data inválida fornecida para getWeekStart:', date);
    return new Date().toISOString().split('T')[0];
  }
  
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para segunda-feira
  
  // Usar setDate de forma segura
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  
  // Verificar se o resultado é válido
  if (isNaN(monday.getTime())) {
    console.error('Erro ao calcular segunda-feira para a data:', date);
    return new Date().toISOString().split('T')[0];
  }
  
  return monday.toISOString().split('T')[0];
};

/**
 * Obter domingo da semana para uma data (semana anterior)
 */
export const getSundayWeek = (date: Date): string => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Voltar para domingo
  const sunday = new Date(d.setDate(diff));
  return sunday.toISOString().split('T')[0];
};

/**
 * Calcular total de tarefas feitas
 */
export const calculateTasksCompleted = (weekData: any): number => {
  return (weekData.emails_sent || 0) + 
         (weekData.calls_made || 0) + 
         (weekData.whatsapp_sent || 0) + 
         (weekData.linkedin_msgs || 0);
};

/**
 * Calcular percentual de conexões positivas vs tarefas feitas
 */
export const calculatePositiveConnectionRate = (weekData: any): number => {
  const tasksCompleted = calculateTasksCompleted(weekData);
  const positiveConnections = weekData.positive_connections || 0;
  
  return tasksCompleted > 0 ? (positiveConnections / tasksCompleted) * 100 : 0;
};

/**
 * Obter segunda-feira da semana atual
 */
export const getCurrentWeekStart = (): string => {
  return getSundayWeek(new Date());
};

/**
 * Calcular período de 7 dias baseado em uma data de referência
 * A data de referência representa o final do período + 1 dia
 * @param referenceDate - Data de referência (normalmente uma segunda-feira)
 * @returns Objeto com período start e end
 */
export const calculatePeriodFromReference = (referenceDate: string): { periodStart: string; periodEnd: string; referenceDateObj: Date } => {
  try {
    const refDate = new Date(referenceDate);
    
    if (isNaN(refDate.getTime())) {
      throw new Error('Data de referência inválida');
    }
    
    // Calcular período de 7 dias anteriores à data de referência
    const periodEnd = new Date(refDate);
    periodEnd.setDate(refDate.getDate() - 1); // Dia anterior à referência
    
    const periodStart = new Date(refDate);
    periodStart.setDate(refDate.getDate() - 7); // 7 dias antes da referência
    
    return {
      periodStart: periodStart.toISOString().split('T')[0],
      periodEnd: periodEnd.toISOString().split('T')[0],
      referenceDateObj: refDate
    };
  } catch (error) {
    console.error('Erro ao calcular período:', error);
    // Fallback para data atual
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    return {
      periodStart: weekAgo.toISOString().split('T')[0],
      periodEnd: yesterday.toISOString().split('T')[0],
      referenceDateObj: today
    };
  }
};

/**
 * Calcular KPIs de prospecção baseado nos dados semanais
 */
export const calculateProspectionKPIs = (weeklyData: ProspectionWeekly[]): ProspectionKPIs => {
  const totals = weeklyData.reduce((acc, week) => ({
    emails_sent: acc.emails_sent + week.emails_sent,
    emails_replied: acc.emails_replied + week.emails_replied,
    calls_made: acc.calls_made + week.calls_made,
    calls_connected: acc.calls_connected + week.calls_connected,
    whatsapp_sent: acc.whatsapp_sent + week.whatsapp_sent,
    whatsapp_connected: acc.whatsapp_connected + week.whatsapp_connected,
    linkedin_msgs: acc.linkedin_msgs + week.linkedin_msgs,
    linkedin_connected: acc.linkedin_connected + week.linkedin_connected,
    meetings_scheduled: acc.meetings_scheduled + week.meetings_scheduled,
    meetings_held: acc.meetings_held + week.meetings_held,
    positive_connections: acc.positive_connections + week.positive_connections,
    active_contacts: acc.active_contacts + week.active_contacts,
    mql: acc.mql + week.mql,
    sql: acc.sql + week.sql,
    new_clients: acc.new_clients + week.new_clients
  }), {
    emails_sent: 0, emails_replied: 0,
    calls_made: 0, calls_connected: 0,
    whatsapp_sent: 0, whatsapp_connected: 0,
    linkedin_msgs: 0, linkedin_connected: 0,
    meetings_scheduled: 0, meetings_held: 0,
    positive_connections: 0, active_contacts: 0,
    mql: 0, sql: 0, new_clients: 0
  });

  // Fórmulas
  const totalConnections = totals.calls_connected + totals.whatsapp_connected + 
                          totals.linkedin_connected + totals.emails_replied;
  
  const totalAttempts = totals.calls_made + totals.whatsapp_sent + 
                       totals.linkedin_msgs + totals.emails_sent;
  
  const connectionRate = totalAttempts > 0 ? (totalConnections / totalAttempts) * 100 : 0;
  
  // Novo KPI: % de conexões (conexões positivas / contatos ativos)
  const connectionPercentage = totals.active_contacts > 0 ? 
    (totals.positive_connections / totals.active_contacts) * 100 : 0;
    
  const realizationRate = totals.meetings_scheduled > 0 ? 
                         (totals.meetings_held / totals.meetings_scheduled) * 100 : 0;

  return {
    totalConnections,
    totalAttempts,
    connectionRate,
    connectionPercentage,
    connectionsPerActiveContact: totals.active_contacts > 0 ? 
      (totalConnections / totals.active_contacts) * 100 : 0,
    totalPositiveConnections: totals.positive_connections,
    totalActiveContacts: totals.active_contacts,
    realizationRate,
    meetingsScheduled: totals.meetings_scheduled,
    meetingsHeld: totals.meetings_held,
    mql: totals.mql,
    sql: totals.sql,
    newClients: totals.new_clients
  };
};

/**
 * Calcular funil de prospecção
 */
export const calculateProspectionFunnel = (weeklyData: ProspectionWeekly[]): ProspectionFunnel => {
  const totals = weeklyData.reduce((acc, week) => ({
    new_contacts: acc.new_contacts + week.new_contacts,
    unique_contacts_activated: acc.unique_contacts_activated + week.unique_contacts_activated,
    unique_contacts_active: acc.unique_contacts_active + week.unique_contacts_active,
    mql: acc.mql + week.mql,
    sql: acc.sql + week.sql,
    new_clients: acc.new_clients + week.new_clients
  }), {
    new_contacts: 0,
    unique_contacts_activated: 0,
    unique_contacts_active: 0,
    mql: 0,
    sql: 0,
    new_clients: 0
  });

  return {
    contacts: totals.new_contacts,
    activated: totals.unique_contacts_activated,
    active: totals.unique_contacts_active,
    mql: totals.mql,
    sql: totals.sql,
    clients: totals.new_clients
  };
};

/**
 * Gerar dados de trending (últimas 12 semanas)
 */
export const generateProspectionTrending = (weeklyData: ProspectionWeekly[]): ProspectionTrending[] => {
  // Ordenar por week_start e pegar últimas 12 semanas
  const sortedWeeks = weeklyData
    .sort((a, b) => new Date(a.week_start).getTime() - new Date(b.week_start).getTime())
    .slice(-12);

  return sortedWeeks.map(week => {
    const totalConnections = week.calls_connected + week.whatsapp_connected + 
                            week.linkedin_connected + week.emails_replied;
    
    const totalAttempts = week.calls_made + week.whatsapp_sent + 
                         week.linkedin_msgs + week.emails_sent;
    
    const connectionRate = totalAttempts > 0 ? (totalConnections / totalAttempts) * 100 : 0;

    return {
      weekStart: week.week_start,
      connections: totalConnections,
      connectionRate,
      meetings: week.meetings_scheduled,
      mql: week.mql,
      sql: week.sql,
      clients: week.new_clients
    };
  });
};

/**
 * Validar dados de input (não permitir NaN ou negativos)
 */
export const validateProspectionInput = (value: string): number => {
  const num = parseInt(value) || 0;
  return Math.max(0, num); // Garantir que seja >= 0
};

/**
 * Formatar taxa de conexão
 */
export const formatConnectionRate = (rate: number): string => {
  return `${rate.toFixed(1)}%`;
};

/**
 * Obter último domingo para derivar week_start
 */
export const getLastSunday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

/**
 * Converter data para segunda-feira da semana
 */
export const convertToWeekStart = (dateString: string): string => {
  const date = new Date(dateString);
  return getWeekStart(date);
};

/**
 * Gerar lista das últimas 12 semanas (segunda-feira)
 */
export const generateLast12Weeks = (): string[] => {
  const weeks = [];
  const today = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const weekDate = new Date(today);
    weekDate.setDate(today.getDate() - (i * 7));
    weeks.push(getWeekStart(weekDate));
  }
  
  return weeks;
};