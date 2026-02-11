import React, { useState, useCallback } from 'react';
import { ClipboardList, Users, Calendar } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { TasksDoneChart } from './TasksDoneChart';
import { TaskCard } from './TaskCard';

export const TasksPage: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  // Load active collaborators from prospection_users
  const { data: collaborators = [], loading } = useSupabaseQuery('prospection_users', {
    filter: { active: true },
    orderBy: { column: 'name', ascending: true }
  });

  const handleDataChange = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-700">Carregando Tarefas...</div>
        </div>
      </div>
    );
  }

  // Show only first 3 collaborators for now (as requested: 1 column x 3 rows)
  const visibleCollaborators = collaborators.slice(0, 3);
  const hasMoreCollaborators = collaborators.length > 3;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tarefas</h1>
          <p className="text-gray-600">Gerencie e acompanhe tarefas por colaborador</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
          <Users className="w-4 h-4" />
          <span>{collaborators.length} colaborador{collaborators.length !== 1 ? 'es' : ''} ativo{collaborators.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Chart at top */}
      <TasksDoneChart 
        collaborators={visibleCollaborators} 
        onDataUpdate={handleDataChange}
        key={refreshKey}
      />

      {/* Cards section - 1 column x 3 rows layout */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Colaboradores</h2>
          {hasMoreCollaborators && (
            <div className="text-sm text-gray-500">
              Mostrando 3 de {collaborators.length} colaboradores
            </div>
          )}
        </div>

        {visibleCollaborators.length > 0 ? (
          <div className="space-y-6">
            {visibleCollaborators.map(collaborator => (
              <TaskCard
                key={collaborator.id}
                collaborator={collaborator}
                collaborators={collaborators}
                onDataChange={handleDataChange}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum colaborador ativo</h3>
            <p className="text-gray-500">
              Configure colaboradores na aba "Configurações" → "Funcionários" para começar a gerenciar tarefas
            </p>
          </div>
        )}

        {/* Show more collaborators option */}
        {hasMoreCollaborators && (
          <div className="text-center pt-6">
            <button className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors">
              Ver mais colaboradores ({collaborators.length - 3} restantes)
            </button>
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Como usar o módulo de Tarefas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-blue-800 text-sm">
          <div>
            <p>• <strong>Gráfico superior:</strong> Mostra tarefas concluídas por dia (últimos 30 dias)</p>
            <p>• <strong>Cards por colaborador:</strong> Clique na seta para expandir e ver lista de tarefas</p>
            <p>• <strong>Filtros:</strong> Marque/desmarque status para filtrar tarefas em cada card</p>
          </div>
          <div>
            <p>• <strong>Criar tarefas:</strong> Botão + em cada card para criar nova tarefa</p>
            <p>• <strong>Status:</strong> A fazer → Fazendo → Feito (atualiza gráfico automaticamente)</p>
            <p>• <strong>Prazos:</strong> Destaque automático para tarefas vencidas ou próximas do prazo</p>
          </div>
        </div>
      </div>
    </div>
  );
};