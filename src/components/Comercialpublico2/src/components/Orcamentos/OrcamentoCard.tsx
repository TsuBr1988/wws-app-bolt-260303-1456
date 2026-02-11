import React from 'react';
import { Edit, Trash2, Eye, Calendar, DollarSign, FileText, User } from 'lucide-react';

interface OrcamentoItem {
  id: string;
  funcao: string;
  salario: number;
  custos: {
    id: string;
    descricao: string;
    valor: number;
  }[];
}

interface Orcamento {
  id: string;
  numero: string;
  cliente: string;
  itens: OrcamentoItem[];
  valor_total: number;
  data_criacao: string;
  data_validade: string;
  status: 'rascunho' | 'enviado' | 'aprovado' | 'rejeitado' | 'revisao';
  observacoes?: string;
  criado_por: string;
  department: string;
  created_at: string;
  updated_at: string;
}

interface OrcamentoCardProps {
  orcamento: Orcamento;
  onEdit?: (orcamento: Orcamento) => void;
  onDelete?: (orcamentoId: string) => void;
  readOnly?: boolean;
}

export const OrcamentoCard: React.FC<OrcamentoCardProps> = ({
  orcamento,
  onEdit,
  onDelete,
  readOnly = false
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rascunho': return 'bg-gray-100 text-gray-800';
      case 'enviado': return 'bg-blue-100 text-blue-800';
      case 'aprovado': return 'bg-green-100 text-green-800';
      case 'rejeitado': return 'bg-red-100 text-red-800';
      case 'revisao': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isExpiringSoon = () => {
    const today = new Date();
    const validadeDate = new Date(orcamento.data_validade);
    const diffTime = validadeDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

  const isExpired = () => {
    const today = new Date();
    const validadeDate = new Date(orcamento.data_validade);
    return validadeDate < today;
  };

  return (
    <div className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
      isExpired() ? 'border-red-300 bg-red-50' : 
      isExpiringSoon() ? 'border-yellow-300 bg-yellow-50' : 
      'border-gray-200 bg-white'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-gray-900">{orcamento.numero}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(orcamento.status)}`}>
              {orcamento.status}
            </span>
            {isExpired() && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Vencido
              </span>
            )}
            {isExpiringSoon() && !isExpired() && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Vence em breve
              </span>
            )}
          </div>
          <p className="text-gray-600 font-medium">{orcamento.cliente}</p>
        </div>
        
        {!readOnly && (
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(orcamento)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Editar orçamento"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(orcamento.id)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Excluir orçamento"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-green-600" />
          <div>
            <p className="text-xs text-gray-500">Valor Total</p>
            <p className="font-medium text-green-600">{formatCurrency(orcamento.valor_total)}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <div>
            <p className="text-xs text-gray-500">Itens</p>
            <p className="font-medium">{orcamento.itens?.length || 0} funções</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-600" />
          <div>
            <p className="text-xs text-gray-500">Criado em</p>
            <p className="font-medium">{formatDate(orcamento.data_criacao)}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-orange-600" />
          <div>
            <p className="text-xs text-gray-500">Válido até</p>
            <p className={`font-medium ${isExpired() ? 'text-red-600' : isExpiringSoon() ? 'text-yellow-600' : 'text-gray-900'}`}>
              {formatDate(orcamento.data_validade)}
            </p>
          </div>
        </div>
      </div>

      {/* Itens Preview */}
      {orcamento.itens && orcamento.itens.length > 0 && (
        <div className="border-t pt-3">
          <p className="text-sm font-medium text-gray-700 mb-2">Funções Orçadas:</p>
          <div className="space-y-1">
            {orcamento.itens.slice(0, 3).map((item, index) => {
              const totalItem = item.salario + (item.custos?.reduce((sum, custo) => sum + custo.valor, 0) || 0);
              return (
                <div key={item.id || index} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{item.funcao}</span>
                  <span className="font-medium">{formatCurrency(totalItem)}</span>
                </div>
              );
            })}
            {orcamento.itens.length > 3 && (
              <div className="text-xs text-gray-500 italic">
                + {orcamento.itens.length - 3} funções adicionais
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t">
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">Por: {orcamento.criado_por}</span>
        </div>
        
        {orcamento.observacoes && (
          <div className="text-xs text-gray-500">
            <Eye className="w-3 h-3 inline mr-1" />
            Com observações
          </div>
        )}
      </div>
    </div>
  );
};