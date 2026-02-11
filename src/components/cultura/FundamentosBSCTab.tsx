import { useState, useEffect } from 'react';
import { DashboardService } from '@/services/dashboardService';
import { BscFoundation } from '@/types/database';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Edit2, Save, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function FundamentosBSCTab() {
  const { toast } = useToast();
  const { canEditIndicator } = useAuth();
  const [loading, setLoading] = useState(true);
  const [foundation, setFoundation] = useState<BscFoundation[]>([]);
  const [editingFoundation, setEditingFoundation] = useState<Record<string, string>>({});
  const [editingFoundationId, setEditingFoundationId] = useState<string | null>(null);

  const canEdit = canEditIndicator('BSC', 'Fundamentos BSC');

  const loadData = async () => {
    setLoading(true);
    try {
      const foundationResult = await DashboardService.getBscFoundation();
      setFoundation(foundationResult);

      const editingMap: Record<string, string> = {};
      foundationResult.forEach(item => {
        editingMap[item.id] = item.content;
      });
      setEditingFoundation(editingMap);
    } catch (error) {
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os fundamentos BSC.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditFoundation = (item: BscFoundation) => {
    setEditingFoundationId(item.id);
    setEditingFoundation({
      ...editingFoundation,
      [item.id]: item.content
    });
  };

  const handleCancelEditFoundation = () => {
    setEditingFoundationId(null);
  };

  const handleSaveFoundation = async (id: string) => {
    try {
      await DashboardService.updateBscFoundation(id, editingFoundation[id]);
      await loadData();
      setEditingFoundationId(null);

      toast({
        title: 'Sucesso',
        description: 'Campo atualizado com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o campo.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="gradient-tecnologia p-2 rounded-lg shadow-md">
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-brand-dark">Definições e diretrizes BSC</h3>
      </div>
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <tbody>
              {foundation.map((item) => (
                <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 font-semibold text-brand-dark bg-gradient-to-br from-gray-50 to-gray-100 w-64 border-r border-gray-200">
                    {item.field_name}
                  </td>
                  <td className="py-4 px-4">
                    {canEdit && editingFoundationId === item.id ? (
                      <div className="flex gap-2 items-start">
                        <textarea
                          className="flex-1 px-3 py-2 border-2 border-gray-300 focus:border-gray-400 rounded-lg min-h-[80px] resize-y transition-colors"
                          value={editingFoundation[item.id] || ''}
                          onChange={(e) => setEditingFoundation({
                            ...editingFoundation,
                            [item.id]: e.target.value
                          })}
                          placeholder={`Descreva ${item.field_name.toLowerCase()} da empresa...`}
                          autoFocus
                        />
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveFoundation(item.id)}
                            disabled={!editingFoundation[item.id]?.trim() || editingFoundation[item.id] === item.content}
                            className="gradient-tecnologia hover:opacity-90 text-white shadow-md"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEditFoundation}
                            className="border-2 hover:bg-gray-100"
                          >
                            ✕
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 items-start">
                        <div className="flex-1 text-gray-700 whitespace-pre-wrap">
                          {item.content || <span className="text-gray-400 italic">Clique em editar para adicionar conteúdo...</span>}
                        </div>
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditFoundation(item)}
                            className="border-2 hover:border-gray-400 hover:shadow-md transition-all"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
