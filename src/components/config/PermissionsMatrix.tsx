import { useState } from 'react';

export type PermissionLevel = 'none' | 'view' | 'edit';

export interface IndicatorPermission {
  page: string;
  indicator_name: string;
  permission_level: PermissionLevel;
}

interface PermissionsMatrixProps {
  permissions: IndicatorPermission[];
  onChange: (permissions: IndicatorPermission[]) => void;
}

const PAGES_AND_INDICATORS = {
  'cultura': [
    'Empréstimo de Livros',
    'Missão, Visão e Valores',
    'Plano Estratégico'
  ],
  'rh': [
    'Headcount',
    'Turnover',
    'Contratado vs Efetivo',
    'Absenteísmo',
    'Rescisões',
    'Ações Trabalhistas',
    'Organograma'
  ],
  'operacional': [
    'FTs',
    'Visitas Supervisor',
    'Visitas Cliente'
  ],
  'comercial_publico': [
    'Dashboard',
    'Licitações',
    'Notificações',
    'Contratos',
    'Comissões',
    'Fundo de Bônus',
    'Desafios',
    'Certidões',
    'Tarefas',
    'Orçamentos',
    'Configurações'
  ],
  'comercial_privado': [
    'Dashboard',
    'Metas Comerciais',
    'Propostas',
    'Prospecção',
    'Marketing',
    'Comissões',
    'Performance Semanal',
    'Fundo de Bônus',
    'Funcionário do Mês',
    'Desafios',
    'Orçamentos',
    'Configurações'
  ],
  'compras': [
    'Uniformes',
    'Material de Limpeza',
    'EPIs',
    'Equipamentos',
    'Combustível',
    'Sem Parar'
  ],
  'financeiro': [
    'Métricas Principais',
    'Faturamento',
    'Resultado Estações',
    'Despesas Administrativas'
  ],
  'financas': [
    'Visão Geral',
    'Extrato',
    'Simulações',
    'Plano de Contas',
    'Fichas de Contratos',
    'KPIs',
    'Importação',
    'Ajustes',
    'Empréstimos'
  ],
  'contracts': [
    'Gestão de Contratos'
  ],
  'atas-acoes': [
    'Gestão de Ações'
  ]
};

const PAGE_LABELS: Record<string, string> = {
  'cultura': 'Cultura',
  'rh': 'RH',
  'operacional': 'Operacional',
  'comercial_publico': 'Comercial Público',
  'comercial_privado': 'Comercial Privado',
  'compras': 'Compras',
  'financeiro': 'Financeiro',
  'financas': 'Finanças',
  'contracts': 'Contratos',
  'atas-acoes': 'Atas e Ações'
};

export function PermissionsMatrix({ permissions, onChange }: PermissionsMatrixProps) {
  const getPermission = (page: string, indicator: string): PermissionLevel => {
    const perm = permissions.find(
      p => p.page === page && p.indicator_name === indicator
    );
    return perm?.permission_level || 'none';
  };

  const setPermission = (page: string, indicator: string, level: PermissionLevel) => {
    const newPermissions = permissions.filter(
      p => !(p.page === page && p.indicator_name === indicator)
    );

    if (level !== 'none') {
      newPermissions.push({ page, indicator_name: indicator, permission_level: level });
    }

    onChange(newPermissions);
  };

  const setPagePermission = (page: string, level: PermissionLevel) => {
    const indicators = PAGES_AND_INDICATORS[page as keyof typeof PAGES_AND_INDICATORS] || [];
    const otherPagePermissions = permissions.filter(p => p.page !== page);

    const newPagePermissions = level === 'none'
      ? []
      : indicators.map(indicator => ({
          page,
          indicator_name: indicator,
          permission_level: level
        }));

    onChange([...otherPagePermissions, ...newPagePermissions]);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 min-w-[200px]">
                Página / Indicador
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700 w-32">
                Não Visualizar
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700 w-32">
                Observar
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700 w-32">
                Editar
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(PAGES_AND_INDICATORS).map(([page, indicators]) => (
              <>
                <tr key={page} className="bg-blue-50 border-b border-blue-100">
                  <td className="px-4 py-3 font-semibold text-blue-900">
                    {PAGE_LABELS[page] || page}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setPagePermission(page, 'none')}
                      className="text-xs px-3 py-1 rounded bg-white hover:bg-gray-100 border"
                    >
                      Todos
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setPagePermission(page, 'view')}
                      className="text-xs px-3 py-1 rounded bg-white hover:bg-gray-100 border"
                    >
                      Todos
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setPagePermission(page, 'edit')}
                      className="text-xs px-3 py-1 rounded bg-white hover:bg-gray-100 border"
                    >
                      Todos
                    </button>
                  </td>
                </tr>
                {indicators.map((indicator) => {
                  const currentLevel = getPermission(page, indicator);
                  return (
                    <tr key={`${page}-${indicator}`} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 pl-8 text-gray-700">
                        {indicator}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="radio"
                          name={`${page}-${indicator}`}
                          checked={currentLevel === 'none'}
                          onChange={() => setPermission(page, indicator, 'none')}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="radio"
                          name={`${page}-${indicator}`}
                          checked={currentLevel === 'view'}
                          onChange={() => setPermission(page, indicator, 'view')}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="radio"
                          name={`${page}-${indicator}`}
                          checked={currentLevel === 'edit'}
                          onChange={() => setPermission(page, indicator, 'edit')}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>
                    </tr>
                  );
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
