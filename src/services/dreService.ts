import { getDatabase } from '@/lib/databaseResolver';

const supabase = getDatabase('RH');

export interface DRELinha {
  categoria: string;
  grupo: string;
  natureza: 'receita' | 'custo' | 'despesa' | 'subtotal' | 'indicador';
  ordem: number;
  previsto: number;
  realizado: number;
  codigo?: string | null;
}

interface CategoriaComValores {
  id: string;
  codigo: string | null;
  nome: string;
  grupo: string;
  natureza: string;
  ordem: number;
  previsto: number;
  realizado: number;
}

export async function buscarDREPorContrato(
  contratoId: string,
  competencia: string
): Promise<{ success: boolean; data: DRELinha[]; message?: string }> {
  try {
    const { data: categorias, error: catError } = await supabase
      .from('categorias_dre')
      .select('*')
      .order('ordem', { ascending: true });

    if (catError) {
      console.error('Erro ao buscar categorias:', catError);
      return { success: false, data: [], message: 'Erro ao buscar categorias' };
    }

    const { data: valores, error: valError } = await supabase
      .from('dre_postos')
      .select('categoria_id, tipo, valor')
      .eq('contrato_id', contratoId)
      .eq('competencia', competencia);

    if (valError) {
      console.error('Erro ao buscar valores:', valError);
      return { success: false, data: [], message: 'Erro ao buscar valores' };
    }

    const valoresMap = new Map<string, { previsto: number; realizado: number }>();

    for (const v of valores || []) {
      if (!valoresMap.has(v.categoria_id)) {
        valoresMap.set(v.categoria_id, { previsto: 0, realizado: 0 });
      }
      const entry = valoresMap.get(v.categoria_id)!;
      if (v.tipo === 'previsto') {
        entry.previsto += v.valor || 0;
      } else {
        entry.realizado += v.valor || 0;
      }
    }

    const categoriasComValores: CategoriaComValores[] = categorias.map(cat => {
      const valores = valoresMap.get(cat.id) || { previsto: 0, realizado: 0 };
      return {
        id: cat.id,
        codigo: cat.codigo,
        nome: cat.nome,
        grupo: cat.grupo,
        natureza: cat.natureza,
        ordem: cat.ordem || 0,
        previsto: valores.previsto,
        realizado: valores.realizado
      };
    });

    const dreCalculado = calcularSubtotais(categoriasComValores);

    return {
      success: true,
      data: dreCalculado.map(cat => ({
        categoria: cat.nome,
        grupo: cat.grupo,
        natureza: cat.natureza as any,
        ordem: cat.ordem,
        previsto: cat.previsto,
        realizado: cat.realizado,
        codigo: cat.codigo
      }))
    };

  } catch (error: any) {
    console.error('Erro em buscarDREPorContrato:', error);
    return { success: false, data: [], message: error.message };
  }
}

function calcularSubtotais(categorias: CategoriaComValores[]): CategoriaComValores[] {
  const resultado: CategoriaComValores[] = [];

  let receitaBrutaPrevisto = 0;
  let receitaBrutaRealizado = 0;

  let irsrPrevisto = 0;
  let irsrRealizado = 0;

  let receitaNaoOpPrevisto = 0;
  let receitaNaoOpRealizado = 0;

  let csvPrevisto = 0;
  let csvRealizado = 0;

  let receitaImpostoPrevisto = 0;
  let receitaImpostoRealizado = 0;

  let despComercialGeralPrevisto = 0;
  let despComercialGeralRealizado = 0;

  let despComercialVeiculosPrevisto = 0;
  let despComercialVeiculosRealizado = 0;

  let despComercialContratoPrevisto = 0;
  let despComercialContratoRealizado = 0;

  for (const cat of categorias) {
    if (cat.natureza === 'subtotal' || cat.natureza === 'indicador') {
      resultado.push({ ...cat, previsto: 0, realizado: 0 });
      continue;
    }

    resultado.push(cat);

    if (cat.grupo === 'Receita Bruta' && cat.natureza === 'receita') {
      receitaBrutaPrevisto += cat.previsto;
      receitaBrutaRealizado += cat.realizado;
    }

    if (cat.grupo === 'IRSR - Imposto Retido s/ Receita' && cat.natureza === 'receita') {
      irsrPrevisto += cat.previsto;
      irsrRealizado += cat.realizado;
    }

    if (cat.grupo === 'Receita não Operacional' && cat.natureza === 'receita') {
      receitaNaoOpPrevisto += cat.previsto;
      receitaNaoOpRealizado += cat.realizado;
    }

    if (cat.grupo === 'CSV - Custo Serviço Vendido' && cat.natureza === 'custo') {
      csvPrevisto += cat.previsto;
      csvRealizado += cat.realizado;
    }

    if (cat.grupo === 'Receita Bruta - Receitas de Impostos' && cat.natureza === 'receita') {
      receitaImpostoPrevisto += cat.previsto;
      receitaImpostoRealizado += cat.realizado;
    }

    if (cat.grupo === 'Despesa Comercial - Geral' && cat.natureza === 'despesa') {
      despComercialGeralPrevisto += cat.previsto;
      despComercialGeralRealizado += cat.realizado;
    }

    if (cat.grupo === 'Despesa Comercial - Veículos' && cat.natureza === 'despesa') {
      despComercialVeiculosPrevisto += cat.previsto;
      despComercialVeiculosRealizado += cat.realizado;
    }

    if (cat.grupo === 'Despesa Comercial - Contrato' && cat.natureza === 'despesa') {
      despComercialContratoPrevisto += cat.previsto;
      despComercialContratoRealizado += cat.realizado;
    }
  }

  const receitaLiquidaPrevisto = receitaBrutaPrevisto - irsrPrevisto - receitaNaoOpPrevisto;
  const receitaLiquidaRealizado = receitaBrutaRealizado - irsrRealizado - receitaNaoOpRealizado;

  const lucroBrutoPrevisto = receitaLiquidaPrevisto - csvPrevisto + receitaImpostoPrevisto;
  const lucroBrutoRealizado = receitaLiquidaRealizado - csvRealizado + receitaImpostoRealizado;

  const margemBrutaPrevisto = receitaLiquidaPrevisto !== 0 ? (lucroBrutoPrevisto / receitaLiquidaPrevisto) * 100 : 0;
  const margemBrutaRealizado = receitaLiquidaRealizado !== 0 ? (lucroBrutoRealizado / receitaLiquidaRealizado) * 100 : 0;

  const totalDespesasComerciais =
    despComercialGeralPrevisto + despComercialVeiculosPrevisto + despComercialContratoPrevisto;
  const totalDespesasComerciaisRealizado =
    despComercialGeralRealizado + despComercialVeiculosRealizado + despComercialContratoRealizado;

  const margemContribuicaoPrevisto = lucroBrutoPrevisto - totalDespesasComerciais;
  const margemContribuicaoRealizado = lucroBrutoRealizado - totalDespesasComerciaisRealizado;

  for (const cat of resultado) {
    if (cat.nome === 'Receita Bruta' && cat.natureza === 'subtotal') {
      cat.previsto = receitaBrutaPrevisto;
      cat.realizado = receitaBrutaRealizado;
    } else if (cat.nome === 'IRSR - Imposto Retido s/ Receita' && cat.natureza === 'subtotal') {
      cat.previsto = irsrPrevisto;
      cat.realizado = irsrRealizado;
    } else if (cat.nome === 'Receita não Operacional' && cat.natureza === 'subtotal') {
      cat.previsto = receitaNaoOpPrevisto;
      cat.realizado = receitaNaoOpRealizado;
    } else if (cat.nome === 'Receita Líquida' && cat.natureza === 'subtotal') {
      cat.previsto = receitaLiquidaPrevisto;
      cat.realizado = receitaLiquidaRealizado;
    } else if (cat.nome === 'CSV - Custo Serviço Vendido' && cat.natureza === 'subtotal') {
      cat.previsto = csvPrevisto;
      cat.realizado = csvRealizado;
    } else if (cat.nome === 'Receita Bruta - Receitas de Impostos' && cat.natureza === 'subtotal') {
      cat.previsto = receitaImpostoPrevisto;
      cat.realizado = receitaImpostoRealizado;
    } else if (cat.nome === 'Lucro Bruto' && cat.natureza === 'subtotal') {
      cat.previsto = lucroBrutoPrevisto;
      cat.realizado = lucroBrutoRealizado;
    } else if (cat.nome === 'Margem Bruta %' && cat.natureza === 'indicador') {
      cat.previsto = margemBrutaPrevisto;
      cat.realizado = margemBrutaRealizado;
    } else if (cat.nome === 'Despesa Comercial - Geral' && cat.natureza === 'subtotal') {
      cat.previsto = despComercialGeralPrevisto;
      cat.realizado = despComercialGeralRealizado;
    } else if (cat.nome === 'Despesa Comercial - Veículos' && cat.natureza === 'subtotal') {
      cat.previsto = despComercialVeiculosPrevisto;
      cat.realizado = despComercialVeiculosRealizado;
    } else if (cat.nome === 'Despesa Comercial - Contrato' && cat.natureza === 'subtotal') {
      cat.previsto = despComercialContratoPrevisto;
      cat.realizado = despComercialContratoRealizado;
    } else if (cat.nome === 'Margem de Contribuição' && cat.natureza === 'indicador') {
      cat.previsto = margemContribuicaoPrevisto;
      cat.realizado = margemContribuicaoRealizado;
    }
  }

  return resultado;
}

export async function listarContratosDRE(): Promise<{ id: string; codigo: string; nome: string; ativo: boolean }[]> {
  const { data, error } = await supabase
    .from('contratos_dre')
    .select('id, codigo, nome, ativo')
    .eq('ativo', true)
    .order('codigo', { ascending: true });

  if (error) {
    console.error('Erro ao listar contratos DRE:', error);
    return [];
  }

  return data || [];
}
