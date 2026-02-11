import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const debugLog = (...args: unknown[]) => {
  if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_LOGS === 'true') console.log(...args);
};

export interface AppUser {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  is_active: boolean;
  comercial_publico_access_type?: 'comercial' | 'administrativo' | 'interno' | null;
}

export type PermissionLevel = 'none' | 'view' | 'edit';

export interface UserPermissions {
  pages: Record<string, boolean>;
  indicators: Record<string, Record<string, PermissionLevel>>;
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions>({ pages: {}, indicators: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedUser = localStorage.getItem('app_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        await loadPermissions(parsedUser.id, parsedUser.is_admin);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async (userId: string, isAdmin: boolean) => {
    if (isAdmin) {
      setPermissions({ pages: {}, indicators: {} });
      return;
    }

    try {
      const { data: pagePerms } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId)
        .eq('can_view', true);

      const { data: indicatorPerms } = await supabase
        .from('user_indicator_permissions')
        .select('*')
        .eq('user_id', userId);

      const pages: Record<string, boolean> = {};
      pagePerms?.forEach(p => {
        pages[p.page] = true;
      });

      const indicators: Record<string, Record<string, PermissionLevel>> = {};
      indicatorPerms?.forEach(i => {
        if (i.permission_level !== 'none') {
          if (!indicators[i.page]) {
            indicators[i.page] = {};
          }
          indicators[i.page][i.indicator_name] = i.permission_level as PermissionLevel;
        }
      });

      setPermissions({ pages, indicators });

      localStorage.setItem('app_user_permissions', JSON.stringify({ pages, indicators }));
    } catch (error) {
      console.error('Error loading permissions:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        console.error('Login error:', error);
        return { data: null, error: error || new Error('Credenciais inválidas') };
      }

      const appUser: AppUser = {
        id: data.id,
        email: data.email,
        name: data.name,
        is_admin: data.is_admin,
        is_active: data.is_active,
        comercial_publico_access_type: data.comercial_publico_access_type,
      };

      debugLog('Login successful, user:', appUser);

      localStorage.setItem('app_user', JSON.stringify(appUser));
      setUser(appUser);
      await loadPermissions(appUser.id, appUser.is_admin);

      setTimeout(() => {
        window.location.reload();
      }, 500);

      return { data: appUser, error: null };
    } catch (error: any) {
      console.error('Login exception:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('app_user');
    localStorage.removeItem('app_user_permissions');
    setUser(null);
    setPermissions({ pages: {}, indicators: {} });
    window.location.reload();
    return { error: null };
  };

  const normalizePage = (page: string): string => {
    return page.toLowerCase();
  };

  const hasPageAccess = (page: string): boolean => {
    if (!user) return false;
    if (user.is_admin) return true;
    const normalizedPage = normalizePage(page);
    return permissions.pages[normalizedPage] === true;
  };

  const hasIndicatorAccess = (page: string, indicator: string): boolean => {
    if (!user) return false;
    if (user.is_admin) return true;
    const normalizedPage = normalizePage(page);
    const level = permissions.indicators[normalizedPage]?.[indicator];
    return level === 'view' || level === 'edit';
  };

  const canEditIndicator = (page: string, indicator: string): boolean => {
    if (!user) return false;
    if (user.is_admin) return true;
    const normalizedPage = normalizePage(page);
    return permissions.indicators[normalizedPage]?.[indicator] === 'edit';
  };

  const getIndicatorPermission = (page: string, indicator: string): PermissionLevel => {
    if (!user) return 'none';
    if (user.is_admin) return 'edit';
    const normalizedPage = normalizePage(page);
    return permissions.indicators[normalizedPage]?.[indicator] || 'none';
  };

  return {
    user,
    loading,
    permissions,
    signIn,
    signOut,
    hasPageAccess,
    hasIndicatorAccess,
    canEditIndicator,
    getIndicatorPermission,
  };
}
