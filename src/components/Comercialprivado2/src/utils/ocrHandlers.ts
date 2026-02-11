import Tesseract from 'tesseract.js';

/**
 * Função para normalizar números brasileiros (remove pontos de milhar, troca vírgula por ponto)
 */
function toNumberBr(s?: string | null): number | null {
  if (!s) return null;
  const cleanString = String(s)
    .replace(/\s+/g, '') // Remove espaços
    .replace(/\./g, '') // Remove pontos de milhar
    .replace(',', '.'); // Troca vírgula por ponto
  const num = parseFloat(cleanString);
  return isNaN(num) ? null : num;
}

/**
 * Normaliza objeto convertendo valores para inteiros válidos
 */
function normalizeInts(obj: any): any {
  const out: any = {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    out[k] = (v == null || isNaN(v)) ? null : Math.round(v);
  }
  return out;
}

/**
 * Executa OCR na imagem
 */
export async function runOcr(imageUrl: string): Promise<string> {
  try {
    console.log('🔍 Iniciando OCR para:', imageUrl);
    const { data } = await Tesseract.recognize(imageUrl, 'por+eng', {
      logger: m => console.log('📄 OCR Status:', m)
    });
    console.log('✅ OCR concluído. Texto extraído:', data.text);
    return data.text || '';
  } catch (error) {
    console.error('Erro no OCR:', error);
    throw new Error('Erro ao processar imagem. Tente novamente.');
  }
}

/**
 * Detecta o tipo de template baseado no texto extraído
 */
export function detectTemplate(text: string): 'conexoes' | 'perfil' | 'metas' | null {
  const lowerText = text.toLowerCase();
  
  console.log('🎯 Detectando template no texto:', lowerText.substring(0, 200) + '...');
  
  // Conexões por Tipo de Tarefa
  if (lowerText.includes('conexões') || 
      lowerText.includes('tarefas realizadas') || 
      lowerText.includes('taxa de conexão') ||
      lowerText.includes('responsáveis') ||
      (lowerText.includes('email') && lowerText.includes('telefone'))) {
    console.log('✅ Template detectado: conexoes');
    return 'conexoes';
  }
  
  // Desempenho por Perfil
  if (lowerText.includes('novos contatos') || 
      lowerText.includes('contatos únicos') || 
      lowerText.includes('mql') ||
      lowerText.includes('perfil')) {
    console.log('✅ Template detectado: perfil');
    return 'perfil';
  }
  
  // Resumo de Metas
  if (lowerText.includes('ativações') || 
      lowerText.includes('atividades diárias') || 
      lowerText.includes('conexões do mês') ||
      lowerText.includes('metas')) {
    console.log('✅ Template detectado: metas');
    return 'metas';
  }
  
  console.log('❌ Nenhum template detectado');
  return null;
}

/**
 * Parser para relatório "Conexões por Tipo de Tarefa"
 */
export function parseConexoes(text: string): any {
  const gInt = (re: RegExp): number | null => {
    const m = text.match(re);
    return m ? toNumberBr(m[1]) : null;
  };

  const out: any = {};

  // Email - buscar padrões próximos a indicadores de email
  const emailSection = text.match(/(email|e-?mail)[\s\S]{0,200}/gi)?.[0] || '';
  out.emails_replied = gInt(/(?:email|e-?mail)[\s\S]*?(?:conex[õo]es?|conectad[ao]s?)[^\d]*([\d\.\,]+)/i) ||
                      gInt(/(?:conex[õo]es?|conectad[ao]s?)[\s\S]*?(?:email|e-?mail)[^\d]*([\d\.\,]+)/i);
  out.emails_sent = gInt(/(?:email|e-?mail)[\s\S]*?(?:tarefas realizadas|enviados?)[^\d]*([\d\.\,]+)/i);

  // Telefone
  out.calls_connected = gInt(/(?:telefone|liga[çc][õo]es?|chamadas?)[\s\S]*?(?:conex[õo]es?|conectad[ao]s?)[^\d]*([\d\.\,]+)/i);
  out.calls_made = gInt(/(?:telefone|liga[çc][õo]es?|chamadas?)[\s\S]*?(?:tarefas realizadas|feitas?)[^\d]*([\d\.\,]+)/i);

  // WhatsApp
  out.whatsapp_connected = gInt(/whats?app[\s\S]*?(?:conex[õo]es?|conectad[ao]s?)[^\d]*([\d\.\,]+)/i);
  out.whatsapp_sent = gInt(/whats?app[\s\S]*?(?:tarefas realizadas|enviados?)[^\d]*([\d\.\,]+)/i);

  // LinkedIn
  out.linkedin_connected = gInt(/linkedin[\s\S]*?(?:conex[õo]es?|conectad[ao]s?)[^\d]*([\d\.\,]+)/i);
  out.linkedin_msgs = gInt(/linkedin[\s\S]*?(?:tarefas realizadas|mensagens?)[^\d]*([\d\.\,]+)/i);

  return normalizeInts(out);
}

/**
 * Parser para relatório "Desempenho por Perfil"
 */
export function parsePerfil(text: string): any {
  const n = (label: RegExp): number | null => {
    const m = text.match(label);
    return m ? toNumberBr(m[1]) : null;
  };

  return normalizeInts({
    new_contacts: n(/novos contatos[^\d]*([\d\.\,]+)/i),
    unique_contacts_active: n(/contatos únicos ativos[^\d]*([\d\.\,]+)/i),
    unique_contacts_activated: n(/contatos únicos ativados[^\d]*([\d\.\,]+)/i),
    positive_connections: n(/positivas[^\d-]*([\d\.\,]+)/i),
    disqualifications: n(/desqualifica[cç][õo]es?[^\d-]*([\d\.\,]+)/i),
    mql: n(/mql[^\d-]*([\d\.\,]+)/i),
    new_clients: n(/novos clientes[^\d-]*([\d\.\,]+)/i),
    meetings_scheduled: n(/agendadas[^\d-]*([\d\.\,]+)/i),
    meetings_held: n(/realizadas[^\d-]*([\d\.\,]+)/i),
  });
}

/**
 * Parser para relatório "Resumo de Metas" (apenas para auditoria)
 */
export function parseMetas(text: string): any {
  console.log('🔍 Parseando texto de metas:', text);
  
  const n = (label: RegExp): number | null => {
    const m = text.match(label);
    const result = m ? toNumberBr(m[1]) : null;
    console.log('🔢 Regex metas result:', label.toString(), '→', m?.[1], '→', result);
    return result;
  };

  // Salvar apenas para auditoria no parsed_payload
  const result = {
    ativacoes_semanal: n(/ativa[çc][õo]es[\s\S]*?(\d+[\.\,]?\d*)/i),
    atividades_diarias: n(/atividades diárias[\s\S]*?(\d+[\.\,]?\d*)/i),
    conexoes_mes: n(/conex[õo]es do m[êe]s[\s\S]*?(\d+[\.\,]?\d*)/i)
  };
  
  console.log('📊 Resultado final do parsing metas:', result);
  return result;
}

/**
 * Filtra apenas campos válidos para prospection_weekly
 */
export function pickWeeklyFields(formValues: any): any {
  const weeklyFields = [
    'emails_sent', 'emails_replied',
    'calls_made', 'calls_connected', 
    'whatsapp_sent', 'whatsapp_connected',
    'linkedin_msgs', 'linkedin_connected',
    'meetings_scheduled', 'meetings_held',
    'positive_connections', 'disqualifications', 'active_contacts',
    'new_contacts', 'unique_contacts_activated', 'unique_contacts_active',
    'mql', 'sql', 'new_clients'
  ];

  const filtered: any = {};
  weeklyFields.forEach(field => {
    const value = formValues[field];
    filtered[field] = (value == null || isNaN(value)) ? 0 : Math.max(0, Math.round(value));
  });

  return filtered;
}