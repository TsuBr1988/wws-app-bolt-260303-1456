export interface ProspectionUser {
  id: string;
  name: string;
  email: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProspectionWeekly {
  id: string;
  user_id: string;
  week_start: string; // Segunda-feira da semana (ISO: YYYY-MM-DD)
  tag: string | null;
  
  // Métricas de Email
  emails_sent: number;
  emails_replied: number;
  
  // Métricas de Telefone
  calls_made: number;
  calls_connected: number;
  
  // Métricas de WhatsApp
  whatsapp_sent: number;
  whatsapp_connected: number;
  
  // Métricas de LinkedIn
  linkedin_msgs: number;
  linkedin_connected: number;
  
  // Métricas de Reuniões
  meetings_scheduled: number;
  meetings_held: number;
  
  // Outras métricas
  positive_connections: number;
  disqualifications: number;
  active_contacts: number;
  new_contacts: number;
  unique_contacts_activated: number;
  unique_contacts_active: number;
  
  // Métricas de qualificação
  mql: number;
  sql: number;
  new_clients: number;
  
  created_at: string;
  updated_at: string;
}

export interface ProspectionIngestImage {
  id: string;
  user_id: string;
  kind: 'conexoes' | 'perfil' | 'metas';
  period_start: string | null;
  period_end: string | null;
  week_start: string | null; // Derivada da period_start
  image_url: string | null;
  ocr_raw: string | null;
  parsed_payload: any | null;
  status: 'uploaded' | 'parsed' | 'confirmed';
  created_at: string;
  updated_at: string;
}

// Tipos para cálculos de KPIs
export interface ProspectionKPIs {
  totalConnections: number;
  totalAttempts: number;
  connectionRate: number;
  connectionPercentage: number;
  connectionsPerActiveContact: number;
  totalPositiveConnections: number;
  totalActiveContacts: number;
  realizationRate: number;
  meetingsScheduled: number;
  meetingsHeld: number;
  mql: number;
  sql: number;
  newClients: number;
}

// Tipo para dados do funil
export interface ProspectionFunnel {
  contacts: number;
  activated: number;
  active: number;
  mql: number;
  sql: number;
  clients: number;
}

// Tipo para trending (12 semanas)
export interface ProspectionTrending {
  weekStart: string;
  connections: number;
  connectionRate: number;
  meetings: number;
  mql: number;
  sql: number;
  clients: number;
}