import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Calendar, Clock, Building, AlertTriangle } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { formatToLocalDateExact, formatToLocalTimeExact } from '../../utils/dateUtils';

interface LicitacaoAlerta {
  id: string;
  client: string;
  numero_pregao: string;
  data_proxima_acao: string;
  observacao_proxima_acao?: string;
  plataforma?: string;
}

// Funções para gerenciar cache de alertas no localStorage
const CACHE_KEY = 'licitacao_alerta_exibido';

const getAlertCache = (): { [key: string]: boolean } => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (error) {
    console.error('❌ Erro ao ler cache de alertas:', error);
    return {};
  }
};

const saveAlertCache = (cache: { [key: string]: boolean }) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    console.log('💾 Cache de alertas salvo:', Object.keys(cache).length, 'entradas');
  } catch (error) {
    console.error('❌ Erro ao salvar cache de alertas:', error);
  }
};

const generateAlertKey = (proposalId: string, tipo: 'acao-proxima' | 'resumo', dataProximaAcao: string): string => {
  // Criar chave única baseada no ID, tipo e data/hora da ação
  const dateKey = new Date(dataProximaAcao).toISOString().split('T')[0]; // Apenas data para resumo
  const timeKey = tipo === 'acao-proxima' ? new Date(dataProximaAcao).toISOString() : dateKey; // Data/hora completa para ação próxima
  return `${proposalId}_${tipo}_${timeKey}`;
};

const wasAlertShown = (proposalId: string, tipo: 'acao-proxima' | 'resumo', dataProximaAcao: string): boolean => {
  const cache = getAlertCache();
  const alertKey = generateAlertKey(proposalId, tipo, dataProximaAcao);
  return cache[alertKey] === true;
};

const markAlertAsShown = (proposalId: string, tipo: 'acao-proxima' | 'resumo', dataProximaAcao: string) => {
  const cache = getAlertCache();
  const alertKey = generateAlertKey(proposalId, tipo, dataProximaAcao);
  cache[alertKey] = true;
  saveAlertCache(cache);
  console.log('✅ Alerta marcado como exibido:', alertKey);
};

export const LembreteLicitacoes: React.FC = () => {
  const [alertas10Min, setAlertas10Min] = useState<LicitacaoAlerta[]>([]);
  const [alertasDiaSeguinte, setAlertasDiaSeguinte] = useState<LicitacaoAlerta[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [tipoAlerta, setTipoAlerta] = useState<'acao-proxima' | 'resumo' | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<any>({});
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const originalTitle = useRef(document.title);
  const alertasJaProcessados = useRef(new Set<string>());

  // Buscar todas as propostas com data_proxima_acao - FORÇA BUSCA A CADA RENDER
  const { data: proposals = [], refetch } = useSupabaseQuery('proposals', {});

  // Forçar refetch a cada verificação
  useEffect(() => {
    const forceRefresh = setInterval(() => {
      refetch();
    }, 30000); // Refetch a cada 30 segundos

    return () => clearInterval(forceRefresh);
  }, [refetch]);

  // Função para obter horário de São Paulo (UTC-3)
  const getHorarioSaoPaulo = () => {
    const agoraUTC = new Date();
    const saoPaulo = new Date(agoraUTC.getTime() - 3 * 60 * 60 * 1000); // Subtrair 3 horas
    return saoPaulo;
  };

  // Verificar licitações para os dois tipos de alerta
  const verificarLicitacoes = () => {
    const agora = getHorarioSaoPaulo();
    const horaAtual = agora.getHours();
    const minutoAtual = agora.getMinutes();
    
    console.log('🔍 [LembreteLicitacoes] VERIFICAÇÃO DETALHADA:', {
      horarioUTC: new Date().toISOString(),
      horarioSaoPaulo: agora.toISOString(),
      horaMinuto: `${horaAtual}:${minutoAtual.toString().padStart(2, '0')}`,
      totalPropostas: proposals.length,
      checkTime: agora.toLocaleTimeString('pt-BR'),
      proposalsComDataProximaAcao: proposals.filter(p => p.data_proxima_acao).length
    });

    // LOG DETALHADO DE TODAS AS PROPOSTAS
    console.log('📋 [LembreteLicitacoes] TODAS AS PROPOSTAS COM data_proxima_acao:', 
      proposals
        .filter(p => p.data_proxima_acao)
        .map(p => ({
          client: p.client,
          numero_pregao: p.numero_pregao,
          data_proxima_acao_raw: p.data_proxima_acao,
          data_proxima_acao_parsed: new Date(p.data_proxima_acao).toISOString(),
          minutosAteAcao: Math.floor((new Date(p.data_proxima_acao).getTime() - agora.getTime()) / 60000),
          horariosFormatados: {
            saoPaulo: new Date(p.data_proxima_acao).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
            utc: new Date(p.data_proxima_acao).toISOString()
          }
        }))
    );

    // ========== LÓGICA 1: NOTIFICAÇÃO DE AÇÃO PRÓXIMA (10 MINUTOS) - 24H/DIA ==========
    let notificacoesAcaoProxima: LicitacaoAlerta[] = [];
    
    console.log('🚨 [NotificaçãoAçãoProxima] Verificando alertas de 10 minutos (24h/dia)...');
    const em10Minutos = new Date(agora.getTime() + 10 * 60 * 1000);
    const em8Minutos = new Date(agora.getTime() + 8 * 60 * 1000); // Janela de 2 minutos para capturar

    console.log('⏰ [NotificaçãoAçãoProxima] Janela de verificação:', {
      agoraSaoPaulo: agora.toISOString(),
      em8Minutos: em8Minutos.toISOString(),
      em10Minutos: em10Minutos.toISOString(),
      janelaMinutos: '8-10 minutos no futuro',
      verificacao: '24 horas por dia'
    });

    notificacoesAcaoProxima = proposals.filter(proposal => {
      if (!proposal.data_proxima_acao) {
        console.log('❌ [NotificaçãoAçãoProxima] Proposta sem data_proxima_acao:', proposal.client);
        return false;
      }
      
      const dataProximaAcao = new Date(proposal.data_proxima_acao);
      
      // Verificar se está na janela de 8-10 minutos no futuro
      const estaNaJanela = dataProximaAcao >= em8Minutos && dataProximaAcao <= em10Minutos;
      
      // Evitar alertas duplicados para ação próxima
      const chaveAlerta = `acao-proxima-${proposal.id}-${proposal.data_proxima_acao}`;
      const jaProcessado = alertasJaProcessados.current.has(chaveAlerta);
      
      console.log('⏰ [NotificaçãoAçãoProxima] Verificando proposta:', {
        client: proposal.client,
        dataProximaAcao_raw: proposal.data_proxima_acao,
        dataProximaAcao_parsed: dataProximaAcao.toISOString(),
        agoraSaoPaulo: agora.toISOString(),
        em8Min: em8Minutos.toISOString(),
        em10Min: em10Minutos.toISOString(),
        estaNaJanela,
        jaProcessado,
        chaveAlerta,
        minutosRestantes: Math.floor((dataProximaAcao.getTime() - agora.getTime()) / 60000),
        comparacaoDetalhada: {
          dataAcao_vs_em8Min: dataProximaAcao >= em8Minutos ? 'OK (>=)' : 'FORA (<)',
          dataAcao_vs_em10Min: dataProximaAcao <= em10Minutos ? 'OK (<=)' : 'FORA (>)',
          intervaloValido: dataProximaAcao >= em8Minutos && dataProximaAcao <= em10Minutos ? 'SIM' : 'NÃO'
        }
      });
      
      if (estaNaJanela && !jaProcessado) {
        console.log('🚨 [NotificaçãoAçãoProxima] LICITAÇÃO PRÓXIMA ENCONTRADA!', {
          orgao: proposal.client,
          pregao: proposal.numero_pregao,
          dataProximaAcao: proposal.data_proxima_acao,
          minutosRestantes: Math.floor((dataProximaAcao.getTime() - agora.getTime()) / 60000),
          chaveAlerta
        });
        alertasJaProcessados.current.add(chaveAlerta);
        return true;
      }
      
      return false;
    });

    // ========== LÓGICA 2: NOTIFICAÇÃO DE RESUMO (16:30) - AÇÕES DO DIA SEGUINTE ==========
    let notificacoesResumo: LicitacaoAlerta[] = [];
    
    console.log('📅 [NotificaçãoResumo] Verificando se é 16:30:', {
      horaAtual: horaAtual,
      minutoAtual: minutoAtual,
      condicao1630: horaAtual === 16 && minutoAtual >= 30 && minutoAtual <= 31,
      status: horaAtual === 16 && minutoAtual >= 30 && minutoAtual <= 31 ? 'EXECUTAR' : 'PULAR'
    });
    
    if (horaAtual === 16 && minutoAtual >= 30 && minutoAtual <= 31) {
      console.log('📅 [NotificaçãoResumo] EXECUTANDO verificação do resumo diário às 16:30...');
      
      const amanha = new Date(agora);
      amanha.setDate(amanha.getDate() + 1);
      const inicioAmanha = new Date(amanha.getFullYear(), amanha.getMonth(), amanha.getDate(), 0, 0, 0);
      const fimAmanha = new Date(amanha.getFullYear(), amanha.getMonth(), amanha.getDate(), 23, 59, 59);

      console.log('📅 [NotificaçãoResumo] Configuração do dia seguinte:', {
        hoje: agora.toDateString(),
        amanha: amanha.toDateString(),
        inicioAmanha: inicioAmanha.toISOString(),
        fimAmanha: fimAmanha.toISOString(),
        totalProposals: proposals.length,
        proposalsComDataProximaAcao: proposals.filter(p => p.data_proxima_acao).length
      });

      // LOG DETALHADO DE TODAS AS PROPOSTAS PARA DEBUG
      console.log('🔍 [NotificaçãoResumo] TODAS as propostas com data_proxima_acao:',
        proposals
          .filter(p => p.data_proxima_acao)
          .map(p => {
            const dataAcao = new Date(p.data_proxima_acao);
            return {
              client: p.client,
              numero_pregao: p.numero_pregao,
              data_proxima_acao: p.data_proxima_acao,
              dataFormatada: dataAcao.toLocaleDateString('pt-BR'),
              horaFormatada: dataAcao.toLocaleTimeString('pt-BR'),
              éAmanha: dataAcao >= inicioAmanha && dataAcao <= fimAmanha,
              diferençaDias: Math.floor((dataAcao.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))
            };
          })
      );

      notificacoesResumo = proposals.filter(proposal => {
        if (!proposal.data_proxima_acao) return false;
        
        const dataProximaAcao = new Date(proposal.data_proxima_acao);
        const estaNoDiaSeguinte = dataProximaAcao >= inicioAmanha && dataProximaAcao <= fimAmanha;
        
        // Verificar se já foi exibido (usando localStorage para persistir entre sessões)
        const jaExibido = wasAlertShown(proposal.id, 'resumo', proposal.data_proxima_acao);
        
        console.log('📅 [NotificaçãoResumo] Verificando proposta para amanhã:', {
          client: proposal.client,
          numero_pregao: proposal.numero_pregao,
          dataProximaAcao_raw: proposal.data_proxima_acao,
          dataProximaAcao_parsed: dataProximaAcao.toISOString(),
          inicioAmanha: inicioAmanha.toISOString(),
          fimAmanha: fimAmanha.toISOString(),
          estaNoDiaSeguinte,
          jaExibido,
          alertKey: generateAlertKey(proposal.id, 'resumo', proposal.data_proxima_acao)
        });
        
        if (estaNoDiaSeguinte && !jaExibido) {
          console.log('📅 [NotificaçãoResumo] LICITAÇÃO DO DIA SEGUINTE ENCONTRADA!', {
            orgao: proposal.client,
            pregao: proposal.numero_pregao,
            dataProximaAcao: proposal.data_proxima_acao,
            alertKey: generateAlertKey(proposal.id, 'resumo', proposal.data_proxima_acao)
          });
          return true;
        }
        
        return false;
      });

      console.log(`📅 [NotificaçãoResumo] Verificação do resumo diário CONCLUÍDA: ${notificacoesResumo.length} ações encontradas para amanhã`);
    } else {
      console.log('📅 [NotificaçãoResumo] FORA DO HORÁRIO de verificação às 16:30. Horário atual:', {
        hora: horaAtual,
        minuto: minutoAtual,
        horarioCompleto: `${horaAtual}:${minutoAtual.toString().padStart(2, '0')}`,
        condicaoNecessaria: 'Hora === 16 && Minuto >= 30 && Minuto <= 31',
        proximaVerificacao: horaAtual < 16 || (horaAtual === 16 && minutoAtual < 30) ? 
          `Próxima verificação às 16:30` : 
          'Próxima verificação amanhã às 16:30'
      });
    }

    // ATUALIZAR ESTADOS SE ENCONTROU ALERTAS
    if (notificacoesAcaoProxima.length > 0) {
      console.log('🚨 [ALERTA] ACIONANDO Notificação de Ação Próxima:', notificacoesAcaoProxima.length, 'licitações');
      setAlertas10Min(notificacoesAcaoProxima);
      setTipoAlerta('acao-proxima');
      setShowModal(true);
      iniciarAlertaSonoro();
      atualizarTituloAba(notificacoesAcaoProxima.length, '10 minutos');
    } else if (notificacoesResumo.length > 0) {
      console.log('📅 [ALERTA] ACIONANDO Notificação de Resumo:', notificacoesResumo.length, 'licitações');
      setAlertasDiaSeguinte(notificacoesResumo);
      setTipoAlerta('resumo');
      setShowModal(true);
      iniciarAlertaSonoro();
      atualizarTituloAba(notificacoesResumo.length, 'amanhã');
    } else {
      console.log('ℹ️ [LembreteLicitacoes] Nenhum alerta necessário nesta verificação');
    }
    
    // Atualizar debug info
    setDebugInfo({
      ultimaVerificacao: agora.toLocaleTimeString('pt-BR'),
      propostsTotal: proposals.length,
      comDataProximaAcao: proposals.filter(p => p.data_proxima_acao).length,
      notificacoesAcaoProxima: notificacoesAcaoProxima.length,
      notificacoesResumo: notificacoesResumo.length,
      é1630: horaAtual === 16 && minutoAtual >= 30 && minutoAtual <= 31,
      horarioAtual: `${horaAtual}:${minutoAtual.toString().padStart(2, '0')}`,
      cacheAlertas: Object.keys(getAlertCache()).length
    });
    
    setLastCheckTime(agora.toLocaleTimeString('pt-BR'));
  };

  // Iniciar som de alerta repetindo
  const iniciarAlertaSonoro = () => {
    try {
      // Parar som anterior se existir
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      const audio = new Audio('/sounds/Som_alerta.mp3');
      audio.loop = true;
      audio.volume = 0.7;
      audioRef.current = audio;
      
      audio.play().catch((err) => {
        console.error("🔇 Erro ao tentar tocar som:", err);
        tentarBeepFallback();
      });
    } catch (error) {
      console.error('❌ Erro ao iniciar som:', error);
      tentarBeepFallback();
    }
  };

  // Parar som de alerta
  const pararAlertaSonoro = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  // Fallback: beep simples usando Web Audio API
  const tentarBeepFallback = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const beepLoop = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
        
        // Repetir a cada 2 segundos até modal fechar
        if (showModal) {
          setTimeout(beepLoop, 2000);
        }
      };
      
      beepLoop();
      console.log('🎵 [LembreteLicitacoes] Fallback: beep repetindo');
    } catch (error) {
      console.warn('❌ [LembreteLicitacoes] Fallback de áudio também falhou:', error);
    }
  };

  // Atualizar título da aba
  const atualizarTituloAba = (quantidade: number, quando: string) => {
    document.title = `🔔 (${quantidade}) Ações ${quando}!`;
  };

  // Restaurar título original
  const restaurarTituloAba = () => {
    document.title = originalTitle.current;
  };

  // Fechar modal e parar tudo
  const fecharModal = () => {
    // Marcar todos os alertas exibidos como visualizados
    const alertasParaMarcar = tipoAlerta === 'acao-proxima' ? alertas10Min : alertasDiaSeguinte;
    
    alertasParaMarcar.forEach(licitacao => {
      markAlertAsShown(licitacao.id, tipoAlerta!, licitacao.data_proxima_acao);
    });
    
    console.log(`✅ [LembreteLicitacoes] ${alertasParaMarcar.length} alertas marcados como visualizados`);
    
    setShowModal(false);
    setAlertas10Min([]);
    setAlertasDiaSeguinte([]);
    setTipoAlerta(null);
    pararAlertaSonoro();
    restaurarTituloAba();
    console.log('❌ [LembreteLicitacoes] Modal fechado, alertas limpos e marcados como visualizados');
  };

  // Configurar verificação periódica
  useEffect(() => {
    console.log('🚀 [LembreteLicitacoes] Iniciando sistema de alertas...');
    
    // Guardar título original
    originalTitle.current = document.title;
    
    // Verificação inicial imediata
    verificarLicitacoes();
    
    // Configurar verificação a cada 1 minuto
    const interval = setInterval(() => {
      console.log('⏰ [LembreteLicitacoes] Executando verificação periódica...');
      verificarLicitacoes();
    }, 60000); // 60 segundos
    
    // Cleanup ao desmontar
    return () => {
      console.log('🧹 [LembreteLicitacoes] Limpando sistema de alertas...');
      clearInterval(interval);
      pararAlertaSonoro();
      restaurarTituloAba();
    };
  }, [proposals]); // Dependente das propostas

  // Limpar tudo quando componente desmonta
  useEffect(() => {
    return () => {
      pararAlertaSonoro();
      restaurarTituloAba();
    };
  }, []);


  // Se não há alertas ativos, não renderizar nada
  if (!showModal) {
    return null;
  }

  const alertasAtivos = tipoAlerta === 'acao-proxima' ? alertas10Min : alertasDiaSeguinte;
  const tituloModal = tipoAlerta === 'acao-proxima' 
    ? '🚨 Notificação de Ação Próxima (10 minutos)'
    : '📅 Notificação de Resumo - Ações de Amanhã';

  return (
    <div>
      {/* Modal de Alerta */}
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Bell className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{tituloModal}</h2>
                  <p className="text-red-100">
                    {alertasAtivos.length} ação{alertasAtivos.length > 1 ? 'ões' : ''} 
                    {tipoAlerta === 'acao-proxima' ? ' em aproximadamente 10 minutos' : ' programada(s) para amanhã'}
                  </p>
                  <div className="text-xs text-red-200 mt-1">
                    Última verificação: {lastCheckTime} • Horário de São Paulo
                  </div>
                </div>
              </div>
              <button
                onClick={fecharModal}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {alertasAtivos.map((licitacao, index) => {
                const dataProximaAcao = new Date(licitacao.data_proxima_acao);
                const agora = getHorarioSaoPaulo();
                const minutosRestantes = Math.max(0, Math.floor((dataProximaAcao.getTime() - agora.getTime()) / 60000));
                
                return (
                  <div 
                    key={licitacao.id} 
                    className="border-l-4 border-l-red-500 bg-red-50 rounded-lg p-4 hover:bg-red-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                            #{index + 1}
                          </span>
                          <h3 className="text-lg font-bold text-gray-900">{licitacao.client}</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700 mb-3">
                          <div className="flex items-center space-x-2">
                            <Building className="w-4 h-4 text-gray-500" />
                            <span><strong>Pregão:</strong> {licitacao.numero_pregao || 'Não informado'}</span>
                          </div>
                          
                          {licitacao.plataforma && (
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span><strong>Plataforma:</strong> {licitacao.plataforma}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="bg-white border border-red-200 rounded-lg p-3 mb-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <Clock className="w-4 h-4 text-red-500" />
                            <strong className="text-red-800">Próxima Ação:</strong>
                          </div>
                          <div className="text-base font-bold text-red-900">
                            📅 {formatToLocalDateExact(licitacao.data_proxima_acao)} às {formatToLocalTimeExact(licitacao.data_proxima_acao)}
                          </div>
                          <div className="text-sm text-red-700 mt-1">
                            🕒 <strong>Horário UTC original:</strong> {licitacao.data_proxima_acao}
                          </div>
                          {tipoAlerta === 'acao-proxima' && (
                            <div className="text-sm text-red-700 mt-1">
                              ⏰ <strong>Em {minutosRestantes} minuto{minutosRestantes !== 1 ? 's' : ''}!</strong>
                            </div>
                          )}
                          {tipoAlerta === 'resumo' && (
                            <div className="text-sm text-red-700 mt-1">
                              📅 <strong>Programado para amanhã</strong>
                            </div>
                          )}
                        </div>
                        
                        {licitacao.observacao_proxima_acao && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <AlertTriangle className="w-4 h-4 text-blue-500" />
                              <strong className="text-blue-800 text-sm">Observações:</strong>
                            </div>
                            <p className="text-sm text-blue-700">{licitacao.observacao_proxima_acao}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right ml-4">
                        {tipoAlerta === 'acao-proxima' && (
                          <>
                            <div className={`text-2xl font-bold ${
                              minutosRestantes <= 1 ? 'text-red-700 animate-pulse' :
                              minutosRestantes <= 3 ? 'text-orange-600' :
                              'text-yellow-600'
                            }`}>
                              {minutosRestantes}
                            </div>
                            <div className="text-sm text-gray-600">
                              minuto{minutosRestantes !== 1 ? 's' : ''}
                            </div>
                            <div className="text-xs text-gray-500">restantes</div>
                          </>
                        )}
                        {tipoAlerta === 'resumo' && (
                          <>
                            <div className="text-2xl font-bold text-blue-600">
                              📅
                            </div>
                            <div className="text-sm text-gray-600">Amanhã</div>
                            <div className="text-xs text-gray-500">às {formatToLocalTimeExact(licitacao.data_proxima_acao)}</div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {tipoAlerta === 'acao-proxima' && minutosRestantes <= 1 && (
                      <div className="mt-3 bg-red-200 border border-red-400 rounded-lg p-2 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <AlertTriangle className="w-5 h-5 text-red-700 animate-bounce" />
                          <span className="text-red-800 font-bold text-sm">
                            ⚠️ AÇÃO IMINENTE! Menos de 1 minuto restante!
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Footer do Modal */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Última verificação: {lastCheckTime} (São Paulo)</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {tipoAlerta === 'acao-proxima' 
                      ? 'Notificação de Ação Próxima: Alertas 10 min antes • Verifica 24h/dia'
                      : 'Notificação de Resumo: 16:30 para ações de amanhã • Lista diária'
                    }
                  </div>
                </div>
                
                <button
                  onClick={fecharModal}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Bell className="w-4 h-4" />
                  <span>Entendi!</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};