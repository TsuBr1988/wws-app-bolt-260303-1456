
import React, { useState } from 'react';
import { Search, TrendingUp, TrendingDown, X } from 'lucide-react';
import { formatCurrency } from '../../../../utils';

const ClientListModal = ({
    type,
    clients,
    onClose,
    onClientClick
}: {
    type: 'positive' | 'negative';
    clients: { name: string, margin: number }[];
    onClose: () => void;
    onClientClick: (name: string) => void;
}) => {
    const [search, setSearch] = useState('');
    const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl max-h-[80vh] bg-white rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${type === 'positive' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {type === 'positive' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">
                            {type === 'positive' ? 'Clientes com Margem Positiva' : 'Clientes com Margem Negativa'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-4 border-b border-slate-50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar cliente..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {filtered.map((client, i) => (
                        <div 
                            key={i} 
                            onClick={() => onClientClick(client.name)}
                            className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                        >
                            <div className="flex items-center gap-4">
                                <span className="w-6 h-6 flex items-center justify-center bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500 shadow-sm">
                                    {i + 1}
                                </span>
                                <span className="text-sm font-medium text-slate-700">{client.name}</span>
                            </div>
                            <span className={`text-sm font-bold ${client.margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {formatCurrency(client.margin)}
                            </span>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="text-center py-8 text-slate-400 text-sm">Nenhum cliente encontrado.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientListModal;
