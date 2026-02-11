/**
 * Utilitários para datetime das notificações
 * Formatação sem conversão de timezone para exibir exatamente como está no banco
 */

// Formata data/hora sem deslocar timezone
export function formatDateTimeLocal(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Formatar apenas data sem horário
export function formatDateLocal(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

// Calcular diferença em dias
export function daysDiffFromNow(iso: string): number {
  const now = new Date();
  const target = new Date(iso);
  const diffMs = target.getTime() - now.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// Calcular diferença em minutos
export function minutesDiffFromNow(iso: string): number {
  const now = new Date();
  const target = new Date(iso);
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60));
}

// Badge colorido baseado na proximidade do deadline
export function badgeByDeadline(iso: string) {
  const minutes = minutesDiffFromNow(iso);
  const days = daysDiffFromNow(iso);
  
  if (minutes < 0) {
    return { 
      label: 'Vencida', 
      cls: 'bg-red-100 text-red-700 border border-red-200 font-bold' 
    };
  }
  
  if (days === 0) {
    return { 
      label: 'Hoje', 
      cls: 'bg-red-50 text-red-700 border border-red-200 animate-pulse font-bold' 
    };
  }
  
  if (days === 1) {
    return { 
      label: 'Amanhã', 
      cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200 font-medium' 
    };
  }
  
  if (days <= 2) {
    return { 
      label: `${days} dias`, 
      cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200' 
    };
  }
  
  return { 
    label: `${days} dias`, 
    cls: 'bg-blue-50 text-blue-700 border border-blue-200' 
  };
}

// Cor baseada na situação
export function colorBySituacao(s: SituacaoNotificacao) {
  switch (s) {
    case 'A fazer':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'Feito':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'Não iremos responder':
      return 'bg-gray-100 text-gray-700 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300';
  }
}

// Converter datetime-local para ISO string
export function localDateTimeToISO(localDateTime: string): string {
  if (!localDateTime) return '';
  return new Date(localDateTime).toISOString();
}

// Converter ISO string para datetime-local
export function isoToLocalDateTime(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}