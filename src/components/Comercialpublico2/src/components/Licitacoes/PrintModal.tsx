import React from 'react';
import { X, Printer } from 'lucide-react';
import { Licitacao } from '../../types';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { formatCurrency } from '../../utils/formatCurrency';

interface PrintModalProps {
  licitacoes: Licitacao[];
  onClose: () => void;
}

export const PrintModal: React.FC<PrintModalProps> = ({ licitacoes, onClose }) => {
  const { data: employees = [] } = useSupabaseQuery('employees');

  const formatPercent = (value?: number) => {
    if (value == null) return '-';
    if (!Number.isFinite(value)) return '-';
    return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
  };

  // Filtrar apenas licitações Em andamento ou Aguardando
  const licitacoesParaImprimir = licitacoes.filter(
    l => l.situacao === 'Em andamento' || l.situacao === 'Aguardando'
  );

  // Função para obter cor da linha baseado no licitante
  const getRowColor = (licitacaoId: string) => {
    const licitacao = licitacoesParaImprimir.find(l => l.licitanteId === licitacaoId);
    if (!licitacao) return '';

    const closer = employees.find(emp => emp.id === licitacao.licitanteId);
    if (!closer) return '';

    // Douglas = Verde, Nicoly = Rosa
    if (closer.name.toLowerCase().includes('douglas')) {
      return 'bg-green-100 print:bg-green-100';
    }
    if (closer.name.toLowerCase().includes('nicoly')) {
      return 'bg-pink-100 print:bg-pink-100';
    }
    return '';
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header - Ocultar na impressão */}
        <div className="print:hidden flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Imprimir Licitações</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Título para impressão */}
          <div className="hidden print:block mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Licitações - Em Andamento e Aguardando</h1>
            <p className="text-sm text-gray-600">
              Data de impressão: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>

          {licitacoesParaImprimir.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Cliente
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Situação
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Próxima Ação
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      Nosso Lance
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900">
                      Margem lucro
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900">
                      Margem adm
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900">
                      Colocação
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {licitacoesParaImprimir.map((licitacao) => {
                    const closer = employees.find(emp => emp.id === licitacao.licitanteId);
                    let rowColorClass = '';

                    if (closer) {
                      if (closer.name.toLowerCase().includes('douglas')) {
                        rowColorClass = 'bg-green-100';
                      } else if (closer.name.toLowerCase().includes('nicoly')) {
                        rowColorClass = 'bg-pink-100';
                      }
                    }

                    return (
                      <tr key={licitacao.id} className={rowColorClass}>
                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                          <div className="font-medium">{licitacao.orgao}</div>
                          {licitacao.numeroPregao && (
                            <div className="text-xs text-gray-600">
                              Pregão: {licitacao.numeroPregao}
                            </div>
                          )}
                          {closer && (
                            <div className="text-xs text-gray-600 mt-1">
                              Licitante: {closer.name}
                            </div>
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            licitacao.situacao === 'Em andamento'
                              ? 'bg-blue-100 text-blue-800'
                              : licitacao.situacao === 'Aguardando'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {licitacao.situacao}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                          {licitacao.dataProximaAcao ? (
                            <div>
                              <div className="font-medium">
                                {new Date(licitacao.dataProximaAcao).toLocaleDateString('pt-BR')}
                              </div>
                              {licitacao.proximaAcaoTexto && (
                                <div className="text-xs text-gray-600 mt-1">
                                  {licitacao.proximaAcaoTexto}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">Não definida</span>
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 text-right font-medium">
                          {licitacao.nossoLance
                            ? formatCurrency(licitacao.nossoLance)
                            : formatCurrency(licitacao.valorEstimado || 0)
                          }
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 text-center">
                          {formatPercent(licitacao.margemLucro)}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 text-center">
                          {formatPercent(licitacao.margemAdm)}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 text-center">
                          {licitacao.colocacaoAtual || licitacao.posicaoAtual ? (
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                              (licitacao.colocacaoAtual || licitacao.posicaoAtual) === '1º'
                                ? 'bg-yellow-200 text-yellow-900'
                                : (licitacao.colocacaoAtual || licitacao.posicaoAtual) === '2º'
                                ? 'bg-gray-200 text-gray-900'
                                : (licitacao.colocacaoAtual || licitacao.posicaoAtual) === '3º'
                                ? 'bg-orange-200 text-orange-900'
                                : 'bg-blue-100 text-blue-900'
                            }`}>
                              {licitacao.colocacaoAtual || licitacao.posicaoAtual}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">
                Nenhuma licitação em andamento ou aguardando para imprimir.
              </p>
            </div>
          )}

          {/* Legenda */}
          {licitacoesParaImprimir.length > 0 && (
            <div className="mt-6 flex items-center gap-6 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 border border-green-300 rounded"></div>
                <span className="text-sm text-gray-700">Douglas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-pink-100 border border-pink-300 rounded"></div>
                <span className="text-sm text-gray-700">Nicoly</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSS para impressão */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:hidden, .print\\:hidden * {
            display: none !important;
          }
          .fixed > .bg-white,
          .fixed > .bg-white * {
            visibility: visible;
          }
          .fixed > .bg-white {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-height: none;
            overflow: visible;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          .bg-green-100 {
            background-color: #d1fae5 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .bg-pink-100 {
            background-color: #fce7f3 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .bg-blue-100 {
            background-color: #dbeafe !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .bg-yellow-100 {
            background-color: #fef3c7 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .bg-yellow-200 {
            background-color: #fde68a !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .bg-gray-200 {
            background-color: #e5e7eb !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .bg-orange-200 {
            background-color: #fed7aa !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};
