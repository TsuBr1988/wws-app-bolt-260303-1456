import { supabase } from '../../../lib/supabase';

type StoredUserPermissions = {
  pages?: Record<string, boolean>;
  indicators?: Record<string, Record<string, 'none' | 'view' | 'edit'>>;
};

function getStoredUserPermissions(): StoredUserPermissions {
  try {
    const raw = localStorage.getItem('app_user_permissions');
    if (!raw) return {};
    return JSON.parse(raw) as StoredUserPermissions;
  } catch {
    return {};
  }
}

function getStoredIndicatorLevel(page: string, indicator: string): 'none' | 'view' | 'edit' {
  const normalizedPage = page.toLowerCase();
  const perms = getStoredUserPermissions();
  return perms.indicators?.[normalizedPage]?.[indicator] ?? 'none';
}

function hasStoredIndicatorAccess(page: string, indicator: string): boolean {
  const level = getStoredIndicatorLevel(page, indicator);
  return level === 'view' || level === 'edit';
}

function hasStoredIndicatorEdit(page: string, indicator: string): boolean {
  const level = getStoredIndicatorLevel(page, indicator);
  return level === 'edit';
}

function hasStoredPageAccess(page: string): boolean {
  const normalizedPage = page.toLowerCase();
  const perms = getStoredUserPermissions();
  return perms.pages?.[normalizedPage] === true;
}

function departamentoToPageKeys(departamento: string): string[] {
  switch (departamento) {
    case 'RH':
      return ['rh'];
    case 'Comercial Privado':
      return ['comercial_privado'];
    case 'Comercial Público':
      return ['comercial_publico'];
    case 'Compras':
      return ['compras'];
    case 'TI':
      return ['ti'];
    case 'Marketing':
      return ['marketing'];
    case 'Qualidade':
      return ['qualidade'];
    case 'Financeiro':
      // Alguns ambientes usam a aba antiga 'financeiro'; outros usam 'financas'.
      return ['financeiro', 'financas'];
    case 'Operacional':
      return ['operacional'];
    default:
      return [];
  }
}

async function canManageMarketingRequestsLegacy(appUserId: string): Promise<boolean> {
  try {
    const sb = supabase as any;
    const { data, error } = await sb
      .from('marketing_roles' as any)
      .select('role')
      .eq('app_user_id', appUserId)
      .maybeSingle();

    if (error) throw error;
    return data?.role === 'editor';
  } catch (error) {
    console.error('Erro ao carregar marketing_roles:', error);
    return false;
  }
}

export async function canCreateMarketingRequests(appUserId: string | undefined | null, isAdmin: boolean | undefined | null) {
  if (isAdmin) return true;
  if (!appUserId) return false;

  if (hasStoredIndicatorAccess('marketing', 'Solicitações - Pedir')) return true;
  return canManageMarketingRequestsLegacy(appUserId);
}

export async function canEditMarketingRequests(appUserId: string | undefined | null, isAdmin: boolean | undefined | null) {
  if (isAdmin) return true;
  if (!appUserId) return false;

  if (hasStoredIndicatorEdit('marketing', 'Solicitações - Editar')) return true;
  return canManageMarketingRequestsLegacy(appUserId);
}

export async function canManageMarketingRequests(appUserId: string | undefined | null, isAdmin: boolean | undefined | null) {
  // Backwards-compat: quem "gerencia" == quem pode editar.
  return canEditMarketingRequests(appUserId, isAdmin);
}

// Regra específica: quando a solicitação está em "Feito", quem pode *pedir edição* é:
// - Admin; ou
// - usuários com acesso à página do departamento solicitante.
export function canRequestEditMarketingRequestWhenDone(departamentoSolicitante: string) {
  const userMeta = getCurrentUserMeta();
  if (userMeta.is_admin) return true;

  const pageKeys = departamentoToPageKeys(departamentoSolicitante);
  return pageKeys.some((pageKey) => hasStoredPageAccess(pageKey));
}

export function getCurrentUserMeta() {
  try {
    const storedUser = localStorage.getItem('app_user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    return {
      by_name: user?.name as string | undefined,
      by_email: user?.email as string | undefined,
      app_user_id: user?.id as string | undefined,
      is_admin: user?.is_admin as boolean | undefined,
    };
  } catch {
    return {
      by_name: undefined,
      by_email: undefined,
      app_user_id: undefined,
      is_admin: undefined,
    };
  }
}
