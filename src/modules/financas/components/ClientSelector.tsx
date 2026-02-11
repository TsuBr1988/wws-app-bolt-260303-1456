import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { SupabaseClient } from '@supabase/supabase-js';

interface Client {
    cost_center: string;
    category: string;
    type: string;
    city: string;
    company: string;
    status: string;
}

interface ClientSelectorProps {
    value: string;
    onChange: (clientName: string) => void;
    supabaseClient: SupabaseClient | null;
    placeholder?: string;
    className?: string;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({
    value,
    onChange,
    supabaseClient,
    placeholder = 'Selecione ou digite o cliente',
    className = ''
}) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [search, setSearch] = useState(value);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSearch(value);
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        fetchClients();
    }, [supabaseClient]);

    const fetchClients = async () => {
        if (!supabaseClient) return;

        setLoading(true);
        try {
            const { data, error } = await supabaseClient
                .from('client_metadata')
                .select('*')
                .eq('status', 'active')
                .order('cost_center');

            if (error) throw error;

            setClients(data || []);
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(client => {
        if (!search.trim()) return true;
        const query = search.toLowerCase();
        return (
            (client.cost_center || '').toLowerCase().includes(query) ||
            (client.company || '').toLowerCase().includes(query) ||
            (client.city || '').toLowerCase().includes(query) ||
            (client.category || '').toLowerCase().includes(query) ||
            (client.type || '').toLowerCase().includes(query)
        );
    });

    const handleSelectClient = (client: Client) => {
        const clientName = client.cost_center || '';
        setSearch(clientName);
        onChange(clientName);
        setIsOpen(false);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setSearch(newValue);
        onChange(newValue);
        setIsOpen(true);
    };

    const handleInputClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(true);
    };

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                    type="text"
                    value={search}
                    onChange={handleSearchChange}
                    onFocus={() => setIsOpen(true)}
                    onClick={handleInputClick}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                    autoComplete="off"
                />
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {isOpen && (
                <div className="absolute z-[70] w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-slate-500 text-sm">
                            Carregando clientes...
                        </div>
                    ) : filteredClients.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-sm space-y-2">
                            <p>Nenhum cliente encontrado</p>
                            {search.trim() && (
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 transition-colors"
                                >
                                    Usar "{search}"
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="py-2">
                            {filteredClients.map(client => (
                                <button
                                    key={client.cost_center}
                                    type="button"
                                    onClick={() => handleSelectClient(client)}
                                    className="w-full px-4 py-2.5 hover:bg-slate-50 transition-colors text-left flex items-start justify-between group"
                                >
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">
                                            {client.cost_center || 'Sem nome'}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {client.company && (
                                                <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-bold">
                                                    {client.company}
                                                </span>
                                            )}
                                            {client.type && (
                                                <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded font-bold">
                                                    {client.type}
                                                </span>
                                            )}
                                            {client.category && (
                                                <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded font-bold">
                                                    {client.category}
                                                </span>
                                            )}
                                            {client.city && (
                                                <span className="text-xs text-slate-500">
                                                    {client.city}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ClientSelector;
