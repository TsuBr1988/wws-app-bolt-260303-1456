
import React from 'react';
import { Database, Check, RefreshCw, Save, Building2, Plus, MapPin, Briefcase, Activity } from 'lucide-react';
import { Company, ClientMetadata } from '../../../types';
import { COMPANIES } from '../../../utils';
import { SupabaseClient } from '@supabase/supabase-js';

interface SettingsTabProps {
    supabaseUrl: string;
    setSupabaseUrl: (url: string) => void;
    supabaseKey: string;
    setSupabaseKey: (key: string) => void;
    isConnected: boolean;
    dbLoading: boolean;
    fetchFromSupabase: (client: SupabaseClient) => void;
    saveSupabaseConfig: () => void;
    supabaseClient: SupabaseClient | null;
    allConfiguredCostCenters: string[];
    clientMetadata: Record<string, ClientMetadata>;
    updateClientMetadata: (cc: string, field: keyof ClientMetadata, value: string) => void;
    addManualClient: () => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
    supabaseUrl, setSupabaseUrl, supabaseKey, setSupabaseKey,
    isConnected, dbLoading, fetchFromSupabase, saveSupabaseConfig, supabaseClient,
    allConfiguredCostCenters, clientMetadata, updateClientMetadata, addManualClient
}) => {
    return (
        <div className="px-10 py-6 max-w-[1000px] mx-auto animate-fade-in pb-20">
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-8">
                 <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-indigo-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                            <Database className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Conexão com Banco de Dados</h3>
                            <p className="text-sm text-slate-500">Configure sua conexão Supabase para salvar dados na nuvem.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isConnected ? (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase rounded-full flex items-center gap-1">
                                <Check className="w-3 h-3" /> Conectado
                            </span>
                        ) : (
                            <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold uppercase rounded-full">
                                Desconectado
                            </span>
                        )}
                    </div>
                 </div>
                 
                 <div className="p-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Supabase URL</label>
                             <input 
                                  type="text" 
                                  value={supabaseUrl}
                                  onChange={(e) => setSupabaseUrl(e.target.value)}
                                  placeholder="https://xyz.supabase.co"
                                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                             />
                         </div>
                         <div>
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Supabase Key (Anon/Public)</label>
                             <input 
                                  type="password" 
                                  value={supabaseKey}
                                  onChange={(e) => setSupabaseKey(e.target.value)}
                                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                             />
                         </div>
                     </div>
                     
                     <div className="mt-6 flex justify-end gap-3">
                         {isConnected && (
                             <button 
                                  onClick={() => supabaseClient && fetchFromSupabase(supabaseClient)}
                                  disabled={dbLoading}
                                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-bold text-xs uppercase tracking-wide transition-colors"
                             >
                                 <RefreshCw className={`w-4 h-4 ${dbLoading ? 'animate-spin' : ''}`} />
                                 Sincronizar Agora
                             </button>
                         )}
                         <button 
                              onClick={saveSupabaseConfig}
                              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wide transition-colors shadow-md hover:shadow-lg"
                         >
                             <Save className="w-4 h-4" />
                             Salvar Conexão
                         </button>
                     </div>
                 </div>
            </div>
  
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                 <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Gestão de Clientes (Centros de Custo)</h3>
                            <p className="text-sm text-slate-500">Configure tipo, categoria e status.</p>
                        </div>
                    </div>
                    
                    <button 
                      onClick={addManualClient}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wide transition-colors shadow-md hover:shadow-lg"
                    >
                        <Plus className="w-4 h-4" />
                        Adicionar
                    </button>
                 </div>
  
                 <div className="p-8 bg-slate-50/30">
                     <div className="grid grid-cols-1 gap-4">
                         {allConfiguredCostCenters.length > 0 ? allConfiguredCostCenters.map(cc => {
                             const meta = clientMetadata[cc] || { category: 'administrative', type: 'private', city: '', company: 'WWS Services' };
                             const isInactive = meta.status === 'inactive';
                             
                             return (
                                 <div 
                                    key={cc} 
                                    className={`p-4 rounded-xl border flex flex-col gap-3 transition-all duration-300 ${isInactive ? 'bg-slate-50 border-slate-200 opacity-75' : 'bg-white border-slate-200 shadow-sm'}`}
                                 >
                                     <div className="flex items-center justify-between">
                                         <div className="flex items-center gap-2 max-w-[40%]">
                                              <div className={`p-1.5 rounded-lg ${isInactive ? 'bg-slate-200 text-slate-400' : 'bg-indigo-50 text-indigo-500'}`}>
                                                  <Building2 className="w-4 h-4" />
                                              </div>
                                              <h4 className={`font-bold text-sm truncate ${isInactive ? 'text-slate-500 line-through' : 'text-slate-800'}`} title={cc}>
                                                  {cc}
                                              </h4>
                                         </div>
                                         
                                         <div className="flex items-center gap-2">
                                             <div className="flex bg-slate-100 p-1 rounded-lg">
                                                  <button 
                                                      onClick={() => updateClientMetadata(cc, 'category', 'client')}
                                                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${meta.category === 'client' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                  >
                                                      Cliente
                                                  </button>
                                                  <button 
                                                      onClick={() => updateClientMetadata(cc, 'category', 'administrative')}
                                                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${meta.category === 'administrative' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                  >
                                                      Administrativo
                                                  </button>
                                             </div>
  
                                             <div className="flex bg-slate-100 p-1 rounded-lg">
                                                  <button 
                                                      onClick={() => updateClientMetadata(cc, 'type', 'public')}
                                                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${meta.type === 'public' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                  >
                                                      Público
                                                  </button>
                                                  <button 
                                                      onClick={() => updateClientMetadata(cc, 'type', 'private')}
                                                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${meta.type === 'private' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                  >
                                                      Privado
                                                  </button>
                                             </div>
                                             
                                             <div className="flex bg-slate-100 p-1 rounded-lg ml-2 border border-slate-200">
                                                  <button 
                                                      onClick={() => updateClientMetadata(cc, 'status', 'active')}
                                                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all flex items-center gap-1 ${(!meta.status || meta.status === 'active') ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                                  >
                                                      Ativo
                                                  </button>
                                                  <button 
                                                      onClick={() => updateClientMetadata(cc, 'status', 'inactive')}
                                                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${meta.status === 'inactive' ? 'bg-slate-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                                  >
                                                      Inativo
                                                  </button>
                                              </div>
                                         </div>
                                     </div>
                                     
                                     <div className={`flex items-center gap-4 pt-2 border-t ${isInactive ? 'border-slate-200' : 'border-slate-50'}`}>
                                         <div className="relative flex-1">
                                              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                              <input 
                                                  type="text" 
                                                  placeholder="Cidade"
                                                  value={meta.city}
                                                  onChange={(e) => updateClientMetadata(cc, 'city', e.target.value)}
                                                  className={`w-full pl-8 pr-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 ${isInactive ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'}`}
                                              />
                                         </div>
                                         
                                         <div className="relative flex-1">
                                              <Briefcase className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                              <select
                                                  value={meta.company || 'WWS Services'}
                                                  onChange={(e) => updateClientMetadata(cc, 'company', e.target.value as Company)}
                                                  className={`w-full pl-8 pr-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 ${isInactive ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'}`}
                                              >
                                                  {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                                              </select>
                                         </div>
                                     </div>
                                 </div>
                             );
                         }) : (
                             <div className="text-center py-10 text-slate-400 text-sm">Nenhum cliente configurado.</div>
                         )}
                     </div>
                 </div>
            </div>
        </div>
    );
};

export default SettingsTab;
