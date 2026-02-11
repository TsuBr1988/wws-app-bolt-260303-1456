import React, { useState } from 'react';
import { FileText, AlertTriangle, Calendar, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { formatDateBR, getDaysUntil } from '../../utils/dateUtils';

export const CertidoesAvisoCard: React.FC = () => {
  const { data: certidoes = [], loading } = useSupabaseQuery('certidoes');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  console.log('🔍 [CertidoesAvisoCard] Dados carregados:', {
    totalCertidoes: certidoes.length,
    certidoes: certidoes.map(c => ({
      id: c.id,
      nome: c.nome,
      wws: c.data_vencimento_wws,
      worldwide: c.data_vencimento_worldwide
    }))
  });
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      </div>
    );
  }

  // Filtrar certidões que vencem em até 45 dias
  const certidoesProximasVencimento = certidoes.flatMap(certidao => {
    const avisos = [];
    
    // Verificar vencimento WWS
    if (certidao.data_vencimento_wws) {
      const daysUntilWWS = getDaysUntil(certidao.data_vencimento_wws);
      if (daysUntilWWS !== null && daysUntilWWS <= 45) {
        avisos.push({
          id: `${certidao.id}-wws`,
          nome: certidao.nome,
          empresa: 'WWS',
          dataVencimento: certidao.data_vencimento_wws,
          diasRestantes: daysUntilWWS
        });
      }
    }
    
    // Verificar vencimento Worldwide
    if (certidao.data_vencimento_worldwide) {
      const daysUntilWorldwide = getDaysUntil(certidao.data_vencimento_worldwide);
      if (daysUntilWorldwide !== null && daysUntilWorldwide <= 45) {
        avisos.push({
          id: `${certidao.id}-worldwide`,
          nome: certidao.nome,
          empresa: 'Worldwide',
          dataVencimento: certidao.data_vencimento_worldwide,
          diasRestantes: daysUntilWorldwide
        });
      }
    }
    
    return avisos;
  }).sort((a, b) => a.diasRestantes - b.diasRestantes); // Ordenar por urgência

  // Separar certidões por empresa
  const wwsCertidoes = certidoesProximasVencimento.filter(aviso => aviso.empresa === 'WWS');
  const worldwideCertidoes = certidoesProximasVencimento.filter(aviso => aviso.empresa === 'Worldwide');

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  // Determinar cor baseada na urgência
  const getUrgencyClass = (diasRestantes: number) => {
    if (diasRestantes < 0) {
      return 'bg-red-100 border-red-300 border-l-4 border-l-red-600';
    } else if (diasRestantes <= 7) {
      return 'bg-red-50 border-red-200 border-l-4 border-l-red-500';
    } else if (diasRestantes <= 15) {
      return 'bg-yellow-50 border-yellow-200 border-l-4 border-l-yellow-500';
    } else if (diasRestantes <= 30) {
      return 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-500';
    }
    return 'bg-gray-50 border-gray-200 border-l-4 border-l-gray-500';
  };

  const getUrgencyIcon = (diasRestantes: number) => {
    if (diasRestantes < 0) {
      return <AlertTriangle className="w-4 h-4 text-red-700" />;
    } else if (diasRestantes <= 7) {
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    } else if (diasRestantes <= 15) {
      return <Clock className="w-4 h-4 text-yellow-600" />;
    }
    return <Calendar className="w-4 h-4 text-blue-600" />;
  };

  const formatDaysRemaining = (diasRestantes: number) => {
    if (diasRestantes < 0) return `Vencida há ${Math.abs(diasRestantes)} dias`;
    if (diasRestantes === 0) return 'Vence hoje!';
    if (diasRestantes === 1) return 'Vence amanhã';
    return `${diasRestantes} dias restantes`;
  };

  const renderCertidaoCard = (aviso: any) => (
    <div 
      key={aviso.id} 
      className={`rounded-lg p-3 border transition-all ${getUrgencyClass(aviso.diasRestantes)}`}
    >
      <div className="text-center">
        <div className="flex justify-center mb-2">
          {getUrgencyIcon(aviso.diasRestantes)}
        </div>
        
        <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">{aviso.nome}</h4>
        
        <div className="text-xs text-gray-600 mb-2 flex items-center justify-center space-x-1">
          <Calendar className="w-3 h-3" />
          <span>{formatDateBR(aviso.dataVencimento)}</span>
        </div>
        
        <div className="text-center">
          <div className={`text-sm font-bold ${
            aviso.diasRestantes < 0 ? 'text-red-700' :
            aviso.diasRestantes <= 7 ? 'text-red-600' :
            aviso.diasRestantes <= 15 ? 'text-yellow-600' :
            'text-blue-600'
          }`}>
            {formatDaysRemaining(aviso.diasRestantes)}
          </div>
          <div className="text-xs text-gray-500">para vencimento</div>
        </div>
      </div>
      
      {aviso.diasRestantes < 0 ? (
        <div className="mt-2 text-xs text-red-800 bg-red-200 rounded px-2 py-1 text-center">
          🚨 VENCIDA: Renovação urgente necessária!
        </div>
      ) : aviso.diasRestantes <= 7 && (
        <div className="mt-2 text-xs text-red-700 bg-red-100 rounded px-2 py-1 text-center">
          ⚠️ Urgente: Renovação necessária em breve!
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-orange-600" />
            <span>Avisos de Certidões</span>
          </h3>
          <p className="text-sm text-gray-600">Certidões vencendo nos próximos 45 dias</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-orange-600">{certidoesProximasVencimento.length}</div>
          <div className="text-sm text-gray-500">Avisos</div>
        </div>
      </div>

      {/* Cards Expansíveis por Empresa */}
      <div className="space-y-4">
        {/* Card WWS */}
        {wwsCertidoes.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('wws')}
              className="w-full p-4 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-between border-b border-gray-200"
            >
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <div className="text-left">
                  <h4 className="text-lg font-semibold text-blue-900">WWS</h4>
                  <p className="text-sm text-blue-700">{wwsCertidoes.length} {wwsCertidoes.length === 1 ? 'certidão próxima' : 'certidões próximas'} ao vencimento</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{wwsCertidoes.length}</div>
                  <div className="text-xs text-blue-500">avisos</div>
                </div>
                {expandedSections.has('wws') ? (
                  <ChevronDown className="w-5 h-5 text-blue-600 transition-transform" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-blue-600 transition-transform" />
                )}
              </div>
            </button>
            
            {expandedSections.has('wws') && (
              <div className="p-4 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {wwsCertidoes.map(renderCertidaoCard)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Card Worldwide */}
        {worldwideCertidoes.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('worldwide')}
              className="w-full p-4 bg-green-50 hover:bg-green-100 transition-colors flex items-center justify-between border-b border-gray-200"
            >
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <div className="text-left">
                  <h4 className="text-lg font-semibold text-green-900">Worldwide</h4>
                  <p className="text-sm text-green-700">{worldwideCertidoes.length} {worldwideCertidoes.length === 1 ? 'certidão próxima' : 'certidões próximas'} ao vencimento</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{worldwideCertidoes.length}</div>
                  <div className="text-xs text-green-500">avisos</div>
                </div>
                {expandedSections.has('worldwide') ? (
                  <ChevronDown className="w-5 h-5 text-green-600 transition-transform" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-green-600 transition-transform" />
                )}
              </div>
            </button>
            
            {expandedSections.has('worldwide') && (
              <div className="p-4 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {worldwideCertidoes.map(renderCertidaoCard)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mensagem quando não há certidões próximas ao vencimento */}
        {wwsCertidoes.length === 0 && worldwideCertidoes.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Todas as certidões em dia!</h3>
            <p className="text-gray-500">Não há certidões vencendo nos próximos 45 dias</p>
          </div>
        )}
      </div>

      {/* Resumo por Urgência */}
      {certidoesProximasVencimento.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="text-lg font-bold text-red-600">
                {certidoesProximasVencimento.filter(a => a.diasRestantes < 0).length}
              </div>
              <div className="text-gray-600">Vencidas</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-600">
                {certidoesProximasVencimento.filter(a => a.diasRestantes >= 0 && a.diasRestantes <= 7).length}
              </div>
              <div className="text-gray-600">≤ 7 dias</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {certidoesProximasVencimento.filter(a => a.diasRestantes > 7 && a.diasRestantes <= 30).length}
              </div>
              <div className="text-gray-600">8-30 dias</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-600">
                {certidoesProximasVencimento.filter(a => a.diasRestantes > 30).length}
              </div>
              <div className="text-gray-600">31-45 dias</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};