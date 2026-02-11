import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function linkContractsToProposals() {
  const { data: contracts, error: contractsError } = await supabase
    .from('contracts')
    .select('*')
    .is('proposal_id', null);

  if (contractsError) {
    console.error('Erro ao buscar contratos:', contractsError);
    return;
  }

  console.log(`\nEncontrados ${contracts.length} contratos sem proposal_id\n`);

  let linked = 0;
  let notFound = 0;

  for (const contract of contracts) {
    const { data: proposal } = await supabase
      .from('proposals')
      .select('*')
      .ilike('nome_cliente', contract.client_name)
      .eq('situacao', 'Contrato assinado')
      .maybeSingle();

    if (proposal) {
      const { error: updateError } = await supabase
        .from('contracts')
        .update({ proposal_id: proposal.id })
        .eq('id', contract.id);

      if (!updateError) {
        console.log(`✓ Vinculado: ${contract.client_name}`);
        linked++;
      } else {
        console.error(`✗ Erro ao vincular ${contract.client_name}:`, updateError);
      }
    } else {
      console.log(`⚠ Proposta não encontrada para: ${contract.client_name}`);
      notFound++;
    }
  }

  console.log(`\n=== RESUMO ===`);
  console.log(`Vinculados: ${linked}`);
  console.log(`Não encontrados: ${notFound}`);
}

linkContractsToProposals();
