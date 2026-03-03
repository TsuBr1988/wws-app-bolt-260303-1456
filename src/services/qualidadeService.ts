import { getDatabase } from '@/lib/databaseResolver';

const supabase = getDatabase('QUALIDADE');

export interface ProcedimentoDepartamento {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ProcedimentoPasta {
  id: string;
  departamento_id: string;
  name: string;
  slug: string;
  icone?: string;
  ordem: number;
  created_at: string;
  updated_at: string;
  procedimentos_count?: number;
}

export interface Procedimento {
  id: string;
  departamento_id?: string;
  pasta_id: string;
  elaborado_por: string;
  tipo: string;
  nome_procedimento?: string;
  objetivos?: string;
  documentos_relacionados?: string;
  definicoes?: string;
  responsabilidades?: string;
  escopo?: string;
  fluxo_operacionalizacao?: string;
  sistematica?: string;
  created_at: string;
  updated_at: string;
}

export interface ProcedimentoIndicador {
  id: string;
  procedimento_id: string;
  nome_indicador: string;
  o_que_mede?: string;
  metrica?: string;
  periodicidade?: string;
  ordem: number;
  created_at: string;
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// =====================================================
// DEPARTAMENTOS
// =====================================================

export async function getDepartamentos(): Promise<ServiceResponse<ProcedimentoDepartamento[]>> {
  try {
    const { data, error } = await supabase
      .from('qualidade_procedimentos_departamentos')
      .select('*')
      .order('name');

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Erro ao buscar departamentos:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

export async function createDepartamento(data: {
  name: string;
  icon?: string;
  description?: string;
}): Promise<ServiceResponse<ProcedimentoDepartamento>> {
  try {
    const insertData: Record<string, any> = {
      name: data.name,
      description: data.description || '',
    };

    if (data.icon !== undefined) {
      insertData.icon = data.icon;
    }

    const { data: departamento, error } = await supabase
      .from('qualidade_procedimentos_departamentos')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: departamento };
  } catch (error) {
    console.error('Erro ao criar departamento:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

export async function updateDepartamento(
  id: string,
  data: { name?: string; icon?: string; description?: string }
): Promise<ServiceResponse<ProcedimentoDepartamento>> {
  try {
    const { data: departamento, error } = await supabase
      .from('qualidade_procedimentos_departamentos')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: departamento };
  } catch (error) {
    console.error('Erro ao atualizar departamento:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

export async function deleteDepartamento(id: string): Promise<ServiceResponse<void>> {
  try {
    const { error } = await supabase
      .from('qualidade_procedimentos_departamentos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar departamento:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

// =====================================================
// PASTAS
// =====================================================

export async function getPastasByDepartamento(
  departamentoId: string
): Promise<ServiceResponse<ProcedimentoPasta[]>> {
  try {
    const { data, error } = await supabase
      .from('qualidade_procedimentos_pastas')
      .select('*')
      .eq('departamento_id', departamentoId)
      .order('ordem');

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Erro ao buscar pastas:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

export async function getPastasWithCount(
  departamentoId: string
): Promise<ServiceResponse<ProcedimentoPasta[]>> {
  try {
    const { data, error } = await supabase
      .from('qualidade_procedimentos_pastas')
      .select(`
        *,
        procedimentos_count:qualidade_procedimentos(count)
      `)
      .eq('departamento_id', departamentoId)
      .order('ordem');

    if (error) throw error;

    const pastasWithCount = (data || []).map((pasta) => ({
      ...pasta,
      procedimentos_count: pasta.procedimentos_count?.[0]?.count || 0,
    }));

    return { success: true, data: pastasWithCount };
  } catch (error) {
    console.error('Erro ao buscar pastas com contador:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

// =====================================================
// PROCEDIMENTOS
// =====================================================

export async function getProcedimentosByPasta(
  pastaId: string
): Promise<ServiceResponse<Procedimento[]>> {
  try {
    const { data, error } = await supabase
      .from('qualidade_procedimentos')
      .select('*')
      .eq('pasta_id', pastaId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Erro ao buscar procedimentos:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

export async function getProcedimentoById(
  id: string
): Promise<ServiceResponse<Procedimento & { indicadores?: ProcedimentoIndicador[] }>> {
  try {
    const { data: procedimento, error: procError } = await supabase
      .from('qualidade_procedimentos')
      .select('*')
      .eq('id', id)
      .single();

    if (procError) throw procError;

    const { data: indicadores, error: indError } = await supabase
      .from('qualidade_procedimentos_indicadores')
      .select('*')
      .eq('procedimento_id', id)
      .order('ordem');

    if (indError) throw indError;

    return {
      success: true,
      data: {
        ...procedimento,
        indicadores: indicadores || [],
      },
    };
  } catch (error) {
    console.error('Erro ao buscar procedimento:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

export async function createProcedimento(
  data: Omit<Procedimento, 'id' | 'created_at' | 'updated_at'>
): Promise<ServiceResponse<Procedimento>> {
  try {
    const { data: procedimento, error } = await supabase
      .from('qualidade_procedimentos')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: procedimento };
  } catch (error) {
    console.error('Erro ao criar procedimento:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

export async function updateProcedimento(
  id: string,
  data: Partial<Omit<Procedimento, 'id' | 'created_at' | 'updated_at'>>
): Promise<ServiceResponse<Procedimento>> {
  try {
    const { data: procedimento, error } = await supabase
      .from('qualidade_procedimentos')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: procedimento };
  } catch (error) {
    console.error('Erro ao atualizar procedimento:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

export async function deleteProcedimento(id: string): Promise<ServiceResponse<void>> {
  try {
    const { error } = await supabase.from('qualidade_procedimentos').delete().eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar procedimento:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

// =====================================================
// INDICADORES
// =====================================================

export async function getIndicadoresByProcedimento(
  procedimentoId: string
): Promise<ServiceResponse<ProcedimentoIndicador[]>> {
  try {
    const { data, error } = await supabase
      .from('qualidade_procedimentos_indicadores')
      .select('*')
      .eq('procedimento_id', procedimentoId)
      .order('ordem');

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Erro ao buscar indicadores:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

export async function createIndicador(
  data: Omit<ProcedimentoIndicador, 'id' | 'created_at'>
): Promise<ServiceResponse<ProcedimentoIndicador>> {
  try {
    const { data: indicador, error } = await supabase
      .from('qualidade_procedimentos_indicadores')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: indicador };
  } catch (error) {
    console.error('Erro ao criar indicador:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

export async function updateIndicador(
  id: string,
  data: Partial<Omit<ProcedimentoIndicador, 'id' | 'created_at' | 'procedimento_id'>>
): Promise<ServiceResponse<ProcedimentoIndicador>> {
  try {
    const { data: indicador, error } = await supabase
      .from('qualidade_procedimentos_indicadores')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: indicador };
  } catch (error) {
    console.error('Erro ao atualizar indicador:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

export async function deleteIndicador(id: string): Promise<ServiceResponse<void>> {
  try {
    const { error } = await supabase
      .from('qualidade_procedimentos_indicadores')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar indicador:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

export async function syncIndicadores(
  procedimentoId: string,
  indicadores: Array<{
    id?: string;
    nome_indicador: string;
    o_que_mede?: string;
    metrica?: string;
    periodicidade?: string;
    ordem: number;
  }>
): Promise<ServiceResponse<ProcedimentoIndicador[]>> {
  try {
    const { data: existentes, error: fetchError } = await supabase
      .from('qualidade_procedimentos_indicadores')
      .select('id')
      .eq('procedimento_id', procedimentoId);

    if (fetchError) throw fetchError;

    const existentesIds = existentes?.map((ind) => ind.id) || [];
    const novosIds = indicadores.filter((ind) => ind.id).map((ind) => ind.id!);

    const idsParaDeletar = existentesIds.filter((id) => !novosIds.includes(id));
    if (idsParaDeletar.length > 0) {
      const { error: deleteError } = await supabase
        .from('qualidade_procedimentos_indicadores')
        .delete()
        .in('id', idsParaDeletar);

      if (deleteError) throw deleteError;
    }

    const indicadoresFinais: ProcedimentoIndicador[] = [];

    for (const ind of indicadores) {
      if (ind.id) {
        const { data, error } = await supabase
          .from('qualidade_procedimentos_indicadores')
          .update({
            nome_indicador: ind.nome_indicador,
            o_que_mede: ind.o_que_mede,
            metrica: ind.metrica,
            periodicidade: ind.periodicidade,
            ordem: ind.ordem,
          })
          .eq('id', ind.id)
          .select()
          .single();

        if (error) throw error;
        indicadoresFinais.push(data);
      } else {
        const { data, error } = await supabase
          .from('qualidade_procedimentos_indicadores')
          .insert({
            procedimento_id: procedimentoId,
            nome_indicador: ind.nome_indicador,
            o_que_mede: ind.o_que_mede,
            metrica: ind.metrica,
            periodicidade: ind.periodicidade,
            ordem: ind.ordem,
          })
          .select()
          .single();

        if (error) throw error;
        indicadoresFinais.push(data);
      }
    }

    return { success: true, data: indicadoresFinais };
  } catch (error) {
    console.error('Erro ao sincronizar indicadores:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}
