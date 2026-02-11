import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface LicitacaoNotificacao {
  id: string;
  client: string; // orgao
  numero_pregao: string;
  plataforma: string;
  data_proxima_acao: string;
  observacao_proxima_acao?: string;
  email_1h_enviado: boolean;
  email_1d_enviado: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('🔔 Iniciando verificação de notificações de licitações...');
    
    // Configurar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis de ambiente do Supabase não configuradas');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Data atual
    const now = new Date();
    
    // Calcular janelas de tempo para notificações
    const oneHourBefore = new Date(now.getTime() + 59 * 60 * 1000); // 59 min no futuro
    const oneHourAfter = new Date(now.getTime() + 61 * 60 * 1000);  // 61 min no futuro
    
    const oneDayBefore = new Date(now.getTime() + 23 * 60 * 60 * 1000); // 23h no futuro
    const oneDayAfter = new Date(now.getTime() + 25 * 60 * 60 * 1000);  // 25h no futuro
    
    console.log('⏰ Janelas de tempo calculadas:', {
      now: now.toISOString(),
      oneHour: { before: oneHourBefore.toISOString(), after: oneHourAfter.toISOString() },
      oneDay: { before: oneDayBefore.toISOString(), after: oneDayAfter.toISOString() }
    });
    
    // 1. BUSCAR LICITAÇÕES PARA NOTIFICAÇÃO DE 1 HORA
    console.log('🔍 Buscando licitações para notificação de 1 hora...');
    const { data: licitacoes1h, error: error1h } = await supabase
      .from('proposals')
      .select('id, client, numero_pregao, plataforma, data_proxima_acao, observacao_proxima_acao, email_1h_enviado')
      .not('data_proxima_acao', 'is', null)
      .eq('email_1h_enviado', false)
      .gte('data_proxima_acao', oneHourBefore.toISOString())
      .lte('data_proxima_acao', oneHourAfter.toISOString());
    
    if (error1h) throw error1h;
    
    console.log(`📧 Encontradas ${licitacoes1h?.length || 0} licitações para notificação de 1 hora`);
    
    // 2. BUSCAR LICITAÇÕES PARA NOTIFICAÇÃO DE 1 DIA
    console.log('🔍 Buscando licitações para notificação de 1 dia...');
    const { data: licitacoes1d, error: error1d } = await supabase
      .from('proposals')
      .select('id, client, numero_pregao, plataforma, data_proxima_acao, observacao_proxima_acao, email_1d_enviado')
      .not('data_proxima_acao', 'is', null)
      .eq('email_1d_enviado', false)
      .gte('data_proxima_acao', oneDayBefore.toISOString())
      .lte('data_proxima_acao', oneDayAfter.toISOString());
    
    if (error1d) throw error1d;
    
    console.log(`📧 Encontradas ${licitacoes1d?.length || 0} licitações para notificação de 1 dia`);
    
    const emailsEnviados: string[] = [];
    
    // 3. PROCESSAR NOTIFICAÇÕES DE 1 HORA
    if (licitacoes1h && licitacoes1h.length > 0) {
      for (const licitacao of licitacoes1h) {
        try {
          console.log(`📧 Enviando notificação de 1 hora para: ${licitacao.client}`);
          
          const sucesso = await enviarEmailNotificacao(licitacao, '1h');
          
          if (sucesso) {
            // Marcar como enviado
            const { error: updateError } = await supabase
              .from('proposals')
              .update({ email_1h_enviado: true })
              .eq('id', licitacao.id);
            
            if (updateError) {
              console.error('❌ Erro ao atualizar flag 1h:', updateError);
            } else {
              console.log(`✅ Flag 1h atualizada para: ${licitacao.client}`);
              emailsEnviados.push(`1h: ${licitacao.client}`);
            }
          }
        } catch (error) {
          console.error(`❌ Erro ao processar notificação 1h para ${licitacao.client}:`, error);
        }
      }
    }
    
    // 4. PROCESSAR NOTIFICAÇÕES DE 1 DIA
    if (licitacoes1d && licitacoes1d.length > 0) {
      for (const licitacao of licitacoes1d) {
        try {
          console.log(`📧 Enviando notificação de 1 dia para: ${licitacao.client}`);
          
          const sucesso = await enviarEmailNotificacao(licitacao, '1d');
          
          if (sucesso) {
            // Marcar como enviado
            const { error: updateError } = await supabase
              .from('proposals')
              .update({ email_1d_enviado: true })
              .eq('id', licitacao.id);
            
            if (updateError) {
              console.error('❌ Erro ao atualizar flag 1d:', updateError);
            } else {
              console.log(`✅ Flag 1d atualizada para: ${licitacao.client}`);
              emailsEnviados.push(`1d: ${licitacao.client}`);
            }
          }
        } catch (error) {
          console.error(`❌ Erro ao processar notificação 1d para ${licitacao.client}:`, error);
        }
      }
    }
    
    // 5. RETORNAR RESULTADO
    const resultado = {
      success: true,
      timestamp: now.toISOString(),
      processadas: {
        oneHour: licitacoes1h?.length || 0,
        oneDay: licitacoes1d?.length || 0
      },
      emailsEnviados,
      message: `Verificação concluída: ${emailsEnviados.length} emails enviados`
    };
    
    console.log('🎉 Verificação de notificações concluída:', resultado);
    
    return new Response(JSON.stringify(resultado), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error('💥 Erro na função de notificação:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});

// Função para enviar email (simulada - implementar com serviço real)
async function enviarEmailNotificacao(licitacao: LicitacaoNotificacao, tipo: '1h' | '1d'): Promise<boolean> {
  try {
    console.log(`📨 Preparando email ${tipo} para licitação:`, {
      orgao: licitacao.client,
      pregao: licitacao.numero_pregao,
      proximaAcao: licitacao.data_proxima_acao
    });
    
    // Formatar data/hora para exibição
    const dataProximaAcao = new Date(licitacao.data_proxima_acao);
    const dataFormatada = dataProximaAcao.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
    
    // Preparar conteúdo do email
    const assunto = `🚨 ${tipo === '1h' ? 'URGENTE' : 'AVISO'}: Próxima ação de licitação - ${licitacao.client}`;
    
    const corpoEmail = `
      <h2>🚨 Aviso de Próxima Ação de Licitação</h2>
      
      <p><strong>📋 Órgão:</strong> ${licitacao.client}</p>
      <p><strong>🔢 Pregão Nº:</strong> ${licitacao.numero_pregao}</p>
      <p><strong>🌐 Plataforma:</strong> ${licitacao.plataforma}</p>
      <p><strong>📅 Data/Hora da Próxima Ação:</strong> ${dataFormatada}</p>
      
      ${licitacao.observacao_proxima_acao ? 
        `<p><strong>📝 Observações:</strong> ${licitacao.observacao_proxima_acao}</p>` : 
        ''
      }
      
      <hr>
      <p style="color: ${tipo === '1h' ? '#dc2626' : '#f59e0b'}; font-weight: bold;">
        ${tipo === '1h' ? 
          '⏰ Este é um aviso automático enviado 1 hora antes da ação' : 
          '📅 Este é um aviso automático enviado 1 dia antes da ação'
        }
      </p>
      <p style="font-size: 12px; color: #6b7280;">
        Sistema de Notificações Automatizadas - Grupo WWS
      </p>
    `;
    
    // SIMULAÇÃO DE ENVIO DE EMAIL
    // Em produção, implementar com serviço real como Resend, SendGrid, etc.
    console.log('📧 SIMULANDO ENVIO DE EMAIL:', {
      destinatarios: ['licitacoes@grupowws.com.br', 'contratos@grupowws.com.br'],
      assunto,
      corpo: corpoEmail,
      tipo,
      licitacao: licitacao.client
    });
    
    // TODO: Implementar envio real de email aqui
    // Exemplo com fetch para API externa:
    /*
    const emailData = {
      to: ['licitacoes@grupowws.com.br', 'contratos@grupowws.com.br'],
      subject: assunto,
      html: corpoEmail,
      from: 'sistema@grupowws.com.br'
    };
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });
    
    if (!response.ok) {
      throw new Error(`Erro no envio: ${response.statusText}`);
    }
    */
    
    // Simular sucesso
    await new Promise(resolve => setTimeout(resolve, 100)); // Simular delay
    
    console.log(`✅ Email ${tipo} enviado com sucesso para: ${licitacao.client}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Erro ao enviar email ${tipo}:`, error);
    return false;
  }
}