import { X, Printer } from 'lucide-react';
import { FunctionData } from '../types';
import { moeda } from '../utils';
import { ChevronDown } from 'lucide-react';

interface EncargosGroup {
  g: string;
  i: Array<{ d: string; p: number; isCustomized?: boolean }>;
}

interface PrintSpreadsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  funcoesDados: FunctionData[];
  issRate: number;
  margemLucro: number;
  margemAdm: number;
  encargosComOverrides: EncargosGroup[];
  viewMode: 'por-funcao' | 'geral';
  budgetNumber?: string;
  clientName?: string;
}

export const PrintSpreadsheetModal = ({
  isOpen,
  onClose,
  funcoesDados,
  issRate,
  margemLucro,
  margemAdm,
  encargosComOverrides,
  viewMode,
  budgetNumber,
  clientName,
}: PrintSpreadsheetModalProps) => {
  if (!isOpen) return null;

  const remunLabels = [
    'Salário Base Mensal',
    'Adicional de Periculosidade',
    'Adicional de Insalubridade',
    'Gratificação de Função',
    'Adicional Noturno',
    'Hora noturna adicional',
  ];

  const getBdiPercs = (f: FunctionData) => [margemAdm / 100, margemLucro / 100, 0.0065, 0.03, (f.issRate ?? issRate) / 100];

  const getBdiValores = (f: FunctionData) => {
    const bdiPercs = getBdiPercs(f);
    const admCentral = f.totalComBDI * bdiPercs[0];
    const lucro = f.totalComBDI * bdiPercs[1];
    const pis = f.totalComBDI * bdiPercs[2];
    const cofins = f.totalComBDI * bdiPercs[3];
    const iss = f.totalComBDI * bdiPercs[4];
    const irpj = lucro * 0.15;
    const csll = lucro * 0.09;

    return [admCentral, lucro, pis, cofins, iss, irpj, csll];
  };

  const totalContrato = funcoesDados.reduce((acc, f) => acc + f.totalComBDI, 0);

  const sumAllFunctions = (getValue: (f: FunctionData) => number) => {
    return funcoesDados.reduce((acc, f) => acc + getValue(f), 0);
  };

  const renderValueCells = (getValue: (f: FunctionData) => number, formatValue?: (val: number, f?: FunctionData) => React.ReactNode) => {
    if (viewMode === 'por-funcao') {
      return funcoesDados.map((f) => {
        const val = getValue(f);
        return (
          <td key={f.id} className="border border-slate-300 px-3 py-2 text-right">
            {formatValue ? formatValue(val, f) : moeda(val)}
          </td>
        );
      });
    } else {
      const total = sumAllFunctions(getValue);
      return (
        <td className="border border-slate-300 px-3 py-2 text-right">
          {formatValue ? formatValue(total) : moeda(total)}
        </td>
      );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 0.5cm;
          }

          body {
            margin: 0;
            padding: 0;
          }

          body * {
            visibility: hidden !important;
          }

          #print-spreadsheet-content,
          #print-spreadsheet-content * {
            visibility: visible !important;
          }

          #print-spreadsheet-content {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 10px !important;
            overflow: visible !important;
            transform: none !important;
            z-index: 99999 !important;
          }

          .no-print {
            display: none !important;
          }

          /* Garantir que cores de fundo sejam impressas */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* Evitar quebras de página indesejadas */
          table {
            page-break-inside: auto;
            width: 100% !important;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          thead {
            display: table-header-group;
          }

          tbody {
            display: table-row-group;
          }

          /* Cores de fundo específicas */
          .bg-blue-700 {
            background-color: #1d4ed8 !important;
          }

          .bg-blue-100 {
            background-color: #dbeafe !important;
          }

          .bg-blue-200 {
            background-color: #bfdbfe !important;
          }

          .bg-purple-100 {
            background-color: #f3e8ff !important;
          }

          .bg-amber-100 {
            background-color: #fef3c7 !important;
          }

          .bg-emerald-50 {
            background-color: #ecfdf5 !important;
          }

          .bg-green-50 {
            background-color: #f0fdf4 !important;
          }

          .bg-green-100 {
            background-color: #dcfce7 !important;
          }

          .text-white {
            color: #ffffff !important;
          }

          .text-green-800 {
            color: #166534 !important;
          }

          .text-green-700 {
            color: #15803d !important;
          }

          .text-purple-700 {
            color: #7e22ce !important;
          }

          .text-orange-600 {
            color: #ea580c !important;
          }

          .text-emerald-600 {
            color: #059669 !important;
          }

          /* Bordas */
          .border-slate-300 {
            border-color: #cbd5e1 !important;
          }

          .border-purple-400 {
            border-color: #c084fc !important;
          }

          .border-slate-600 {
            border-color: #475569 !important;
          }

          .border-green-600 {
            border-color: #16a34a !important;
          }

          .border-t-2 {
            border-top-width: 2px !important;
          }

          .border-2 {
            border-width: 2px !important;
          }

          /* Garantir que backgrounds gradient sejam visíveis */
          .from-green-50 {
            background: #ecfdf5 !important;
          }

          .to-green-100 {
            background: #dcfce7 !important;
          }

          .bg-gradient-to-r {
            background: linear-gradient(to right, #ecfdf5, #dcfce7) !important;
          }

          /* Garantir que textos sejam visíveis */
          h1, h2, h3, p, td, th, span {
            color: inherit !important;
          }

          /* Garantir espaçamentos */
          .mb-1 { margin-bottom: 0.25rem !important; }
          .mb-2 { margin-bottom: 0.5rem !important; }
          .mb-4 { margin-bottom: 1rem !important; }
          .mb-6 { margin-bottom: 1.5rem !important; }
          .mt-1 { margin-top: 0.25rem !important; }
          .mt-2 { margin-top: 0.5rem !important; }
          .mt-6 { margin-top: 1.5rem !important; }
          .p-6 { padding: 1.5rem !important; }
          .px-3 { padding-left: 0.75rem !important; padding-right: 0.75rem !important; }
          .py-2 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }

          /* Tamanhos de fonte */
          .text-xs { font-size: 0.75rem !important; }
          .text-sm { font-size: 0.875rem !important; }
          .text-base { font-size: 1rem !important; }
          .text-lg { font-size: 1.125rem !important; }
          .text-xl { font-size: 1.25rem !important; }
          .text-2xl { font-size: 1.5rem !important; }
        }
      `}</style>

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm no-print">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header - não imprime */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 no-print">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-md">
                <Printer className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Imprimir Planilha de Custos</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Visualização: <span className="font-semibold">{viewMode === 'por-funcao' ? 'Por Função' : 'Geral'}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Fechar"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>

          {/* Botões de ação - não imprime */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 no-print">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Clique em <strong>Imprimir</strong> para gerar o documento
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <Printer size={20} />
                  Imprimir
                </button>
              </div>
            </div>
          </div>

          {/* Conteúdo da impressão */}
          <div className="flex-1 overflow-auto p-6">
            <div id="print-spreadsheet-content" style={{ backgroundColor: 'white' }}>
              {/* Cabeçalho da impressão */}
              <div className="mb-4" style={{ pageBreakAfter: 'avoid' }}>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Planilha de Custos do Orçamento</h1>
                {budgetNumber && (
                  <p className="text-base text-gray-700">
                    <span className="font-semibold">Orçamento:</span> {budgetNumber}
                  </p>
                )}
                {clientName && (
                  <p className="text-base text-gray-700">
                    <span className="font-semibold">Cliente:</span> {clientName}
                  </p>
                )}
                <p className="text-xs text-gray-600 mt-1">
                  <span className="font-semibold">Data de impressão:</span> {new Date().toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">Visualização:</span> {viewMode === 'por-funcao' ? 'Por Função' : 'Geral'}
                </p>
              </div>

              {/* Tabela da planilha */}
              <div className="overflow-x-auto shadow-lg rounded-lg border border-slate-200" style={{ pageBreakInside: 'auto' }}>
                <table className="w-full text-xs border-collapse bg-white" style={{ tableLayout: 'auto' }}>
                  <thead>
                    <tr className="bg-blue-700 text-white">
                      <th className="border border-slate-300 px-3 py-2 text-left">
                        Descrição
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-center">
                        %
                      </th>
                      {viewMode === 'por-funcao' ? (
                        funcoesDados.map((f) => (
                          <th
                            key={f.id}
                            className="border border-slate-300 px-3 py-2 text-right"
                          >
                            {f.nome}
                          </th>
                        ))
                      ) : (
                        <th className="border border-slate-300 px-3 py-2 text-right">
                          Geral
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Composição da Remuneração */}
                    <tr className="bg-blue-100 font-bold">
                      <td className="border border-slate-300 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <ChevronDown size={16} />
                          <span>Composição da Remuneração</span>
                        </div>
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-center">-</td>
                      {renderValueCells((f) => [f.s, f.vPeric, f.vInsal, f.vGrat, f.vNot, f.vRed].reduce((sum, val) => sum + (val * f.q), 0))}
                    </tr>

                    {remunLabels.map((label, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="border border-slate-300 px-3 py-2">{label}</td>
                        <td className="border border-slate-300 px-3 py-2 text-center">
                          -
                        </td>
                        {renderValueCells((f) => [f.s, f.vPeric, f.vInsal, f.vGrat, f.vNot, f.vRed][idx] * f.q)}
                      </tr>
                    ))}

                    {/* Grupos de Encargos */}
                    {encargosComOverrides.map((grupo, gIdx) => (
                      <>
                        <tr key={`grupo-${gIdx}`} className="bg-blue-100 font-bold">
                          <td className="border border-slate-300 px-3 py-2">
                            <div className="flex items-center gap-2">
                              <ChevronDown size={16} />
                              <span>{grupo.g}</span>
                            </div>
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-center">
                            {(grupo.i.reduce((sum, item) => sum + item.p, 0) * 100).toFixed(4)}%
                          </td>
                          {renderValueCells((f) => grupo.i.reduce((sum, item) => sum + (f.baseCalculoGeral * item.p), 0))}
                        </tr>
                        {grupo.i.map((item, iIdx) => (
                          <tr key={`${gIdx}-${iIdx}`} className="hover:bg-slate-50">
                            <td className="border border-slate-300 px-3 py-2">
                              <div className="flex items-center gap-2">
                                {item.d}
                                {item.isCustomized && (
                                  <span className="inline-flex items-center gap-1 text-orange-600 text-[10px]" title="Valor customizado">
                                    ⚙️
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className={`border border-slate-300 px-3 py-2 text-center ${item.isCustomized ? 'text-orange-600 font-semibold' : ''}`}>
                              {(item.p * 100).toFixed(4)}%
                            </td>
                            {renderValueCells((f) => f.baseCalculoGeral * item.p)}
                          </tr>
                        ))}
                      </>
                    ))}

                    {/* Total Grupos */}
                    <tr className="bg-purple-100 font-bold border-t-2 border-purple-400">
                      <td className="border border-slate-300 px-3 py-2">
                        TOTAL GRUPOS A + B + C + D + E + F
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-center font-bold text-purple-700">
                        {(encargosComOverrides.reduce((sum, grupo) =>
                          sum + grupo.i.reduce((gSum, item) => gSum + item.p, 0), 0) * 100).toFixed(4)}%
                      </td>
                      {renderValueCells((f) =>
                        encargosComOverrides.reduce((sum, grupo) =>
                          sum + grupo.i.reduce((gSum, item) => gSum + (f.baseCalculoGeral * item.p), 0), 0)
                      )}
                    </tr>

                    {/* Intrajornada */}
                    <tr className="bg-blue-100 font-bold">
                      <td className="border border-slate-300 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <ChevronDown size={16} />
                          <span>Cobertura do Intervalo de Repouso e Alimentação</span>
                        </div>
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-center">-</td>
                      {renderValueCells((f) => f.vIntra * f.q)}
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="border border-slate-300 px-3 py-2">
                        Custo de Reposição Intervalo Intrajornada
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-center">
                        Variável
                      </td>
                      {renderValueCells((f) => f.vIntra * f.q)}
                    </tr>

                    {/* Benefícios */}
                    <tr className="bg-blue-100 font-bold">
                      <td className="border border-slate-300 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <ChevronDown size={16} />
                          <span>Benefícios Adicionais</span>
                        </div>
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-center">-</td>
                      {renderValueCells((f) => f.beneficios.reduce((sum, benef) => sum + benef.v, 0) + f.beneficiosDiferenciados)}
                    </tr>
                    {funcoesDados[0].beneficios.map((benef, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="border border-slate-300 px-3 py-2">{benef.d}</td>
                        <td className="border border-slate-300 px-3 py-2 text-center">
                          -
                        </td>
                        {renderValueCells((f) => f.beneficios[idx].v)}
                      </tr>
                    ))}

                    <tr className="hover:bg-emerald-50 bg-emerald-50">
                      <td className="border border-slate-300 px-3 py-2 font-semibold">
                        Benefícios Diferenciados
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-center">
                        -
                      </td>
                      {viewMode === 'por-funcao' ? (
                        funcoesDados.map((f) => (
                          <td
                            key={f.id}
                            className="border border-slate-300 px-3 py-2 text-right font-semibold text-emerald-600"
                          >
                            {moeda(f.beneficiosDiferenciados)}
                          </td>
                        ))
                      ) : (
                        <td className="border border-slate-300 px-3 py-2 text-right font-semibold text-emerald-600">
                          {moeda(sumAllFunctions((f) => f.beneficiosDiferenciados))}
                        </td>
                      )}
                    </tr>

                    {/* Materiais, Capex, Equipamentos, Uniformes */}
                    <tr className="bg-blue-100 font-bold">
                      <td className="border border-slate-300 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <ChevronDown size={16} />
                          <span>Materiais, Capex, equipamentos e uniformes</span>
                        </div>
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-center">-</td>
                      {renderValueCells((f) => f.materiais + f.capex + f.equipamentos + f.uniformes + (f.outros || 0))}
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="border border-slate-300 px-3 py-2">Materiais de consumo</td>
                      <td className="border border-slate-300 px-3 py-2 text-center">
                        -
                      </td>
                      {renderValueCells((f) => f.materiais)}
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="border border-slate-300 px-3 py-2">Capex</td>
                      <td className="border border-slate-300 px-3 py-2 text-center">
                        -
                      </td>
                      {renderValueCells((f) => f.capex)}
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="border border-slate-300 px-3 py-2">Equipamentos</td>
                      <td className="border border-slate-300 px-3 py-2 text-center">
                        -
                      </td>
                      {renderValueCells((f) => f.equipamentos)}
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="border border-slate-300 px-3 py-2">Uniformes</td>
                      <td className="border border-slate-300 px-3 py-2 text-center">
                        -
                      </td>
                      {renderValueCells((f) => f.uniformes)}
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="border border-slate-300 px-3 py-2">Outros</td>
                      <td className="border border-slate-300 px-3 py-2 text-center">
                        -
                      </td>
                      {renderValueCells((f) => f.outros || 0)}
                    </tr>

                    {/* Total sem BDI */}
                    <tr className="bg-amber-100 font-bold border-t-2 border-slate-600">
                      <td className="border border-slate-300 px-3 py-2">
                        TOTAL MENSAL ESTIMADO - SEM BDI
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-center">
                        -
                      </td>
                      {renderValueCells((f) => f.totalAcumulado)}
                    </tr>

                    {/* BDI e Impostos */}
                    <tr className="bg-blue-100 font-bold">
                      <td className="border border-slate-300 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <ChevronDown size={16} />
                          <span>BDI e Impostos</span>
                        </div>
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-center">-</td>
                      {renderValueCells((f) => {
                        const valores = getBdiValores(f);
                        return valores.reduce((sum, val) => sum + val, 0);
                      })}
                    </tr>

                    {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="border border-slate-300 px-3 py-2">
                          {idx === 0 && `Adm. Central (${margemAdm.toFixed(2)}%)`}
                          {idx === 1 && `Previsão de Lucro (${margemLucro.toFixed(2)}%)`}
                          {idx === 2 && 'PIS (0.65%)'}
                          {idx === 3 && 'COFINS (3%)'}
                          {idx === 4 && 'ISSQN'}
                          {idx === 5 && 'IRPJ (15% do Lucro)'}
                          {idx === 6 && 'CSLL (9% do Lucro)'}
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-center">
                          {idx === 4 ? 'Variável' : '-'}
                        </td>
                        {renderValueCells((f) => {
                          const valores = getBdiValores(f);
                          return valores[idx];
                        }, (val, f) => {
                          if (idx === 4 && f) {
                            const funcaoIssRate = f.issRate ?? issRate;
                            return (
                              <div className="flex flex-col">
                                <span className="text-[10px] text-slate-600 font-semibold">
                                  ({funcaoIssRate.toFixed(2)}%)
                                </span>
                                <span>{moeda(val)}</span>
                              </div>
                            );
                          }
                          return moeda(val);
                        })}
                      </tr>
                    ))}

                    {/* Total com BDI */}
                    <tr className="bg-blue-200 font-bold text-sm">
                      <td className="border border-slate-300 px-3 py-2">
                        TOTAL MENSAL ESTIMADO (= TOTAL SEM BDI + BDI)
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-center">
                        -
                      </td>
                      {renderValueCells((f) => f.totalComBDI)}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total do Contrato */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg shadow-lg border-2 border-green-600 mt-6" style={{ pageBreakInside: 'avoid', pageBreakBefore: 'auto' }}>
                <h2 className="text-2xl font-bold text-green-800 mb-2">
                  TOTAL MENSAL DO CONTRATO: {moeda(totalContrato)}
                </h2>
                <h3 className="text-xl font-semibold text-green-700">
                  TOTAL ANUAL DO CONTRATO: {moeda(totalContrato * 12)}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
