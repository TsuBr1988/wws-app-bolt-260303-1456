import { useState } from 'react';
import { ChevronDown, ChevronUp, Percent } from 'lucide-react';
import { GRUPOS_ENCARGOS } from '../../../constants';

export const EncargosManager = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const expandAll = () => {
    const allGroups = new Set(GRUPOS_ENCARGOS.map(g => g.g));
    setExpandedGroups(allGroups);
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  const calculateGroupTotal = (group: typeof GRUPOS_ENCARGOS[0]) => {
    return group.i.reduce((sum, item) => sum + item.p, 0);
  };

  const calculateGrandTotal = () => {
    return GRUPOS_ENCARGOS.reduce((sum, group) => sum + calculateGroupTotal(group), 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-slate-800">Encargos Sociais</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-600 hover:text-slate-800 transition-colors p-1"
          title={isExpanded ? 'Recolher' : 'Expandir'}
        >
          {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="flex justify-end gap-2 mb-4">
            <button
              onClick={expandAll}
              className="text-sm px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              Expandir Todos
            </button>
            <button
              onClick={collapseAll}
              className="text-sm px-3 py-1 text-slate-600 hover:bg-slate-100 rounded transition-colors"
            >
              Recolher Todos
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-700 text-white">
                  <th className="border border-slate-300 px-4 py-3 text-left">Grupo / Descrição</th>
                  <th className="border border-slate-300 px-4 py-3 text-center w-32">Percentual</th>
                </tr>
              </thead>
              <tbody>
                {GRUPOS_ENCARGOS.map((group, groupIndex) => {
                  const isGroupExpanded = expandedGroups.has(group.g);
                  const groupTotal = calculateGroupTotal(group);

                  return (
                    <>
                      <tr
                        key={`group-${groupIndex}`}
                        className="bg-blue-100 hover:bg-blue-200 cursor-pointer transition-colors"
                        onClick={() => toggleGroup(group.g)}
                      >
                        <td className="border border-slate-300 px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isGroupExpanded ? (
                              <ChevronUp size={18} className="text-blue-700 flex-shrink-0" />
                            ) : (
                              <ChevronDown size={18} className="text-blue-700 flex-shrink-0" />
                            )}
                            <span className="font-bold text-slate-800">{group.g}</span>
                          </div>
                        </td>
                        <td className="border border-slate-300 px-4 py-3 text-center font-bold text-slate-800">
                          {(groupTotal * 100).toFixed(4)}%
                        </td>
                      </tr>

                      {isGroupExpanded &&
                        group.i.map((item, itemIndex) => (
                          <tr
                            key={`item-${groupIndex}-${itemIndex}`}
                            className={`hover:bg-slate-50 transition-colors ${
                              itemIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                            }`}
                          >
                            <td className="border border-slate-300 px-4 py-2 pl-12 text-slate-700">
                              {item.d}
                            </td>
                            <td className="border border-slate-300 px-4 py-2 text-center text-slate-700 font-mono">
                              {(item.p * 100).toFixed(4)}%
                            </td>
                          </tr>
                        ))}
                    </>
                  );
                })}

                <tr className="bg-purple-100 border-t-4 border-purple-300">
                  <td className="border border-slate-300 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Percent size={18} className="text-purple-700" />
                      <span className="font-bold text-slate-800 text-lg">
                        TOTAL GRUPOS A + B + C + D + E + F
                      </span>
                    </div>
                  </td>
                  <td className="border border-slate-300 px-4 py-3 text-center font-bold text-slate-800 text-lg">
                    {(calculateGrandTotal() * 100).toFixed(4)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="font-semibold mb-2">Sobre os Encargos Sociais:</p>
            <p>
              Os encargos sociais são valores obrigatórios que incidem sobre a folha de pagamento
              e representam os custos trabalhistas além do salário base. Estes valores são
              utilizados automaticamente nos cálculos de orçamentos para determinar o custo real
              de cada funcionário.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
