import React, { useState, useEffect } from 'react';
import { PiggyBank, TrendingUp, Users, Calendar, DollarSign, Clock, Info, CreditCard, History } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateTimeBR } from '../../utils/dateUtils';
import { useDepartment } from '../../contexts/DepartmentContext';
import { isContratoAssinado, STATUS_VENCEU_CONTRATO } from '../../constants/status';

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
  const { selectedDepartment } = useDepartment();
  const [selectedYear] = useState(new Date().getFullYear());
  const [transactions, setTransactions] = useState<BonusTransaction[]>([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [processedProposals, setProcessedProposals] = useState<Set<string>>(new Set()); // Começar vazio
  
  // Otimizar queries com campos específicos
  const { data: proposals = [], loading: proposalsLoading } = useSupabaseQuery('proposals', {
    select: 'id, client, total_value, nosso_lance, status, updated_at, created_at'
  });
  
  const { data: employees = [], loading: employeesLoading } = useSupabaseQuery('employees', {
    select: 'id, name, avatar, role, hire_date, participa_fundo'
  });

  // Calcular contribuições do fundo baseado APENAS em contratos NÃO processados
  const calculateFundData = () => {
    // DEBUG: Log todas as propostas para análise
    console.log('🔍 [BonusFund] DEBUG - Todas as propostas carregadas:', {
      total: proposals.length,
      porStatus: proposals.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      contratos_assinados: proposals.filter(p => p.status === 'Contrato assinado').length,
      porDepartamento: proposals.reduce((acc, p) => {
        acc[p.department || 'sem_department'] = (acc[p.department || 'sem_department'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      selectedDepartment,
      processedProposalsSize: processedProposals.size,
      amostras: proposals.slice(0, 3).map(p => ({
        id: p.id,
        client: p.client,
        status: p.status,
        total_value: p.total_value,
        department: p.department
      }))
    });

    // DEBUG: Verificar função isContratoAssinado
    const testStatus = 'Contrato assinado';
    console.log('🔍 [BonusFund] DEBUG - Testando função isContratoAssinado:', {
      testStatus,
      resultado: isContratoAssinado(testStatus),
      STATUS_VENCEU_CONTRATO,
      includes: STATUS_VENCEU_CONTRATO.includes(testStatus)
    });

    // CORRIGIDO: Usar a constante para identificar contratos assinados
    const closedProposals = proposals.filter(p => {
      // NOVO: Verificação direta do status para debug
      const isClosedContract = p.status === 'Contrato assinado';
      const isNotProcessed = !processedProposals.has(p.id);
      // NOVO: Aceitar propostas sem department definido OU do departamento correto
      const isFromSelectedDepartment = !p.department || p.department === selectedDepartment;
      
      console.log('🔍 [BonusFund] Verificando proposta para o fundo:', {
        id: p.id,
        client: p.client,
        status: p.status,
        total_value: p.total_value,
        department: p.department || 'undefined',
        isClosedContract,
        isNotProcessed,
        isFromSelectedDepartment,
        selectedDepartment,
        shouldInclude: isClosedContract && isNotProcessed && isFromSelectedDepartment,
        detalhes: {
          statusExato: p.status === 'Contrato assinado' ? 'MATCH' : 'NO_MATCH',
          processado: processedProposals.has(p.id) ? 'JÁ_PROCESSADO' : 'NÃO_PROCESSADO',
          departmentMatch: p.department === selectedDepartment ? 'MATCH' : `${p.department} !== ${selectedDepartment}`
        }
      });
      
      return isClosedContract && isNotProcessed && isFromSelectedDepartment;
    });
    
    console.log('💰 [BonusFund] Propostas fechadas encontradas:', {
      total: closedProposals.length,
      propostas: closedProposals.map(p => ({
        client: p.client,
        status: p.status,
        total_value: p.total_value,
        department: p.department
      }))
    });
    
    let totalAmount = 0;
    const contributions: any[] = [];
    
    closedProposals.forEach(proposal => {
      // R$ 50 fixo
      const fixedAmount = 50;

      // 0,01% do valor global para todos os contratos vencidos
      const contractValue = proposal.nosso_lance || proposal.total_value || 0;
      const percentageAmount = contractValue * 0.0001; // 0.01%

      totalAmount += fixedAmount + percentageAmount;

      contributions.push({
        id: `contribution-${proposal.id}`,
        proposalId: proposal.id,
        clientName: proposal.client,
        contractValue: contractValue,
        fixedAmount,
        percentageAmount,
        totalContribution: fixedAmount + percentageAmount,
        date: proposal.updated_at || proposal.created_at
      });
    });
    
    return { totalAmount, contributions, closedProposals };
  };

  // Calcular meses trabalhados no ano atual
  const calculateMonthsWorkedThisYear = (hireDate: string, targetYear: number = selectedYear): number => {
    if (!hireDate) return 0;
    
    const admissao = new Date(hireDate);
    const anoAdmissao = admissao.getFullYear();
    const mesAdmissao = admissao.getMonth() + 1; // 1-12 
    const mesAtual = new Date().getMonth() + 1; // Mês atual (1-12) - agosto = 8
    
    console.log(`👤 Calculando meses para funcionário | Admissão: ${admissao.toDateString()} | Ano: ${anoAdmissao} | Mês: ${mesAdmissao}`);
    
    // LÓGICA CORRIGIDA:
    // Se foi admitido antes do ano alvo (2025), trabalhou o ano todo até o mês atual
    if (anoAdmissao < targetYear) {
      console.log(`📅 Admissão anterior ao ano ${targetYear}: ${mesAtual} meses`);
      return mesAtual;
    }
    
    // Se foi admitido durante o ano alvo (2025), calcular desde o mês de admissão
    if (anoAdmissao === targetYear) {
      const mesesTrabalhados = Math.max(0, mesAtual - mesAdmissao + 1);
      console.log(`📅 Admissão em ${targetYear}: ${mesAtual} - ${mesAdmissao} + 1 = ${mesesTrabalhados} meses`);
      return mesesTrabalhados;
    }
    
    // Se foi admitido no futuro, não participa ainda
    console.log(`📅 Admissão futura: 0 meses`);
    return 0;
  };

  // Formatar data de admissão
  const formatHireDate = (hireDate: string): string => {
    if (!hireDate) return 'Data não informada';
    
    const date = new Date(hireDate);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  // Determinar quando o funcionário começou a participar do fundo no ano
  const getParticipationStartInfo = (hireDate: string, currentYear: number): string => {
    if (!hireDate) return 'Não informado';
    
    const hire = new Date(hireDate);
    const hireYear = hire.getFullYear();
    const hireMonth = hire.getMonth() + 1;
    
    if (hireYear < currentYear) {
      return `Janeiro/${currentYear} (já trabalhava)`;
    } else if (hireYear === currentYear) {
      const monthName = new Date(currentYear, hireMonth - 1, 1)
        .toLocaleDateString('pt-BR', { month: 'long' });
      return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}/${currentYear}`;
    }
    
    return 'Não participa ainda';
  };

  // Calcular bonificação projetada para cada funcionário
  const calculateEmployeeBonuses = (totalAmount: number) => {
    // FILTRO CORRETO: apenas funcionários que participam do fundo
    const participatingEmployees = employees.filter(emp => 
      emp.participa_fundo === true && emp.name !== 'Rubens Neto'
    );
    
    console.log('🎯 FILTRO DE PARTICIPANTES - Funcionários elegíveis para o fundo:', {
      total: employees.length,
      participantes: participatingEmployees.length,
      nomes: participatingEmployees.map(emp => emp.name),
      excluidos: employees.filter(emp => emp.participa_fundo !== true || emp.name === 'Rubens Neto').map(emp => emp.name),
      criterios: {
        participaFundo: 'participa_fundo = true',
        exclusoes: 'name !== "Rubens Neto"'
      }
    });
    
    if (participatingEmployees.length === 0) return [];
    
    return participatingEmployees.map(employee => {
      const startDate = employee.hire_date || '2024-01-01';
      const monthsWorkedThisYear = calculateMonthsWorkedThisYear(startDate, selectedYear);
      
      console.log(`💼 CÁLCULO INDIVIDUAL - ${employee.name}:`, {
        dataAdmissao: startDate,
        mesesCalculados: monthsWorkedThisYear,
        ano: selectedYear,
        participaFundo: employee.participa_fundo
      });
      
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
    
    console.log('🧮 CÁLCULO FINAL - Distribuição proporcional:', {
      totalAmount,
      totalMonthsAllEmployees,
      valorPorMes: totalMonthsAllEmployees > 0 ? (totalAmount / totalMonthsAllEmployees).toFixed(2) : 0,
      funcionarios: employeeList.length,
      formula: `R$ ${totalAmount.toFixed(2)} ÷ ${totalMonthsAllEmployees} meses = R$ ${totalMonthsAllEmployees > 0 ? (totalAmount / totalMonthsAllEmployees).toFixed(2) : '0.00'} por mês`
    });
    
    return employeeList.map(employee => ({
      ...employee,
      projectedBonus: totalMonthsAllEmployees > 0 ? 
        Number(((employee.monthsWorked / totalMonthsAllEmployees) * totalAmount).toFixed(2)) : 0
    }));
  };

  const { totalAmount, contributions, closedProposals } = calculateFundData();
  const employeeList = calculateEmployeeBonuses(totalAmount);
  const bonusEmployees = recalculateBonuses(employeeList, totalAmount);

  // Gerar transações do histórico baseado nos dados atuais (apenas não processados)
  useEffect(() => {
    const newTransactions: BonusTransaction[] = [];
    
    console.log('🔄 [BonusFund] Gerando transações para:', {
      closedProposalsCount: closedProposals.length,
      processedProposalsCount: processedProposals.size,
      selectedDepartment
    });
    
    // Adicionar contribuições dos contratos NÃO processados
    closedProposals.forEach(proposal => {
      const date = proposal.updated_at || proposal.created_at;
      
      // Contribuição fixa de R$ 50 por licitação vencida
      newTransactions.push({
        id: `fixed-${proposal.id}`,
        type: 'contribution',
        date,
        description: `Valor fixo por licitação vencida`,
        amount: 50,
        contractOrigin: proposal.client
      });
      
      // Contribuição percentual baseada no departamento e NOSSO LANCE
      const nossoLance = proposal.nosso_lance || 0;
      let percentageAmount = 0;
      let description = '';

      if (selectedDepartment === 'Petrobras') {
        if (nossoLance < 100000000) {
          percentageAmount = nossoLance * 0.0001; // 0.01%
          description = '0,01% do nosso lance';
        } else {
          percentageAmount = nossoLance * 0.00005; // 0.005%
          description = '0,005% do nosso lance (>100M)';
        }
      } else {
        percentageAmount = nossoLance * 0.0001; // 0.01%
        description = '0,01% do nosso lance';
      }
      
      newTransactions.push({
        id: `percentage-${proposal.id}`,
        type: 'contribution',
        date,
        description,
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
  }, [proposals, processedProposals, selectedDepartment]);

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
        console.log('✅ [BonusFund] Marcando proposta como processada:', {
          id: proposal.id,
          client: proposal.client,
          status: proposal.status
        });
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
      
      // Mostrar detalhamento do pagamento
      const detalhamento = bonusEmployees
        .filter(emp => emp.projectedBonus > 0)
        .map(emp => `• ${emp.name}: ${formatCurrency(emp.projectedBonus)} (${emp.monthsWorked} meses)`)
        .join('\n');
      
      alert(`🎉 PAGAMENTO REALIZADO COM SUCESSO!\n\n💰 Total distribuído: ${formatCurrency(totalAmount)}\n👥 Funcionários beneficiados: ${bonusEmployees.filter(emp => emp.projectedBonus > 0).length}\n\n📋 Detalhamento:\n${detalhamento}\n\n🔄 FUNDO ZERADO!\n📈 Acúmulo recomeçará com novas licitações vencidas.\n\n⚠️ Licitações já processadas não alimentarão mais o fundo.`);
      
    }, 2000);
  };

  const formatDate = (dateString: string) => {
    return formatDateTimeBR(dateString);
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
          <p className="text-gray-600">
            Cofrinho alimentado por licitações vencidas para distribuição proporcional
            {selectedDepartment === 'Petrobras' && <span className="text-yellow-600 font-medium"> • Petrobras</span>}
          </p>
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
              <p className="text-xs text-gray-500">Apenas licitações vencidas não processadas</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
              <PiggyBank className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Licitações Vencidas Pendentes</p>
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
              <p className="text-xs text-gray-500">Participantes do Fundo</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Licitações Processadas</p>
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
      <div className={`border rounded-xl p-6 ${
        selectedDepartment === 'Petrobras' 
          ? 'bg-yellow-50 border-yellow-200' 
          : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-start space-x-3">
          <Info className={`w-6 h-6 mt-0.5 ${
            selectedDepartment === 'Petrobras' ? 'text-yellow-600' : 'text-blue-600'
          }`} />
          <div>
            <h3 className={`text-lg font-semibold mb-2 ${
              selectedDepartment === 'Petrobras' ? 'text-yellow-900' : 'text-blue-900'
            }`}>Como Funciona o Fundo</h3>
            <div className={`space-y-2 ${
              selectedDepartment === 'Petrobras' ? 'text-yellow-800' : 'text-blue-800'
            }`}>
              {selectedDepartment === 'Petrobras' ? (
                <>
                  <p>• A cada licitação vencida, o fundo recebe <strong>R$ 50,00 + percentual do nosso lance</strong></p>
                  <p>• <strong>Percentual:</strong> 0,01% para nosso lance até 100M • 0,005% para nosso lance acima de 100M</p>
                </>
              ) : (
                <p>• A cada licitação vencida, o fundo recebe <strong>R$ 50,00 + 0,01% do nosso lance</strong></p>
              )}
              <p>• Ao clicar em "Pagar", o valor é distribuído proporcionalmente entre todos os funcionários</p>
              <p>• A proporção é baseada nos <strong>meses trabalhados no ano selecionado ({selectedYear})</strong></p>
              <p>• <strong>APÓS O PAGAMENTO:</strong> O fundo é zerado e licitações são marcadas como processadas</p>
              <p>• <strong>IMPORTANTE:</strong> Licitações já processadas não alimentam mais o fundo (evita duplicidade)</p>
              <p>• <strong>PARTICIPAÇÃO:</strong> Apenas funcionários com "Participa do Fundo = ✅" recebem bonificação</p>
              <p>• <strong>CÁLCULO:</strong> Valor Total ÷ Total de Meses Trabalhados × Meses Individuais = Bonificação</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Projections */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Projeção de Bonificação por Funcionário</h2>
            <div className="text-sm text-gray-600">
              Ano: <strong>{selectedYear}</strong> • Participantes: <strong>{bonusEmployees.length}</strong>
            </div>
          </div>
          
          {/* Resumo do Cálculo */}
          <div className={`mb-6 p-4 border rounded-lg ${
            selectedDepartment === 'Petrobras' 
              ? 'bg-yellow-50 border-yellow-200' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            <h3 className={`text-sm font-medium mb-3 ${
              selectedDepartment === 'Petrobras' ? 'text-yellow-900' : 'text-blue-900'
            }`}>🧮 Resumo do Cálculo Proporcional</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total do Fundo:</span>
                <div className="font-bold text-green-600">{formatCurrency(totalAmount)}</div>
              </div>
              <div>
                <span className="text-gray-600">Participantes Elegíveis:</span>
                <div className="font-bold">{bonusEmployees.length} funcionários</div>
              </div>
              <div>
                <span className="text-gray-600">Total Meses Trabalhados:</span>
                <div className="font-bold">{bonusEmployees.reduce((sum, emp) => sum + emp.monthsWorked, 0)} meses</div>
              </div>
              <div>
                <span className="text-gray-600">Valor por Mês:</span>
                <div className="font-bold text-purple-600">
                  {bonusEmployees.reduce((sum, emp) => sum + emp.monthsWorked, 0) > 0 
                    ? formatCurrency(totalAmount / bonusEmployees.reduce((sum, emp) => sum + emp.monthsWorked, 0))
                    : formatCurrency(0)
                  }
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-300">
              <p className="text-xs text-gray-600 text-center">
                <strong>Fórmula:</strong> Total do Fundo (R$ {totalAmount.toFixed(2)}) ÷ Total de Meses ({bonusEmployees.reduce((sum, emp) => sum + emp.monthsWorked, 0)}) = R$ {bonusEmployees.reduce((sum, emp) => sum + emp.monthsWorked, 0) > 0 ? (totalAmount / bonusEmployees.reduce((sum, emp) => sum + emp.monthsWorked, 0)).toFixed(2) : '0.00'} por mês trabalhado
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            {bonusEmployees
              .filter(emp => emp.monthsWorked > 0) // Mostrar apenas quem tem meses trabalhados
              .sort((a, b) => b.projectedBonus - a.projectedBonus) // Ordenar por valor decrescente
              .map((employee) => (
                <div key={employee.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4 mb-3">
                    <img
                      src={employee.avatar}
                      alt={employee.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{employee.name}</h3>
                      <p className="text-sm text-gray-500">
                        Admissão: {formatHireDate(employee.startDate)}
                      </p>
                      <p className="text-xs text-blue-600">
                        Participa desde: {getParticipationStartInfo(employee.startDate, selectedYear)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-1">
                        {employee.monthsWorked} {employee.monthsWorked === 1 ? 'mês' : 'meses'} em {selectedYear}
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(employee.projectedBonus)}
                      </div>
                      <div className="text-xs text-gray-500">bonificação projetada</div>
                    </div>
                  </div>
                  
                  {/* Barra de Proporção */}
                  <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all" 
                      style={{ 
                        width: `${bonusEmployees.reduce((sum, emp) => sum + emp.monthsWorked, 0) > 0 
                          ? (employee.monthsWorked / bonusEmployees.reduce((sum, emp) => sum + emp.monthsWorked, 0)) * 100 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-2">
                    <span>Proporção no fundo: {
                      bonusEmployees.reduce((sum, emp) => sum + emp.monthsWorked, 0) > 0 
                        ? ((employee.monthsWorked / bonusEmployees.reduce((sum, emp) => sum + emp.monthsWorked, 0)) * 100).toFixed(1)
                        : '0'
                    }%</span>
                    <span>
                      {bonusEmployees.reduce((sum, emp) => sum + emp.monthsWorked, 0) > 0 
                        ? formatCurrency(totalAmount / bonusEmployees.reduce((sum, emp) => sum + emp.monthsWorked, 0))
                        : formatCurrency(0)
                      } × {employee.monthsWorked}
                    </span>
                  </div>
                </div>
              ))}
            
            {bonusEmployees.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum funcionário elegível</h3>
                <p className="text-gray-500">
                  Verifique se há funcionários marcados como "Participa do Fundo" nas Configurações
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Year-end Distribution Preview */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="w-6 h-6 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Resumo da Distribuição {selectedYear}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {formatCurrency(totalAmount)}
              </div>
              <div className="text-sm text-gray-600">Total Acumulado</div>
              <div className="text-xs text-gray-500 mt-1">
                {closedProposals.length} licitação{closedProposals.length !== 1 ? 'ões' : ''} pendente{closedProposals.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {bonusEmployees.reduce((sum, emp) => sum + emp.monthsWorked, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Meses Participantes</div>
              <div className="text-xs text-gray-500 mt-1">
                {bonusEmployees.length} funcionário{bonusEmployees.length !== 1 ? 's' : ''} participando
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xl font-bold text-purple-600 mb-1">
              {bonusEmployees.reduce((sum, emp) => sum + emp.monthsWorked, 0) > 0 ? 
                formatCurrency(totalAmount / bonusEmployees.reduce((sum, emp) => sum + emp.monthsWorked, 0)) : 
                formatCurrency(0)
              }
            </div>
            <div className="text-sm text-gray-600">Valor por Mês Participante</div>
            <div className="text-xs text-gray-500 mt-1">
              Base de cálculo para distribuição proporcional
            </div>
          </div>
          
          {/* Detalhamento do Cálculo */}
          <div className="mt-4 pt-4 border-t border-green-300">
            <h4 className="text-sm font-medium text-green-900 mb-2">💡 Como funciona o cálculo:</h4>
            <div className="text-sm text-green-800 space-y-1">
              <p>• <strong>Valor por mês:</strong> Total do fundo ÷ Total de meses participantes</p>
              <p>• <strong>Bonificação individual:</strong> Valor por mês × Meses trabalhados em {selectedYear}</p>
              <p>• <strong>Participação:</strong> Apenas funcionários marcados como "Participa do Fundo"</p>
              <p>• <strong>Proporção:</strong> Baseada nos meses trabalhados no ano corrente</p>
            </div>
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma transação ainda</h3>
              <p className="text-sm text-gray-400">O histórico será alimentado quando contratos forem fechados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};