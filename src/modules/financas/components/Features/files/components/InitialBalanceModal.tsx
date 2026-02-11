
import React, { useState } from 'react';
import { Wallet, Save } from 'lucide-react';
import { BalancesByCompany } from '../../../../types';

const InitialBalanceModal = ({
    isOpen,
    onSubmit,
    onClose,
    isProcessing
}: {
    isOpen: boolean;
    onSubmit: (balances: BalancesByCompany) => void;
    onClose: () => void;
    isProcessing: boolean;
}) => {
    const [wwBalance, setWwBalance] = useState('0,00');
    const [wwsBalance, setWwsBalance] = useState('0,00');
    const [twoWsBalance, setTwoWsBalance] = useState('0,00');

    if (!isOpen) return null;

    const handleCurrencyInput = (val: string, setter: (s: string) => void) => {
        let clean = val.replace(/\D/g, '');
        const num = parseFloat(clean) / 100;
        setter(num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    };

    const parseCurrency = (val: string) => {
        return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-200">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 px-3 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                    Fechar
                </button>

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                        <Wallet className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Saldo Inicial</h3>
                    <p className="text-sm text-slate-500 mt-2">Informe o saldo do dia anterior (banco) para conciliação correta do extrato.</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-blue-500 uppercase tracking-wide mb-1.5 block">Worldwide Segurança</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
                            <input 
                                type="text" 
                                value={wwBalance}
                                onChange={(e) => handleCurrencyInput(e.target.value, setWwBalance)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-emerald-500 uppercase tracking-wide mb-1.5 block">WWS Services</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
                            <input 
                                type="text" 
                                value={wwsBalance}
                                onChange={(e) => handleCurrencyInput(e.target.value, setWwsBalance)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-1.5 block">2WS</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
                            <input 
                                type="text" 
                                value={twoWsBalance}
                                onChange={(e) => handleCurrencyInput(e.target.value, setTwoWsBalance)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                            />
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => onSubmit({ 
                        'Worldwide Segurança': parseCurrency(wwBalance), 
                        'WWS Services': parseCurrency(wwsBalance),
                        '2WS': parseCurrency(twoWsBalance),
                    })}
                    disabled={isProcessing}
                    className="w-full mt-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    Salvar e Processar
                </button>

                <button
                    type="button"
                    onClick={onClose}
                    className="w-full mt-3 py-3 bg-slate-50 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-colors"
                >
                    Fechar
                </button>
            </div>
        </div>
    );
};

export default InitialBalanceModal;
