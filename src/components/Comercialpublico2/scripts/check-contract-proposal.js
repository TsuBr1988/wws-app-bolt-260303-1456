import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkRelation() {
  // Buscar um contrato e sua proposta
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('*')
    .ilike('client_name', '%CRECI%')
    .single();

  if (contractError) {
    console.error('Erro ao buscar contrato:', contractError);
    return;
  }

  console.log('\n=== CONTRATO ===');
  console.log('ID:', contract.id);
  console.log('Cliente:', contract.client_name);
  console.log('Proposal ID:', contract.proposal_id);

  if (contract.proposal_id) {
    const { data: proposal, error: proposalError } = await supabase
      .from('propostas')
      .select('*')
      .eq('id', contract.proposal_id)
      .single();

    if (proposalError) {
      console.error('Erro ao buscar proposta:', proposalError);
      return;
    }

    console.log('\n=== PROPOSTA ORIGINAL ===');
    console.log('Cliente:', proposal.nome_cliente);
    console.log('Valor Meses (original):', proposal.valor_meses);
    console.log('Valor Mensal:', proposal.valor_mensal);
    console.log('Lance Vencedor:', proposal.lance_vencedor);
    console.log('Status:', proposal.situacao);
    console.log('Data Status:', proposal.updated_at);
  } else {
    console.log('\n⚠️ Contrato não tem proposal_id associado');
  }
}

checkRelation();
