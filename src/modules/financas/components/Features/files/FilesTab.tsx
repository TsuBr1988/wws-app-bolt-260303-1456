
import React, { useState } from 'react';
import { Building2, Loader2, UploadCloud } from 'lucide-react';
import { BalancesByCompany, Company, FileType, Transaction } from '../../../types';
import { COMPANIES, FILE_SLOTS_CONFIG, getCompanyBadgeClass, getCompanySubtitle, parseFinanceFile } from '../../../utils';
import FileUploadCard from './components/FileUploadCard';
import InitialBalanceModal from './components/InitialBalanceModal';
import { SupabaseClient } from '@supabase/supabase-js';

interface FilesTabProps {
    onFinishProcessing: (transactions: Transaction[], balances: BalancesByCompany) => void;
    isConnected: boolean;
    supabaseClient: SupabaseClient | null;
}

const FilesTab: React.FC<FilesTabProps> = ({ onFinishProcessing, isConnected, supabaseClient }) => {
    const [files, setFiles] = useState<{ [key: string]: File | null }>({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
    const [pendingTransactions, setPendingTransactions] = useState<Transaction[] | null>(null);

    const handleFileUpload = (company: Company, type: FileType, file: File) => {
        setFiles(prev => ({ ...prev, [`${company}-${type}`]: file }));
    };

    const handleFileRemove = (company: Company, type: FileType) => {
        setFiles(prev => {
            const next = { ...prev };
            delete next[`${company}-${type}`];
            return next;
        });
    };

    const processFiles = async () => {
        setIsProcessing(true);
        let allTransactions: Transaction[] = [];

        try {
            const promises: Promise<Transaction[]>[] = [];

            for (const company of COMPANIES) {
                for (const config of FILE_SLOTS_CONFIG) {
                    const key = `${company}-${config.type}`;
                    const file = files[key];
                    if (file) {
                        promises.push(parseFinanceFile(file, company, config.type));
                    }
                }
            }

            const results = await Promise.all(promises);
            allTransactions = results.flat();
            allTransactions.sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());

            setPendingTransactions(allTransactions);
            setIsBalanceModalOpen(true);
            setIsProcessing(false);

        } catch (error) {
            console.error("Error processing files", error);
            alert("Erro ao processar arquivos. Verifique se são arquivos válidos (TXT, CSV, TSV ou Excel).");
            setIsProcessing(false);
        }
    };

    const handleBalanceSubmit = async (balances: BalancesByCompany) => {
        setIsProcessing(true);
        if (pendingTransactions) {
            onFinishProcessing(pendingTransactions, balances);

            if (isConnected && supabaseClient) {
                try {
                    console.log(`🔄 Iniciando processamento de ${pendingTransactions.length} transações...`);

                    await supabaseClient
                        .from('transactions')
                        .delete()
                        .neq('id', 0);

                    console.log('✅ Tabela de transações limpa com sucesso');

                    const dbRows = pendingTransactions.map(t => ({
                        id: t.id,
                        company: t.company,
                        type: t.type,
                        status: t.status,
                        due_date: t.dueDate.toISOString(),
                        payment_date: t.paymentDate?.toISOString(),
                        competency_date: t.competencyDate?.toISOString(),
                        amount: t.amount,
                        description: t.description,
                        category: t.category,
                        cost_center: t.costCenter,
                        original_file: t.originalFile,
                        nome: t.nome || ''
                    }));

                    // Validação de IDs duplicados antes de salvar
                    const idSet = new Set<string>();
                    const duplicates: string[] = [];

                    for (const row of dbRows) {
                        if (idSet.has(row.id)) {
                            duplicates.push(row.id);
                        } else {
                            idSet.add(row.id);
                        }
                    }

                    if (duplicates.length > 0) {
                        console.error(`❌ ERRO: ${duplicates.length} IDs duplicados encontrados:`, duplicates.slice(0, 10));
                        alert(`Erro: ${duplicates.length} IDs duplicados detectados. Os dados não serão salvos.`);
                        return;
                    }

                    console.log(`✅ Validação de IDs: ${dbRows.length} IDs únicos confirmados`);

                    const batchSize = 100;
                    let savedCount = 0;
                    let failedCount = 0;

                    for (let i = 0; i < dbRows.length; i += batchSize) {
                        const batch = dbRows.slice(i, i + batchSize);

                        try {
                            const { error, count } = await supabaseClient
                                .from('transactions')
                                .insert(batch)
                                .select('id', { count: 'exact', head: true });

                            if (error) {
                                console.error(`❌ Erro no batch ${Math.floor(i / batchSize) + 1}:`, error);
                                failedCount += batch.length;

                                // Retry individual rows if batch fails
                                for (const row of batch) {
                                    try {
                                        const { error: retryError } = await supabaseClient
                                            .from('transactions')
                                            .insert(row);

                                        if (retryError) {
                                            console.error(`❌ Falha ao salvar linha individual:`, row.id, retryError);
                                        } else {
                                            savedCount++;
                                            failedCount--;
                                        }
                                    } catch (retryErr) {
                                        console.error(`❌ Erro no retry da linha:`, row.id, retryErr);
                                    }
                                }
                            } else {
                                savedCount += batch.length;
                                console.log(`📦 Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} registros salvos (total: ${savedCount}/${dbRows.length})`);
                            }
                        } catch (batchError) {
                            console.error(`❌ Exceção no batch ${Math.floor(i / batchSize) + 1}:`, batchError);
                            failedCount += batch.length;
                        }
                    }

                    console.log(`\n📊 Resumo do processamento:`);
                    console.log(`   ✅ Salvos com sucesso: ${savedCount}`);
                    console.log(`   ❌ Falhas: ${failedCount}`);
                    console.log(`   📁 Total processado: ${dbRows.length}`);

                    if (failedCount > 0) {
                        alert(`Atenção: ${savedCount} registros salvos com sucesso, mas ${failedCount} falharam. Verifique o console para detalhes.`);
                    }

                    const referenceDate = new Date();
                    referenceDate.setDate(referenceDate.getDate() - 1);
                    const referenceDateStr = referenceDate.toISOString().slice(0, 10);

                    const dailyBalanceRows = [
                        ...COMPANIES.map(company => ({
                            company,
                            reference_date: referenceDateStr,
                            balance: balances[company] ?? 0,
                        }))
                    ];

                    const { error: dailyBalanceError } = await supabaseClient
                        .from('daily_balances')
                        .upsert(dailyBalanceRows);

                    if (dailyBalanceError) {
                        console.error('Erro ao salvar daily_balances', dailyBalanceError);
                    }

                } catch (e) {
                    console.error("Error saving to Supabase", e);
                    alert("Dados exibidos localmente, mas erro ao salvar no banco de dados.");
                }
            }
        }
        setIsBalanceModalOpen(false);
        setIsProcessing(false);
    };

    const handleCloseBalanceModal = () => {
        setIsBalanceModalOpen(false);
        setIsProcessing(false);
        setPendingTransactions(null);
    };

    return (
        <div className="px-10 py-8 animate-fade-in pb-32">

            <h2 className="text-xl font-bold text-slate-900 mb-8">Upload de Arquivos Financeiros</h2>

            <div className="flex flex-col gap-6">
                {COMPANIES.map((company) => {
                    const companyBadgeClass = getCompanyBadgeClass(company);
                    const companySubtitle = getCompanySubtitle(company);

                    return (
                        <div
                            key={company}
                            className="flex flex-col gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${companyBadgeClass}`}>
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">{company}</h3>
                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{companySubtitle}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {FILE_SLOTS_CONFIG.map((slot) => (
                                    <FileUploadCard
                                        key={`${company}-${slot.type}`}
                                        label={slot.label}
                                        description={slot.description}
                                        file={files[`${company}-${slot.type}`] || null}
                                        onUpload={(f) => handleFileUpload(company, slot.type, f)}
                                        onRemove={() => handleFileRemove(company, slot.type)}
                                        colorClass={slot.flow === 'receive' ? 'bg-emerald-500' : 'bg-rose-500'}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Floating Action Bar */}
            <div className="fixed bottom-8 right-10 z-30 flex items-center gap-4">
                {isProcessing && (
                    <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-200 shadow-lg flex items-center gap-3">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                        <span className="text-sm font-bold text-slate-600">Processando dados...</span>
                    </div>
                )}

                <button
                    onClick={processFiles}
                    disabled={isProcessing}
                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-2xl shadow-slate-400/50 hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                >
                    <UploadCloud className="w-5 h-5" />
                    Processar Relatórios
                </button>
            </div>

            <InitialBalanceModal
                isOpen={isBalanceModalOpen}
                onSubmit={handleBalanceSubmit}
                onClose={handleCloseBalanceModal}
                isProcessing={isProcessing}
            />
        </div>
    );
};

export default FilesTab;
