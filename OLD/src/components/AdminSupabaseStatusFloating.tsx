import { useEffect, useState } from 'react';
import { getDatabase } from '@/lib/databaseResolver';
import { useAuth } from '@/hooks/useAuth';

const supabase = getDatabase('RH');

type ConnectionStatus = 'hidden' | 'checking' | 'online';

export function AdminSupabaseStatusFloating() {
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>('hidden');

  useEffect(() => {
    if (loading) return;
    if (!user?.is_admin) {
      setStatus('hidden');
      return;
    }

    let isCancelled = false;

    const check = async () => {
      if (!navigator.onLine) {
        if (!isCancelled) setStatus('hidden');
        return;
      }

      if (!isCancelled) setStatus('checking');

      try {
        // Health-check using a table that is already used for login.
        const { error } = await supabase
          .from('app_users')
          .select('id')
          .limit(1);

        if (!isCancelled) {
          setStatus(error ? 'hidden' : 'online');
        }
      } catch {
        if (!isCancelled) setStatus('hidden');
      }
    };

    const onOnline = () => void check();
    const onOffline = () => setStatus('hidden');

    void check();

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    const intervalId = window.setInterval(() => {
      void check();
    }, 60_000);

    return () => {
      isCancelled = true;
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.clearInterval(intervalId);
    };
  }, [loading, user?.is_admin]);

  if (status !== 'online') return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-800 rounded-xl p-3 border border-gray-700 shadow-lg">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold text-gray-300">Sistema Online</span>
        </div>
        <p className="text-[9px] text-gray-400 leading-relaxed">Sincronização com Supabase ativa.</p>
      </div>
    </div>
  );
}
