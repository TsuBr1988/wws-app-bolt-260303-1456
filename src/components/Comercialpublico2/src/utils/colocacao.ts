import { supabase } from "../lib/supabase";

export async function savePosicaoAtual(proposalId: string, valor: string) {
  const { data, error } = await supabase
    .from("proposals")
    .update({ posicao_atual: valor?.trim() || null })
    .eq("id", proposalId)
    .select("id, posicao_atual")
    .single();

  if (error) {
    console.error('❌ Erro ao salvar posição atual:', error);
    throw error;
  }

  return data;
}