import React, { useState } from 'react';
import { X, AlertTriangle, Calendar } from 'lucide-react';
import { ContractSheet } from '../../../types';
import { SupabaseClient } from '@supabase/supabase-js';

interface TerminateSheetModalProps {
    sheet: ContractSheet;
    supabaseClient: SupabaseClient | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const TerminateSheetModal: React.FC<TerminateSheetModalProps> = ({
    sheet,
    supabaseClient,
    onClose,
    onSuccess
}) => {
    const [terminationDate, setTerminationDate] = useState('');
    const [loading, setLoading] = useState(false);

    const handleTerminate = async () => {
        if (!terminationDate) {
            alert('Por favor, informe a data de encerramento.');
            return;
        }

        if (!supabaseClient) {
            alert('ERRO: Cliente Supabase não inicializado!\n\nVerifique a conexão nas configurações.');
            return;
        }

        const confirmed = confirm(
            `ATENÇÃO: Você está prestes a encerrar o contrato.\n\n` +
            `Após a data ${new Date(terminationDate).toLocaleDateString('pt-BR')}, não haverá mais valores orçados.\n\n` +
            `Esta ação não pode ser desfeita facilmente. Deseja continuar?`
        );

        if (!confirmed) return;

        setLoading(true);
        try {
            const { error } = await supabaseClient
                .from('contract_sheets')
                .update({ termination_date: terminationDate })
                .eq('id', sheet.id);

            if (error) {
                console.error('Erro ao encerrar contrato:', error);
                throw error;
            }

            alert('Contrato encerrado com sucesso!');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error terminating contract:', error);
            alert('Erro ao encerrar contrato:\n\n' + (error?.message || 'Erro desconhecido'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
                <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-6 h-6" />
                            <h2 className="text-2xl font-bold">Encerrar Contrato</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <p className="text-rose-100 mt-2">
                        {sheet.client_name}
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-amber-900 mb-2">
                                    Atenção: Esta ação é importante!
                                </h4>
                                <p className="text-sm text-amber-800 leading-relaxed">
                                    Ao encerrar o contrato, nenhum valor orçado será calculado após a data de encerramento.
                                    Use esta função quando o contrato terminar antes do previsto.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            <Calendar className="w-4 h-4 inline mr-2" />
                            Data de Encerramento
                        </label>
                        <input
                            type="date"
                            value={terminationDate}
                            onChange={(e) => setTerminationDate(e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                            min={sheet.start_date}
                        />
                        <p className="text-xs text-slate-600 mt-2">
                            A partir desta data (inclusive), não haverá mais valores orçados para este contrato.
                        </p>
                    </div>
                </div>

                <div className="bg-slate-50 border-t border-slate-200 p-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-slate-700 bg-white hover:bg-slate-100 rounded-xl font-semibold transition-colors border border-slate-200"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleTerminate}
                        disabled={loading || !terminationDate}
                        className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Encerrando...' : 'Confirmar Encerramento'}
                    </button>
                </div>
            </div>
        </div>
    );
};
