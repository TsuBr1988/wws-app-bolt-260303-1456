import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Edit3, Printer } from 'lucide-react';
import { FunctionData } from '../types';
import { GRUPOS_ENCARGOS } from '../constants';
import { moeda } from '../utils';
import { PrintSpreadsheetModal } from './PrintSpreadsheetModal';

interface EncargosGroup {
  g: string;
  i: Array<{ d: string; p: number; isCustomized?: boolean }>;
}

interface ResultsTableProps {
  funcoesDados: FunctionData[];
  issRate: number;
  margemLucro?: number;
  margemAdm?: number;
  encargosComOverrides?: EncargosGroup[];
  budgetNumber?: string;
  clientName?: string;
}

export const ResultsTable = ({ funcoesDados, issRate, margemLucro = 10, margemAdm = 5, encargosComOverrides, budgetNumber, clientName }: ResultsTableProps) => {
  const encargos = encargosComOverrides || GRUPOS_ENCARGOS;
  const [activeView, setActiveView] = useState<'por-funcao' | 'geral'>('por-funcao');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    remuneracao: true,
    grupoA: true,
    grupoB: true,
    grupoC: true,
    grupoD: true,
    grupoE: true,
    grupoF: true,
    intrajornada: true,
    beneficios: true,
    materiais: true,
    bdi: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
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
    const irpj = lucro * 0.15; // 15% sobre o lucro em R$
    const csll = lucro * 0.09; // 9% sobre o lucro em R$

    return [admCentral, lucro, pis, cofins, iss, irpj, csll];
  };

  const totalContrato = funcoesDados.reduce((acc, f) => acc + f.totalComBDI, 0);

  const sumAllFunctions = (getValue: (f: FunctionData) => number) => {
    return funcoesDados.reduce((acc, f) => acc + getValue(f), 0);
  };

  const renderValueCells = (getValue: (f: FunctionData) => number, formatValue?: (val: number, f?: FunctionData) => React.ReactNode) => {
    if (activeView === 'por-funcao') {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4 border-b border-slate-300">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('por-funcao')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeView === 'por-funcao'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
            }`}
          >
            Por Função
          </button>
          <button
            onClick={() => setActiveView('geral')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeView === 'geral'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
            }`}
          >
            Geral
          </button>
        </div>
        <button
          onClick={() => setShowPrintModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 mr-2 mb-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          title="Imprimir planilha"
        >
          <Printer size={18} />
          Impressão Planilha
        </button>
      </div>

      <div className="overflow-x-auto shadow-lg rounded-lg border border-slate-200">
        <table className="w-full text-xs border-collapse bg-white">
          <thead>
            <tr className="bg-blue-700 text-white">
              <th className="border border-slate-300 px-3 py-2 text-left">
                Descrição
              </th>
              <th className="border border-slate-300 px-3 py-2 text-center">
                %
              </th>
              {activeView === 'por-funcao' ? (
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
            <tr className="bg-blue-100 font-bold cursor-pointer hover:bg-blue-200" onClick={() => toggleSection('remuneracao')}>
              <td className="border border-slate-300 px-3 py-2">
                <div className="flex items-center gap-2">
                  {expandedSections.remuneracao ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span>Composição da Remuneração</span>
                </div>
              </td>
              <td className="border border-slate-300 px-3 py-2 text-center">-</td>
              {renderValueCells((f) => [f.s, f.vPeric, f.vInsal, f.vGrat, f.vNot, f.vRed].reduce((sum, val) => sum + (val * f.q), 0))}
            </tr>

            {expandedSections.remuneracao && remunLabels.map((label, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="border border-slate-300 px-3 py-2">{label}</td>
                <td className="border border-slate-300 px-3 py-2 text-center">
                  -
                </td>
                {renderValueCells((f) => [f.s, f.vPeric, f.vInsal, f.vGrat, f.vNot, f.vRed][idx] * f.q)}
              </tr>
            ))}

            {encargos.map((grupo, gIdx) => {
              const sectionKey = `grupo${String.fromCharCode(65 + gIdx)}`;
              return (
              <React.Fragment key={`encargo-${gIdx}`}>
                <tr className="bg-blue-100 font-bold cursor-pointer hover:bg-blue-200" onClick={() => toggleSection(sectionKey)}>
                  <td className="border border-slate-300 px-3 py-2">
                    <div className="flex items-center gap-2">
                      {expandedSections[sectionKey] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span>{grupo.g}</span>
                    </div>
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-center">
                    {(grupo.i.reduce((sum, item) => sum + item.p, 0) * 100).toFixed(4)}%
                  </td>
                  {renderValueCells((f) => grupo.i.reduce((sum, item) => sum + (f.baseCalculoGeral * item.p), 0))}
                </tr>
                {expandedSections[sectionKey] && grupo.i.map((item, iIdx) => (
                  <tr key={`${gIdx}-${iIdx}`} className="hover:bg-slate-50">
                    <td className="border border-slate-300 px-3 py-2">
                      <div className="flex items-center gap-2">
                        {item.d}
                        {item.isCustomized && (
                          <span className="inline-flex items-center gap-1 text-orange-600" title="Valor customizado">
                            <Edit3 size={12} />
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
              </React.Fragment>
            );
            })}

            <tr className="bg-purple-100 font-bold border-t-2 border-purple-400">
              <td className="border border-slate-300 px-3 py-2">
                TOTAL GRUPOS A + B + C + D + E + F
              </td>
              <td className="border border-slate-300 px-3 py-2 text-center font-bold text-purple-700">
                {(encargos.reduce((sum, grupo) =>
                  sum + grupo.i.reduce((gSum, item) => gSum + item.p, 0), 0) * 100).toFixed(4)}%
              </td>
              {renderValueCells((f) =>
                encargos.reduce((sum, grupo) =>
                  sum + grupo.i.reduce((gSum, item) => gSum + (f.baseCalculoGeral * item.p), 0), 0)
              )}
            </tr>

            <tr className="bg-blue-100 font-bold cursor-pointer hover:bg-blue-200" onClick={() => toggleSection('intrajornada')}>
              <td className="border border-slate-300 px-3 py-2">
                <div className="flex items-center gap-2">
                  {expandedSections.intrajornada ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span>Cobertura do Intervalo de Repouso e Alimentação</span>
                </div>
              </td>
              <td className="border border-slate-300 px-3 py-2 text-center">-</td>
              {renderValueCells((f) => f.vIntra * f.q)}
            </tr>
            {expandedSections.intrajornada && <tr className="hover:bg-slate-50">
              <td className="border border-slate-300 px-3 py-2">
                Custo de Reposição Intervalo Intrajornada
              </td>
              <td className="border border-slate-300 px-3 py-2 text-center">
                Variável
              </td>
              {renderValueCells((f) => f.vIntra * f.q)}
            </tr>}

            <tr className="bg-blue-100 font-bold cursor-pointer hover:bg-blue-200" onClick={() => toggleSection('beneficios')}>
              <td className="border border-slate-300 px-3 py-2">
                <div className="flex items-center gap-2">
                  {expandedSections.beneficios ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span>Benefícios Adicionais</span>
                </div>
              </td>
              <td className="border border-slate-300 px-3 py-2 text-center">-</td>
              {renderValueCells((f) => f.beneficios.reduce((sum, benef) => sum + benef.v, 0) + f.beneficiosDiferenciados)}
            </tr>
            {expandedSections.beneficios && funcoesDados[0].beneficios.map((benef, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="border border-slate-300 px-3 py-2">{benef.d}</td>
                <td className="border border-slate-300 px-3 py-2 text-center">
                  -
                </td>
                {renderValueCells((f) => f.beneficios[idx].v)}
              </tr>
            ))}

            {expandedSections.beneficios && <tr className="hover:bg-emerald-50 bg-emerald-50">
              <td className="border border-slate-300 px-3 py-2 font-semibold">
                Benefícios Diferenciados
              </td>
              <td className="border border-slate-300 px-3 py-2 text-center">
                -
              </td>
              {activeView === 'por-funcao' ? (
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
            </tr>}

            <tr className="bg-blue-100 font-bold cursor-pointer hover:bg-blue-200" onClick={() => toggleSection('materiais')}>
              <td className="border border-slate-300 px-3 py-2">
                <div className="flex items-center gap-2">
                  {expandedSections.materiais ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span>Materiais, Capex, equipamentos e uniformes</span>
                </div>
              </td>
              <td className="border border-slate-300 px-3 py-2 text-center">-</td>
              {renderValueCells((f) => f.materiais + f.capex + f.equipamentos + f.uniformes + (f.outros || 0))}
            </tr>
            {expandedSections.materiais && <>
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
            </>}

            <tr className="bg-amber-100 font-bold border-t-2 border-slate-600">
              <td className="border border-slate-300 px-3 py-2">
                TOTAL MENSAL ESTIMADO - SEM BDI
              </td>
              <td className="border border-slate-300 px-3 py-2 text-center">
                -
              </td>
              {renderValueCells((f) => f.totalAcumulado)}
            </tr>

            <tr className="bg-blue-100 font-bold cursor-pointer hover:bg-blue-200" onClick={() => toggleSection('bdi')}>
              <td className="border border-slate-300 px-3 py-2">
                <div className="flex items-center gap-2">
                  {expandedSections.bdi ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span>BDI e Impostos</span>
                </div>
              </td>
              <td className="border border-slate-300 px-3 py-2 text-center">-</td>
              {renderValueCells((f) => {
                const valores = getBdiValores(f);
                return valores.reduce((sum, val) => sum + val, 0);
              })}
            </tr>

            {expandedSections.bdi && [0, 1, 2, 3, 4, 5, 6].map((idx) => (
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

      <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg shadow-lg border-2 border-green-600">
        <h2 className="text-2xl font-bold text-green-800 mb-2">
          TOTAL MENSAL DO CONTRATO: {moeda(totalContrato)}
        </h2>
        <h3 className="text-xl font-semibold text-green-700">
          TOTAL ANUAL DO CONTRATO: {moeda(totalContrato * 12)}
        </h3>
      </div>

      <PrintSpreadsheetModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        funcoesDados={funcoesDados}
        issRate={issRate}
        margemLucro={margemLucro}
        margemAdm={margemAdm}
        encargosComOverrides={encargos}
        viewMode={activeView}
        budgetNumber={budgetNumber}
        clientName={clientName}
      />
    </div>
  );
};
