import React, { useState } from 'react';
import { Heart, MessageCircle, Send } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';

export const Recognition: React.FC = () => {
  const { data: employees = [] } = useSupabaseQuery('employees');
  const [recognitions] = useState([]); // Would come from database in real implementation
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [message, setMessage] = useState('');
  const [points, setPoints] = useState(50);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui você implementaria a lógica para enviar o reconhecimento
    console.log({ selectedEmployee, message, points });
    setSelectedEmployee('');
    setMessage('');
    setPoints(50);
  };

  if (employees.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🏆</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum funcionário cadastrado</h3>
          <p className="text-gray-500">Cadastre funcionários na aba "Funcionários" para enviar reconhecimentos</p>
        </div>
      </div>
    );
  }
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reconhecimento</h1>
        <p className="text-gray-600">Reconheça o bom trabalho dos seus colegas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Enviar Reconhecimento</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reconhecer colaborador
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecione um colaborador</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} - {employee.department}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descreva o que você está reconhecendo..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pontos ({points} pts)
              </label>
              <input
                type="range"
                min="25"
                max="200"
                step="25"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>25</span>
                <span>200</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Enviar Reconhecimento</span>
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Feed de Reconhecimentos</h2>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {recognitions.map((recognition) => (
              <div key={recognition.id} className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50 rounded-r-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <img
                    src={recognition.fromEmployee.avatar}
                    alt={recognition.fromEmployee.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {recognition.fromEmployee.name}
                    </span>
                    <span className="text-sm text-gray-500"> reconheceu </span>
                    <span className="text-sm font-medium text-gray-900">
                      {recognition.toEmployee.name}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 mb-2">
                  <MessageCircle className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-700">{recognition.message}</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-medium text-blue-600">
                      +{recognition.points} pontos
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(recognition.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};