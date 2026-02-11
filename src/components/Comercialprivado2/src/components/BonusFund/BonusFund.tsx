import React, { useState, useEffect } from 'react';
import { PiggyBank, TrendingUp, Users, Calendar, DollarSign, Clock, Info, CreditCard, History } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { formatCurrency } from '../../utils/formatCurrency';
import { displayDateTime, displayDate } from '../../utils/dateUtils';

interface BonusTransaction {
  id: string;
  type: 'contribution' | 'payment' | 'cycle_end';
  date: string;
  description: string;
  amount: number;
  employeeName?: string;
  contractOrigin?: string;
}

export const BonusFund: React.FC = () => {
  const [selectedYear] = useState(new Date().getFullYear());
  const [transactions, setTransactions] = useState<BonusTransaction[]>([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [processedProposals, setProcessedProposals] = useState<Set<string>>(new Set()); // Começar vazio
  
  // Otimizar queries com campos específicos
  const { data: proposals = [], loading: proposalsLoading } = useSupabaseQuery('proposals', {
    select: 'id, client, total_value, status, updated_at, created_at'
  });
  
  const { data: employees = [], loading: employeesLoading } = useSupabaseQuery('employees', {
    select: 'id, name, avatar, role, admission_date'
  });

  // Calcular contribuições do fundo baseado APENAS em contratos NÃO processados
  const calculateFundData = () => {
    const closedProposals = proposals.filter(p => 
      p.status === 'Fechado' && !processedProposals.has(p.id)
    );
    
    let totalAmount = 0;
    const contributions: any[] = [];
    
    closedProposals.forEach(proposal => {
      // R$ 50 fixo
      const fixedAmount = 50;
      // 0.1% do valor global
      const percentageAmount = (proposal.total_value || 0) * 0.001; // 0.1%
      
      totalAmount += fixedAmount + percentageAmount;
      
      contributions.push({
        id: `fixed-${proposal.id}`,
        proposalId: proposal.id,
        clientName: proposal.client,
        contractValue: proposal.total_value || 0,
        fixedAmount,
        percentageAmount,
        totalContribution: fixedAmount + percentageAmount,
        date: proposal.updated_at || proposal.created_at
      });
    });
    
    return { totalAmount, contributions, closedProposals };
  };

  // Calcular meses trabalhados no ano atual
  const calculateMonthsWorkedThisYear = (admissionDate: string) => {
    if (!admissionDate) return 0;
    
    const admission = new Date(admissionDate);
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Se a admissão foi em outro ano, começar do janeiro do ano atual
    const startOfYear = new Date(currentYear, 0, 1); // 1º de janeiro do ano atual
    const effectiveStartDate = admission.getFullYear() < currentYear ? startOfYear : admission;
    
    // Se a admissão foi depois do mês atual, retornar 0
    if (effectiveStartDate > now) return 0;
    
    // Calcular diferença em meses dentro do ano atual
    let months = (now.getMonth() - effectiveStartDate.getMonth()) + 1;
    
    // Se o dia atual for menor que o dia de início, subtrair um mês
    if (now.getDate() < effectiveStartDate.getDate()) {
      months--;
    }
    
    return Math.max(1, months);
  };

  // Calcular bonificação projetada para cada funcionário
  const calculateEmployeeBonuses = (totalAmount: number) => {
    // Filtrar apenas funcionários não-administrativos
    const nonAdminEmployees = employees.filter(emp => emp.role !== 'Admin');
    
    if (nonAdminEmployees.length === 0) return [];
    
    return nonAdminEmployees.map(employee => {
      const startDate = employee.admission_date || '2024-01-01';
      const monthsWorkedThisYear = calculateMonthsWorkedThisYear(startDate);
      
      return {
        id: employee.id,
        name: employee.name,
        avatar: employee.avatar,
        startDate,
        monthsWorked: monthsWorkedThisYear,
        projectedBonus: 0 // Will be calculated after
      };
    });
  };

  // Recalcular bonificações proporcionais
  const recalculateBonuses = (employeeList: any[], totalAmount: number) => {
    const totalMonthsAllEmployees = employeeList.reduce((sum, emp) => sum + emp.monthsWorked, 0);
    
    return employeeList.map(employee => ({
      ...employee,
      projectedBonus: totalMonthsAllEmployees > 0 ? 
        (employee.monthsWorked / totalMonthsAllEmployees) * totalAmount : 0
    }));
  };

  const { totalAmount, contributions, closedProposals } = calculateFundData();
  const employeeList = calculateEmployeeBonuses(totalAmount);
  const bonusEmployees = recalculateBonuses(employeeList, totalAmount);

  // Gerar transações do histórico baseado nos dados atuais (apenas não processados)
  useEffect(() => {
    const newTransactions: BonusTransaction[] = [];
    
    // Adicionar contribuições dos contratos NÃO processados
    closedProposals.forEach(proposal => {
      const date = proposal.updated_at || proposal.created_at;
      
      // Contribuição fixa de R$ 50
      newTransactions.push({
        id: `fixed-${proposal.id}`,
        type: 'contribution',
        date,
        description: `Valor fixo por contrato fechado`,
        amount: 50,
        contractOrigin: proposal.client
      });
      
      // Contribuição de 0.1% do valor global
      const percentageAmount = (proposal.total_value || 0) * 0.001;
      newTransactions.push({
        id: `percentage-${proposal.id}`,
        type: 'contribution',
        date,
        description: `0,1% do valor global do contrato`,
        amount: percentageAmount,
        contractOrigin: proposal.client
      });
    });
    
    // Manter transações antigas (pagamentos e fins de ciclo) e adicionar novas contribuições
    const existingNonContributions = transactions.filter(t => t.type !== 'contribution');
    const allTransactions = [...existingNonContributions, ...newTransactions];
    
    // Ordenar por data (mais recente primeiro)
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setTransactions(allTransactions);
  }, [proposals, processedProposals]);

  const handlePayment = () => {
    if (totalAmount <= 0) {
      alert('Não há valor no fundo para distribuir.');
      return;
    }

    const confirmMessage = `Confirma o pagamento de ${formatCurrency(totalAmount)} para ${bonusEmployees.length} funcionários?\n\nEsta ação irá:\n- Distribuir o valor proporcionalmente\n- Zerar o fundo atual\n- Marcar contratos como processados\n- Registrar os pagamentos no histórico\n\nAPÓS O PAGAMENTO O FUNDO SERÁ ZERADO!`;
    
    if (!confirm(confirmMessage)) return;

    setIsProcessingPayment(true);

    // Simular processamento
    setTimeout(() => {
      const paymentDate = new Date().toISOString();
      const paymentTransactions: BonusTransaction[] = [];

      // Criar transações de pagamento para cada funcionário
      bonusEmployees.forEach(employee => {
        if (employee.projectedBonus > 0) {
          paymentTransactions.push({
            id: `payment-${employee.id}-${Date.now()}`,
            type: 'payment',
            date: paymentDate,
            description: `Pagamento de bonificação proporcional (${employee.monthsWorked} meses em ${new Date().getFullYear()})`,
            amount: -employee.projectedBonus, // Negativo para indicar saída
            employeeName: employee.name
          });
        }
      });

      // Marcar contratos como processados (CRÍTICO!)
      const newProcessedProposals = new Set(processedProposals);
      closedProposals.forEach(proposal => {
        newProcessedProposals.add(proposal.id);
      });
      setProcessedProposals(newProcessedProposals);

      // Adicionar transação de fim de ciclo
      const cycleEndTransaction: BonusTransaction = {
        id: `cycle-end-${Date.now()}`,
        type: 'cycle_end',
        date: paymentDate,
        description: `🔄 FUNDO ZERADO - Fim do ciclo de bonificação. Contratos processados: ${closedProposals.length}. Novo ciclo iniciado.`,
        amount: -totalAmount,
        employeeName: 'Sistema'
      };
      // Adicionar todas as transações ao histórico
      setTransactions(prev => [
        cycleEndTransaction,
        ...paymentTransactions.reverse(), // Mais recente primeiro
        ...prev
      ]);
      
      setIsProcessingPayment(false);
      
      alert(`✅ PAGAMENTO REALIZADO COM SUCESSO!\n\n💰 Total distribuído: ${formatCurrency(totalAmount)}\n👥 Funcionários beneficiados: ${bonusEmployees.length}\n\n🔄 FUNDO ZERADO!\n📈 Acúmulo recomeçará com novos contratos fechados.\n\n⚠️ Contratos já processados não alimentarão mais o fundo.`);
      
    }, 2000);
  };

  const formatDate = (dateString: string) => {
    return displayDateTime(dateString);
  };

  const getMonthsWorkedText = (months: number) => {
    if (months === 1) return '1 mês';
    return `${months} meses`;
  };

  if (proposalsLoading || employeesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fundo de Bonificação</h1>
          <p className="text-gray-600">Cofrinho para distribuição proporcional baseado no tempo de empresa</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Ano: {selectedYear}</span>
          </div>
          <button
            onClick={handlePayment}
            disabled={isProcessingPayment || totalAmount <= 0}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              totalAmount > 0 && !isProcessingPayment
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span>{isProcessingPayment ? 'Processando...' : 'Pagar'}</span>
          </button>
        </div>
      </div>

      {/* Fund Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total do Fundo</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</p>
              <p className="text-xs text-gray-500">Apenas contratos não processados</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
              <PiggyBank className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Contratos Pendentes</p>
              <p className="text-2xl font-bold text-blue-600">{closedProposals.length}</p>
              <p className="text-xs text-gray-500">Não processados</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Funcionários</p>
              <p className="text-2xl font-bold text-purple-600">{bonusEmployees.length}</p>
              <p className="text-xs text-gray-500">Beneficiários</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Contratos Processados</p>
              <p className="text-2xl font-bold text-orange-600">{processedProposals.size}</p>
              <p className="text-xs text-gray-500">Já pagos</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Info className="w-6 h-6 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Como Funciona o Fundo</h3>
            <div className="space-y-2 text-blue-800">
              <p>• A cada contrato fechado, o fundo recebe <strong>R$ 50,00 + 0,1% do valor global</strong></p>
              <p>• Ao clicar em "Pagar", o valor é distribuído proporcionalmente entre todos os funcionários</p>
              <p>• A proporção é baseada nos <strong>meses trabalhados no ano atual ({new Date().getFullYear()})</strong></p>
              <p>• <strong>APÓS O PAGAMENTO:</strong> O fundo é zerado e contratos são marcados como processados</p>
              <p>• <strong>IMPORTANTE:</strong> Contratos já processados não alimentam mais o fundo (evita duplicidade)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Projections */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Projeção de Bonificação por Funcionário</h2>
          <div className="space-y-4">
            {bonusEmployees
              .sort((a, b) => b.projectedBonus - a.projectedBonus)
              .map((employee) => (
                <div key={employee.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-4 mb-3">
                    <img
                      src={employee.avatar}
                      alt={employee.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{employee.name}</h3>
                      <p className="text-sm text-gray-500">
                        Desde {displayDate(employee.startDate)} • {employee.monthsWorked} {employee.monthsWorked === 1 ? 'mês' : 'meses'} em {new Date().getFullYear()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(employee.projectedBonus)}
                      </div>
                      <div className="text-xs text-gray-500">projeção atual</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-100 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${bonusEmployees.length > 0 ? (employee.monthsWorked / Math.max(...bonusEmployees.map(e => e.monthsWorked))) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Meses trabalhados em {new Date().getFullYear()}</span>
                    <span>{employee.monthsWorked} {employee.monthsWorked === 1 ? 'mês' : 'meses'}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Year-end Distribution Preview */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="w-6 h-6 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Distribuição Atual</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {formatCurrency(totalAmount)}
              </div>
              <div className="text-sm text-gray-600">Total Acumulado</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {bonusEmployees.reduce((sum, emp) => sum + emp.monthsWorked, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Meses em {new Date().getFullYear()}</div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600 mb-1">
              {bonusEmployees.reduce((sum, emp) => sum + emp.monthsWorked, 0) > 0 ? 
                formatCurrency(totalAmount / bonusEmployees.reduce((sum, emp) => sum + emp.monthsWorked, 0)) : 
                formatCurrency(0)
              }
            </div>
            <div className="text-sm text-gray-600">Valor por Mês em {new Date().getFullYear()}</div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-blue-300 text-center">
            <p className="text-sm text-gray-600">
              Clique em "Pagar" para distribuir o valor atual e zerar o fundo
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <History className="w-6 h-6 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Histórico de Transações</h2>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <div 
                key={transaction.id} 
                className={`border-l-4 pl-4 py-3 rounded-r-lg ${
                  transaction.type === 'contribution' 
                    ? 'border-green-500 bg-green-50' 
                    : transaction.type === 'cycle_end'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-red-500 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${
                      transaction.type === 'contribution' ? 'text-green-800' : 
                      transaction.type === 'cycle_end' ? 'text-purple-800' :
                      'text-red-800'
                    }`}>
                      {transaction.type === 'contribution' ? '+ Contribuição' : 
                       transaction.type === 'cycle_end' ? '🔄 Fim de Ciclo' :
                       '- Pagamento'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(transaction.date)}
                    </span>
                  </div>
                  <span className={`text-lg font-bold ${
                    transaction.type === 'contribution' ? 'text-green-600' : 
                    transaction.type === 'cycle_end' ? 'text-purple-600' :
                    'text-red-600'
                  }`}>
                    {transaction.type === 'cycle_end' ? '' : formatCurrency(Math.abs(transaction.amount))}
                  </span>
                </div>
                
                <p className="text-sm text-gray-700 mb-1">{transaction.description}</p>
                
                {transaction.contractOrigin && (
                  <p className="text-xs text-gray-500">
                    <strong>Contrato:</strong> {transaction.contractOrigin}
                  </p>
                )}
                
                {transaction.employeeName && (
                  <p className="text-xs text-gray-500">
                    <strong>Funcionário:</strong> {transaction.employeeName}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <PiggyBank className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Nenhuma transação ainda</p>
              <p className="text-sm text-gray-400">O histórico será alimentado quando contratos forem fechados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};