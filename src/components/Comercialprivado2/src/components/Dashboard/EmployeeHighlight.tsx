import React from 'react';
import { Trophy, Star, Target, Calendar } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';

export const EmployeeHighlight: React.FC = () => {
  const { data: employees = [], loading } = useSupabaseQuery('employees', {
    orderBy: { column: 'points', ascending: false }
  });
  
  const { data: weeklyPerformanceData = [] } = useSupabaseQuery('weekly_performance', {
    orderBy: { column: 'week_ending_date', ascending: false }
  });

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
        </div>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum funcionário cadastrado</p>
        </div>
      </div>
    );
  }

  // Calculate current month winner based on weekly performance data
  const getCurrentMonthWinner = () => {
    const currentDate = new Date();
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const employeeScores: { [key: string]: number } = {};

    // Initialize all employees with zero scores
    employees.forEach(employee => {
      employeeScores[employee.id] = 0;
    });

    // Sum up weekly performance data for current month
    weeklyPerformanceData.forEach(weekData => {
      const weekDate = new Date(weekData.week_ending_date);
      
      if (weekDate >= currentMonthStart && weekDate <= currentMonthEnd) {
        if (employeeScores[weekData.employee_id] !== undefined) {
          employeeScores[weekData.employee_id] += weekData.total_points || 0;
        }
      }
    });

    // Find winner
    const sortedEmployees = employees
      .map(employee => ({
        ...employee,
        monthlyPoints: employeeScores[employee.id] || 0
      }))
      .sort((a, b) => b.monthlyPoints - a.monthlyPoints);

    return sortedEmployees;
  };

  const rankedEmployees = getCurrentMonthWinner();
  const winner = rankedEmployees[0] || {
    name: 'Nenhum funcionário',
    avatar: '',
    role: '',
    department: '',
    monthlyPoints: 0
  };
  const secondPlace = rankedEmployees[1];
  const thirdPlace = rankedEmployees[2];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2: return <Star className="w-4 h-4 text-gray-400" />;
      case 3: return <Target className="w-4 h-4 text-amber-600" />;
      default: return null;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-yellow-600';
      case 2: return 'from-gray-300 to-gray-500';
      case 3: return 'from-amber-400 to-amber-600';
      default: return 'from-gray-200 to-gray-400';
    }
  };

  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-sm border-2 border-yellow-200 p-6 h-full flex flex-col">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h2 className="text-lg font-bold text-gray-900">Destaque do Mês</h2>
        </div>
        <p className="text-sm text-gray-600 capitalize">{currentMonth}</p>
      </div>

      {/* Winner Highlight */}
      <div className="text-center mb-4">
        <div className="relative inline-block">
          <img
            src={winner.avatar}
            alt={winner.name}
            className="w-16 h-16 rounded-full border-4 border-yellow-400 shadow-lg mx-auto"
          />
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
            <Trophy className="w-4 h-4 text-white" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mt-2">{winner.name}</h3>
        <p className="text-sm text-gray-600">{winner.role} • {winner.department}</p>
        <div className="mt-2">
          <span className="text-xl font-bold text-yellow-600">{winner.monthlyPoints.toLocaleString()}</span>
          <span className="text-sm text-gray-500 ml-1">pontos</span>
        </div>
        <div className="mt-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            winner.role === 'Closer' ? 'bg-blue-100 text-blue-800' :
            winner.role === 'SDR' ? 'bg-green-100 text-green-800' :
            'bg-purple-100 text-purple-800'
          }`}>
            Level {winner.level}
          </span>
        </div>
      </div>

      {/* Second and Third Place */}
      {(secondPlace || thirdPlace) && (
        <div className="flex-1 space-y-2">
          <h4 className="text-sm font-medium text-gray-700 text-center mb-2">Pódio do Mês</h4>
          
          {secondPlace && (
            <div className="flex items-center space-x-3 p-2 bg-white rounded-lg border border-gray-200">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getRankColor(2)} flex items-center justify-center`}>
                {getRankIcon(2)}
              </div>
              <img
                src={secondPlace.avatar}
                alt={secondPlace.name}
                className="w-8 h-8 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{secondPlace.name}</p>
                <p className="text-xs text-gray-500">{secondPlace.role}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-700">{secondPlace.monthlyPoints.toLocaleString()}</p>
                <p className="text-xs text-gray-500">pts</p>
              </div>
            </div>
          )}

          {thirdPlace && (
            <div className="flex items-center space-x-3 p-2 bg-white rounded-lg border border-gray-200">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getRankColor(3)} flex items-center justify-center`}>
                {getRankIcon(3)}
              </div>
              <img
                src={thirdPlace.avatar}
                alt={thirdPlace.name}
                className="w-8 h-8 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{thirdPlace.name}</p>
                <p className="text-xs text-gray-500">{thirdPlace.role}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-700">{thirdPlace.monthlyPoints.toLocaleString()}</p>
                <p className="text-xs text-gray-500">pts</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Achievement Badge */}
      <div className="mt-auto pt-3 text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-2 bg-yellow-100 border border-yellow-300 rounded-full">
          <Calendar className="w-4 h-4 text-yellow-600" />
          <span className="text-xs font-medium text-yellow-800">
            Líder de {currentMonth}
          </span>
        </div>
      </div>
    </div>
  );
};