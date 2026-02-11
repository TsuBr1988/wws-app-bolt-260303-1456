import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface NewBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (budgetId: string, budgetNumber: string, clientName: string, description: string) => void;
  editBudget?: {
    id: string;
    budget_number: string;
    client_name: string;
    description: string;
    city_name?: string;
    cnpj?: string;
    email?: string;
    phone?: string;
    address?: string;
    lead_source?: string;
  } | null;
}

export const NewBudgetModal = ({ isOpen, onClose, onSave, editBudget }: NewBudgetModalProps) => {
  const [budgetNumber, setBudgetNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [sindicoComprador, setSindicoComprador] = useState('');
  const [description, setDescription] = useState('');
  const [cityName, setCityName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [leadSource, setLeadSource] = useState('');
  const [serviceType, setServiceType] = useState<'facilities' | 'vigilancia'>('facilities');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !editBudget) {
      generateBudgetNumber();
      setClientName('');
      setSindicoComprador('');
      setDescription('');
      setCityName('');
      setCnpj('');
      setEmail('');
      setPhone('');
      setAddress('');
      setLeadSource('');
      setServiceType('facilities');
    } else if (isOpen && editBudget) {
      setBudgetNumber(editBudget.budget_number);
      setClientName(editBudget.client_name);
      setSindicoComprador('');
      setDescription(editBudget.description || '');
      setCityName(editBudget.city_name || '');
      setCnpj(editBudget.cnpj || '');
      setEmail(editBudget.email || '');
      setPhone(editBudget.phone || '');
      setAddress(editBudget.address || '');
      setLeadSource(editBudget.lead_source || '');
      loadServiceType();
    }
  }, [isOpen, editBudget]);

  const loadServiceType = async () => {
    if (!editBudget) return;

    const { data } = await supabase
      .from('budgets')
      .select('service_type')
      .eq('id', editBudget.id)
      .maybeSingle();

    if (data?.service_type) {
      setServiceType(data.service_type);
    }
  };

  const generateBudgetNumber = async () => {
    const currentYear = new Date().getFullYear();
    const { data, error } = await supabase.rpc('get_next_budget_number', {
      p_year: currentYear,
    });

    if (error) {
      console.error('Erro ao gerar número do orçamento:', error);
      return;
    }

    setBudgetNumber(data);
  };

  const handleSave = async () => {
    if (!clientName.trim()) {
      alert('Por favor, insira o nome do cliente');
      return;
    }

    if (!cityName.trim()) {
      alert('Por favor, insira a cidade');
      return;
    }

    setIsLoading(true);

    try {
      if (editBudget) {
        const { error } = await supabase
          .from('budgets')
          .update({
            client_name: clientName,
            description: description,
            city_name: cityName,
            cnpj: cnpj || null,
            email: email || null,
            phone: phone || null,
            address: address || null,
            lead_source: leadSource || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editBudget.id);

        if (error) throw error;

        onSave(editBudget.id, budgetNumber, clientName, description);
      } else {
        const currentYear = new Date().getFullYear();
        const sequenceMatch = budgetNumber.match(/-(\d+)$/);
        const sequenceNumber = sequenceMatch ? parseInt(sequenceMatch[1]) : 1;

        const { data, error } = await supabase
          .from('budgets')
          .insert({
            budget_number: budgetNumber,
            client_name: clientName,
            description: description,
            city_name: cityName,
            cnpj: cnpj || null,
            email: email || null,
            phone: phone || null,
            address: address || null,
            lead_source: leadSource || null,
            service_type: serviceType,
            name: `${clientName} - ${budgetNumber}`,
            vt_value: 5.5,
            iss_rate: 3.0,
            city: 'AMERICANA',
            status: 'open',
            year: currentYear,
            sequence_number: sequenceNumber,
          })
          .select()
          .maybeSingle();

        if (error) throw error;

        if (data) {
          onSave(data.id, budgetNumber, clientName, description);
        }
      }

      onClose();
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      alert('Erro ao salvar orçamento');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">
            {editBudget ? 'Editar Orçamento' : 'Novo Orçamento'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Número do Orçamento
            </label>
            <input
              type="text"
              value={budgetNumber}
              disabled
              className="w-full px-4 py-3 border border-slate-300 rounded-md bg-slate-100 text-slate-600 font-mono text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Tipo de Serviço *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                disabled={!!editBudget}
                onClick={() => setServiceType('facilities')}
                className={`px-6 py-4 rounded-lg font-semibold transition-all border-2 ${
                  serviceType === 'facilities'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
                } ${editBudget ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl">🏢</span>
                  <span>Facilities</span>
                </div>
              </button>
              <button
                type="button"
                disabled={!!editBudget}
                onClick={() => setServiceType('vigilancia')}
                className={`px-6 py-4 rounded-lg font-semibold transition-all border-2 ${
                  serviceType === 'vigilancia'
                    ? 'bg-green-600 text-white border-green-600 shadow-lg'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-green-400'
                } ${editBudget ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl">🛡️</span>
                  <span>Vigilância</span>
                </div>
              </button>
            </div>
            {editBudget && (
              <p className="text-xs text-slate-500 mt-2">
                O tipo de serviço não pode ser alterado após a criação do orçamento
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Nome do Cliente *
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Digite o nome do cliente"
              className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Síndico/ Comprador
            </label>
            <input
              type="text"
              value={sindicoComprador}
              onChange={(e) => setSindicoComprador(e.target.value)}
              placeholder="Digite o nome do síndico ou comprador"
              className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Cidade *
              </label>
              <input
                type="text"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                placeholder="Digite a cidade"
                className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                CNPJ
              </label>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0000-00"
                className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Telefone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Endereço
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, número, bairro"
              className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Origem do Lead
            </label>
            <select
              value={leadSource}
              onChange={(e) => setLeadSource(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione...</option>
              <option value="indicacao">Indicação</option>
              <option value="site">Site</option>
              <option value="redes-sociais">Redes Sociais</option>
              <option value="email">E-mail</option>
              <option value="telefone">Telefone</option>
              <option value="evento">Evento</option>
              <option value="parceiro">Parceiro</option>
              <option value="licitacao">Licitação</option>
              <option value="outros">Outros</option>
              <option value="prospeccao-vendedor">Prospecção vendedor</option>
              <option value="prospeccao-SDR">Prospecção SDR</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Descrição Breve
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Digite uma breve descrição do orçamento"
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-md hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors shadow-md disabled:bg-slate-400"
          >
            {isLoading ? 'Salvando...' : editBudget ? 'Atualizar' : 'Criar Orçamento'}
          </button>
        </div>
      </div>
    </div>
  );
};
