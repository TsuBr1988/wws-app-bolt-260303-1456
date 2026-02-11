import { useState } from 'react';
import { X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

interface ManualContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editContract?: {
    id: string;
    contract_name: string;
    empresa: string;
    tipo: string;
    city: string;
    contract_qty: number;
  } | null;
}

export function ManualContractModal({ isOpen, onClose, onSuccess, editContract }: ManualContractModalProps) {
  const [contractName, setContractName] = useState(editContract?.contract_name || '');
  const [empresa, setEmpresa] = useState(editContract?.empresa || 'WWS');
  const [tipo, setTipo] = useState(editContract?.tipo || 'Publico');
  const [city, setCity] = useState(editContract?.city || '');
  const [contractQty, setContractQty] = useState(editContract?.contract_qty || 0);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!contractName.trim()) {
      toast({
        title: 'Erro de validação',
        description: 'O nome do contrato é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (editContract) {
        // Update existing contract
        const { error } = await supabase
          .from('hr_manual_contracts')
          .update({
            contract_name: contractName,
            empresa,
            tipo,
            city: city || null,
            contract_qty: contractQty,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editContract.id);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Contrato manual atualizado com sucesso.',
        });
      } else {
        // Insert new contract
        const { error } = await supabase
          .from('hr_manual_contracts')
          .insert({
            contract_name: contractName,
            empresa,
            tipo,
            city: city || null,
            contract_qty: contractQty,
          });

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Contrato manual adicionado com sucesso.',
        });
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error saving manual contract:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o contrato manual.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setContractName('');
    setEmpresa('WWS');
    setTipo('Publico');
    setCity('');
    setContractQty(0);
  };

  const handleClose = () => {
    onClose();
    if (!editContract) {
      resetForm();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {editContract ? 'Editar Contrato Manual' : 'Adicionar Contrato Manual'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Contrato *
            </label>
            <input
              type="text"
              value={contractName}
              onChange={(e) => setContractName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Ex: Administrativo, Contrato Encerrado XYZ"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Empresa
            </label>
            <select
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="WWS">WWS</option>
              <option value="Worldwide">Worldwide</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="Publico">Público</option>
              <option value="Privado">Privado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cidade (opcional)
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Ex: São Paulo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantidade Contratada
            </label>
            <input
              type="number"
              value={contractQty}
              onChange={(e) => setContractQty(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              min="0"
            />
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Salvando...' : editContract ? 'Atualizar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  );
}
