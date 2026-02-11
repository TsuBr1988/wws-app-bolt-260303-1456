import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as XLSX from 'npm:xlsx@0.18.5';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ImportResult {
  success: boolean;
  message: string;
  stats: {
    totalContratos: number;
    totalLinhasProcessadas: number;
    totalValoresImportados: number;
    totalLinhasIgnoradas: number;
    categoriasNaoEncontradas: string[];
    errors: string[];
  };
}

interface ColunaMapeada {
  competencia: Date;
  tipo: 'previsto' | 'realizado';
}

const mesesAbrev: { [key: string]: number } = {
  'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
  'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11,
};

function parsearColunaCompetencia(headerText: string): ColunaMapeada | null {
  if (!headerText) return null;
  const texto = headerText.toString().toLowerCase().trim();
  const match = texto.match(/(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\/(\d{2})\s+(previsto|realizado)/);
  if (!match) return null;
  const mes = mesesAbrev[match[1]];
  const ano = 2000 + parseInt(match[2]);
  const tipo = match[3] as 'previsto' | 'realizado';
  const competencia = new Date(ano, mes, 1);
  return { competencia, tipo };
}

const CATEGORIAS_IMPOSTOS_RETIDOS = [
  'iss retido sobre a receita',
  'irpj retido sobre a receita',
  'inss retido sobre a receita',
  'pis retido sobre a receita',
  'cofins retido sobre a receita'
];

function deveMapearParaImpostosRetidos(categoriaNome: string): boolean {
  const nomeLower = categoriaNome.toLowerCase().trim();
  return CATEGORIAS_IMPOSTOS_RETIDOS.includes(nomeLower);
}

async function carregarCategorias(supabase: any): Promise<Map<string, { id: string, natureza: string }>> {
  const { data, error } = await supabase
    .from('categorias_dre')
    .select('id, nome, codigo, natureza');

  if (error) {
    console.error('Erro ao carregar categorias:', error);
    return new Map();
  }

  const map = new Map<string, { id: string, natureza: string }>();
  let impostoRetidoData: { id: string, natureza: string } | null = null;

  for (const cat of data || []) {
    map.set(cat.nome.trim().toLowerCase(), { id: cat.id, natureza: cat.natureza });

    if (cat.codigo === '1.99') {
      impostoRetidoData = { id: cat.id, natureza: cat.natureza };
    }
  }

  if (impostoRetidoData) {
    for (const catNome of CATEGORIAS_IMPOSTOS_RETIDOS) {
      map.set(catNome, impostoRetidoData);
    }
  }

  return map;
}

async function processarAba(
  supabase: any,
  sheetName: string,
  sheet: any,
  categoriasMap: Map<string, { id: string, natureza: string }>,
  categoriasNaoEncontradas: Set<string>
): Promise<{ linhasProcessadas: number; valoresImportados: number; linhasIgnoradas: number; error?: string }> {
  const result = {
    linhasProcessadas: 0,
    valoresImportados: 0,
    linhasIgnoradas: 0
  };

  try {
    const partes = sheetName.split(' ');
    if (partes.length < 2) {
      return { ...result, error: `Aba "${sheetName}" não segue o padrão esperado` };
    }

    const codigo = partes[0];
    const nome = partes.slice(1).join(' ');

    const { data: existing } = await supabase
      .from('contratos_dre')
      .select('id')
      .eq('codigo', codigo)
      .maybeSingle();

    let contratoId: string;

    if (existing) {
      contratoId = existing.id;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('contratos_dre')
        .insert({ codigo, nome, ativo: true })
        .select('id')
        .single();

      if (insertError) {
        return { ...result, error: `Erro ao criar contrato "${sheetName}": ${insertError.message}` };
      }

      contratoId = inserted.id;
    }

    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    if (data.length < 2) {
      return { ...result, error: `Aba "${sheetName}" não tem dados suficientes` };
    }

    const headerRow = data[0] as any[];
    const colunasMapeadas: { [colIndex: number]: ColunaMapeada } = {};

    for (let colIdx = 1; colIdx < headerRow.length; colIdx++) {
      const headerText = headerRow[colIdx];
      const mapeamento = parsearColunaCompetencia(headerText);
      if (mapeamento) {
        colunasMapeadas[colIdx] = mapeamento;
      }
    }

    const registrosParaInserir: any[] = [];

    for (let rowIdx = 1; rowIdx < data.length; rowIdx++) {
      const row = data[rowIdx] as any[];
      const categoriaNome = row[0]?.toString().trim();

      if (!categoriaNome) continue;

      const categoriaData = categoriasMap.get(categoriaNome.toLowerCase());
      if (!categoriaData) {
        result.linhasIgnoradas++;
        categoriasNaoEncontradas.add(categoriaNome);
        continue;
      }

      if (categoriaData.natureza === 'subtotal' || categoriaData.natureza === 'indicador') {
        continue;
      }

      for (const colIdx in colunasMapeadas) {
        const colIndex = parseInt(colIdx);
        const mapeamento = colunasMapeadas[colIndex];
        const cellValue = row[colIndex];

        if (cellValue === null || cellValue === undefined || cellValue === '') {
          continue;
        }

        const valor = parseFloat(cellValue.toString().replace(/[^\d.,-]/g, '').replace(',', '.'));
        if (isNaN(valor)) continue;

        const competenciaStr = mapeamento.competencia.toISOString().split('T')[0];

        registrosParaInserir.push({
          contrato_id: contratoId,
          categoria_id: categoriaData.id,
          competencia: competenciaStr,
          tipo: mapeamento.tipo,
          valor
        });
      }

      result.linhasProcessadas++;
    }

    if (registrosParaInserir.length > 0) {
      const BATCH_SIZE = 300;
      for (let i = 0; i < registrosParaInserir.length; i += BATCH_SIZE) {
        const batch = registrosParaInserir.slice(i, i + BATCH_SIZE);

        const { error } = await supabase
          .from('dre_postos')
          .upsert(batch, {
            onConflict: 'contrato_id,categoria_id,competencia,tipo'
          });

        if (error) {
          return { ...result, error: `Erro ao inserir lote: ${error.message}` };
        }
      }

      result.valoresImportados = registrosParaInserir.length;
    }

    return result;

  } catch (error: any) {
    return { ...result, error: `Erro ao processar aba: ${error.message}` };
  }
}

async function processarExcel(
  supabase: any,
  fileBuffer: ArrayBuffer
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    message: '',
    stats: {
      totalContratos: 0,
      totalLinhasProcessadas: 0,
      totalValoresImportados: 0,
      totalLinhasIgnoradas: 0,
      categoriasNaoEncontradas: [],
      errors: []
    }
  };

  try {
    console.log('Carregando categorias em memória...');
    const categoriasMap = await carregarCategorias(supabase);
    console.log(`${categoriasMap.size} categorias carregadas`);

    const workbook = XLSX.read(fileBuffer, { type: 'array' });
    const sheetNames = workbook.SheetNames;
    console.log(`Total de abas para processar: ${sheetNames.length}`);

    const categoriasNaoEncontradas = new Set<string>();

    for (let i = 0; i < sheetNames.length; i++) {
      const sheetName = sheetNames[i];
      console.log(`[${i + 1}/${sheetNames.length}] Processando: ${sheetName}`);

      const sheet = workbook.Sheets[sheetName];
      const abaResult = await processarAba(
        supabase,
        sheetName,
        sheet,
        categoriasMap,
        categoriasNaoEncontradas
      );

      if (abaResult.error) {
        result.stats.errors.push(abaResult.error);
      } else {
        result.stats.totalContratos++;
        result.stats.totalLinhasProcessadas += abaResult.linhasProcessadas;
        result.stats.totalValoresImportados += abaResult.valoresImportados;
        result.stats.totalLinhasIgnoradas += abaResult.linhasIgnoradas;
      }

      if (i % 5 === 0) {
        console.log(`Progresso: ${i + 1}/${sheetNames.length} abas processadas`);
      }
    }

    result.stats.categoriasNaoEncontradas = Array.from(categoriasNaoEncontradas);

    result.message = `Importação concluída. ${result.stats.totalContratos} contratos processados, ${result.stats.totalValoresImportados} valores importados, ${result.stats.totalLinhasIgnoradas} linhas ignoradas.`;

    if (result.stats.categoriasNaoEncontradas.length > 0) {
      result.message += ` ATENÇÃO: ${result.stats.categoriasNaoEncontradas.length} categorias não foram encontradas.`;
    }

    return result;

  } catch (error: any) {
    result.success = false;
    result.message = `Erro ao processar Excel: ${error.message}`;
    result.stats.errors.push(error.message);
    return result;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const bucketName = 'dre';
    const fileName = 'DRE_por_postos.xlsx';

    console.log(`Baixando arquivo ${fileName} do bucket ${bucketName}...`);
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucketName)
      .download(fileName);

    if (downloadError) {
      throw new Error(`Erro ao baixar arquivo da Storage: ${downloadError.message}`);
    }

    console.log('Arquivo baixado com sucesso. Iniciando processamento...');
    const arrayBuffer = await fileData.arrayBuffer();

    const result = await processarExcel(supabase, arrayBuffer);

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: result.success ? 200 : 500
      }
    );

  } catch (error: any) {
    console.error('Erro na função:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
        stats: {
          totalContratos: 0,
          totalLinhasProcessadas: 0,
          totalValoresImportados: 0,
          totalLinhasIgnoradas: 0,
          categoriasNaoEncontradas: [],
          errors: [error.message]
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500
      }
    );
  }
});