import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { TestTube2, FlaskConical, LockIcon } from 'lucide-react';
import ComercialPublico2Embed from './ComercialPublico2Embed';
import ComercialPrivado2Embed from './ComercialPrivado2Embed';
import { useAuth } from '@/hooks/useAuth';

type ViewType = 'selection' | 'teste' | 'teste-privado';

export function ComercialPage() {
  const [currentView, setCurrentView] = useState<ViewType>('selection');
  const { hasPageAccess, user } = useAuth();

  const hasPublicoAccess = hasPageAccess('comercial_publico');
  const hasPrivadoAccess = hasPageAccess('comercial_privado');

  if (currentView === 'teste') {
    return <ComercialPublico2Embed />;
  }

  if (currentView === 'teste-privado') {
    return <ComercialPrivado2Embed />;
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-8 min-h-[calc(100vh-80px)]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Explore nossos módulos</h1>
          <p className="text-slate-600">Selecione o segmento comercial para visualizar os indicadores</p>
        </div>

        {!hasPublicoAccess && !hasPrivadoAccess && !user?.is_admin && (
          <div className="text-center py-12">
            <LockIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Você não tem acesso a nenhum módulo comercial</p>
            <p className="text-gray-500 text-sm mt-2">Entre em contato com o administrador para solicitar acesso</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {hasPublicoAccess && (
            <Card
              onClick={() => setCurrentView('teste')}
              className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div className="p-8 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <TestTube2 className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Comercial Público</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Sistema de testes e desenvolvimento
                  </p>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-orange-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </Card>
          )}

          {hasPrivadoAccess && (
            <Card
              onClick={() => setCurrentView('teste-privado')}
              className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div className="p-8 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FlaskConical className="w-8 h-8 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Comercial Privado</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Sistema comercial privado em desenvolvimento
                  </p>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-rose-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}