import React from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';

export const Rankings: React.FC = () => {
  const { data: employees = [] } = useSupabaseQuery('employees');
  
  const rankedEmployees = employees
    .sort((a, b) => b.points - a.points)
    .map((employee, index) => ({ ...employee, rank: index + 1 }));

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-gray-500 font-bold">{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 2: return 'bg-gradient-to-r from-gray-300 to-gray-500';
      case 3: return 'bg-gradient-to-r from-amber-400 to-amber-600';
      default: return 'bg-gray-100';
    }
  };

  if (employees.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum funcionário cadastrado</h3>
          <p className="text-gray-500">Cadastre funcionários na aba "Funcionários" para ver o ranking</p>
        </div>
      </div>
    );
  }
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rankings</h1>
        <p className="text-gray-600">Classificação dos colaboradores por pontuação</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Ranking Geral</h2>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {rankedEmployees.map((employee) => (
              <div key={employee.id} className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className={`w-12 h-12 rounded-full ${getRankColor(employee.rank)} flex items-center justify-center`}>
                  {getRankIcon(employee.rank)}
                </div>
                
                <img
                  src={employee.avatar}
                  alt={employee.name}
                  className="w-12 h-12 rounded-full"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-medium text-gray-900">{employee.name}</h3>
                    <span className="text-sm text-gray-500">#{employee.rank}</span>
                  </div>
                  <p className="text-sm text-gray-600">{employee.department} • {employee.position}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm text-gray-500">Level {employee.level}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      employee.role === 'Closer' ? 'bg-blue-100 text-blue-800' :
                      employee.role === 'SDR' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {employee.role}
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{employee.points.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">pontos</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};