import React, { useState } from 'react';
import { FileText, Calendar } from 'lucide-react';
import { calculateMonthlyCommissions, getCommissionRateByRole, calculateContractCommission } from '../../utils/commissionUtils';
import { formatCurrency } from '../../utils/formatCurrency';
import { displayDate } from '../../utils/dateUtils';

interface EmployeeContractsListProps {
  employeeId: string;
  employeeRole: 'closer' | 'sdr';
  proposals: any[];
  employeeName: string;
  selectedYear: number;
}

export const EmployeeContractsList: React.FC<EmployeeContractsListProps> = ({
  employeeId,
  employeeRole,
  proposals,
  employeeName,
  selectedYear
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  
  const monthlyData = calculateMonthlyCommissions(proposals, employeeId, employeeRole, selectedYear);
  
  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];
  
  const selectedMonthKey = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
  const selectedMonthData = monthlyData[selectedMonthKey];
  const selectedMonthLabel = months.find(m => m.value === selectedMonth)?.label || '';
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-green-600" />
            <span>Contratos por Mês - {employeeName}</span>
          </h3>
          <p className="text-sm text-gray-600">Contratos fechados que geraram comissão</p>
        </div>
        
        {/* Month Selector */}
        <div className="flex items-center space-x-3">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {months.map(month => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Month Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-blue-900">{selectedMonthLabel} {selectedYear}</h4>
            <p className="text-sm text-blue-700">
              {selectedMonthData?.contracts.length || 0} contrato{selectedMonthData?.contracts.length !== 1 ? 's' : ''} fechado{selectedMonthData?.contracts.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(selectedMonthData?.commission || 0)}
            </div>
            <div className="text-sm text-blue-700">Comissão Total</div>
          </div>
        </div>
      </div>
      
      {/* Contracts List */}
      <div className="space-y-4 max-h-80 overflow-y-auto">
        {selectedMonthData?.contracts.length > 0 ? (
          selectedMonthData.contracts.map((contract: any) => {
            const closingDate = contract.closing_date ? new Date(contract.closing_date) : new Date(contract.created_at);
            const commissionRate = getCommissionRateByRole(contract, employeeRole);
            const commissionAmount = calculateContractCommission(contract.total_value, commissionRate);
            const hasPromotor = contract.closer_id && contract.sdr_id;

            return (
              <div key={contract.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{contract.client}</h4>
                    <p className="text-sm text-gray-600">
                      Fechado em {displayDate(contract.closing_date || contract.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(commissionAmount)}
                    </div>
                    <div className="text-sm text-gray-500">Comissão</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Valor Mensal:</span>
                    <div className="font-medium">{formatCurrency(contract.monthly_value)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Duração:</span>
                    <div className="font-medium">{contract.months} meses</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Valor Global:</span>
                    <div className="font-medium text-blue-600">{formatCurrency(contract.total_value)}</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className={`px-2 py-1 rounded-full font-medium ${
                    employeeRole === 'closer' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {employeeRole === 'closer' ? 'Como Closer' : 'Como Orçamentista'}
                  </span>
                  <span className="text-gray-500">
                    Taxa: {commissionRate}% {hasPromotor && '(com promotor)'} • ID: {contract.id.substring(0, 8)}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Mês sem comissão</h3>
            <p className="text-gray-500">
              Nenhum contrato foi fechado por {employeeName} em {selectedMonthLabel.toLowerCase()} {selectedYear}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};