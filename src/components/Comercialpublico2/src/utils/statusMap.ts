export const STATUS_UI_TO_DB: Record<string, string> = {
  "Aguardando": "Proposta",
  "Em andamento": "Negociação",
  "Encerrado": "Perdido",
  "Contrato assinado": "Fechado",
  "Perdido": "Perdido",
  "Desclassificado": "Perdido",
  "Suspenso": "Perdido",
  "Vencido": "Classificação",
  "Fracassado": "Perdido",
  "Inabilitado": "Perdido",
  "Revogado": "Perdido",
  "Declinamos": "Declinamos/ Não teve pregão"
};

// inverso para exibir na UI
export const STATUS_DB_TO_UI: Record<string, string> = Object
  .entries(STATUS_UI_TO_DB)
  .reduce((acc, [ui, db]) => { acc[db] = ui; return acc; }, {} as Record<string,string>);

export function mapSituacaoToStatus(ui: string | null | undefined) {
  if (!ui) return "Proposta";
  return STATUS_UI_TO_DB[ui] ?? ui;
}

export function mapStatusToSituacao(db: string | null | undefined) {
  if (!db) return "Aguardando";
  return STATUS_DB_TO_UI[db] ?? db;
}