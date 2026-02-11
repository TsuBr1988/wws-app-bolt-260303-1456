import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixCreci() {
  const { data: contract, error: fetchError } = await supabase
    .from('contracts')
    .select('*')
    .ilike('client_name', '%CRECI%')
    .single();

  if (fetchError || !contract) {
    console.error('Erro ao buscar contrato:', fetchError);
    return;
  }

  console.log('\n=== CONTRATO ATUAL ===');
  console.log('Cliente:', contract.client_name);
  console.log('Data Início:', new Date(contract.start_date).toLocaleDateString('pt-BR'));
  console.log('Data Fim Atual:', new Date(contract.end_date).toLocaleDateString('pt-BR'));

  const startDate = new Date(contract.start_date);
  const correctEndDate = new Date(startDate);
  correctEndDate.setMonth(correctEndDate.getMonth() + 12);

  console.log('\n=== CORREÇÃO ===');
  console.log('Data Fim Correta (12 meses):', correctEndDate.toLocaleDateString('pt-BR'));
  console.log('\nDeseja aplicar esta correção? Execute o comando abaixo:');
  console.log(`\nconst { error } = await supabase`);
  console.log(`  .from('contracts')`);
  console.log(`  .update({ end_date: '${correctEndDate.toISOString().split('T')[0]}' })`);
  console.log(`  .eq('id', '${contract.id}');`);
}

fixCreci();
