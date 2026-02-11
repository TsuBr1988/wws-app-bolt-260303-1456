import { useMemo } from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { ContractWithAddendums, getValueForMonth, formatCurrency } from '../../lib/contractUtils';

interface MonthlyRevenueModalProps {
  contracts: ContractWithAddendums[];
  monthDate: Date;
  onClose: () => void;
}

export function MonthlyRevenueModal({ contracts, monthDate, onClose }: MonthlyRevenueModalProps) {
  const monthName = format(monthDate, 'MMMM/yyyy');

  const contractDetails = useMemo(() => {
    return contracts
      .map((contract) => {
        const value = getValueForMonth(contract, monthDate);
        return {
          contract,
          value,
        };
      })
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [contracts, monthDate]);

  const wwsTotal = contractDetails
    .filter((item) => item.contract.empresa === 'WWS')
    .reduce((sum, item) => sum + item.value, 0);

  const worldwideTotal = contractDetails
    .filter((item) => item.contract.empresa === 'Worldwide')
    .reduce((sum, item) => sum + item.value, 0);

  const total = wwsTotal + worldwideTotal;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold">Detalhamento por Contrato</h2>
            <p className="text-sm text-blue-100 capitalize">{monthName}</p>
          </div>
          <button onClick={onClose} className="hover:bg-blue-700 rounded-full p-1">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium mb-1">WWS</div>
              <div className="text-2xl font-bold text-green-900">{formatCurrency(wwsTotal)}</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-sm text-orange-600 font-medium mb-1">Worldwide</div>
              <div className="text-2xl font-bold text-orange-900">
                {formatCurrency(worldwideTotal)}
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium mb-1">Total</div>
              <div className="text-2xl font-bold text-blue-900">{formatCurrency(total)}</div>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Cliente
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Empresa
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Cidade
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Valor Mensal
                  </th>
                </tr>
              </thead>
              <tbody>
                {contractDetails.map((item, index) => (
                  <tr
                    key={item.contract.id}
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-t`}
                  >
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {item.contract.client_name}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          item.contract.empresa === 'WWS'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        {item.contract.empresa}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {item.contract.city || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-green-600 text-right">
                      {formatCurrency(item.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {contractDetails.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Nenhum contrato ativo neste mês
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
